const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the real services against an in-memory Supabase substitute.
// No environment variables, credentials or network requests are used.
function fixture(status, { agentId = 1, failure = false } = {}) {
  const date = '2026-08-06'
  const assignment = { id: 10, agent_id: 1, date, site_id: 2, service: 'matin', heure_debut: '08:00', heure_fin: '10:00', statut: 'Présent', est_poste_vacant: false }
  const tables = {
    absences: status ? [{ id: 1, agent_id: agentId, type: 'Congé', date_debut: date, date_fin: date, statut_validation: status }] : [],
    planning_journalier: [], agents: [{ id: 1, nom: 'Agent' }], agent_contrats: [], agent_visites_medicales: [],
  }
  const writes = [], reads = []
  const supabase = { from(table) {
    const filters = []
    let operation = 'read', payload, singular = false
    const q = {
      select() { return q }, order() { return q }, limit() { return q },
      eq(k,v) { filters.push(row => String(row[k]) === String(v)); return q },
      neq(k,v) { filters.push(row => row[k] != null && String(row[k]) !== String(v)); return q },
      lte(k,v) { filters.push(row => row[k] <= v); return q },
      gte(k,v) { filters.push(row => row[k] >= v); return q },
      in(k,v) { filters.push(row => v.includes(row[k])); return q },
      ilike(k,v) { filters.push(row => row[k].toLowerCase() === v.toLowerCase()); return q },
      not(k,op,v) { filters.push(row => row[k] !== v); return q },
      single() { singular = true; return q }, maybeSingle() { singular = true; return q },
      insert(value) { operation = 'insert'; payload = value; return q },
      update(value) { operation = 'update'; payload = value; return q },
      delete() { operation = 'delete'; return q },
      then(resolve, reject) {
        if (table === 'absences' && failure) return Promise.resolve({ data: null, error: { message: 'Unavailable' } }).then(resolve, reject)
        const rows = tables[table] ||= []
        let result = rows.filter(row => filters.every(filter => filter(row)))
        if (operation === 'read') reads.push(table)
        else {
          writes.push({ table, operation, payload })
          if (operation === 'insert') {
            result = (Array.isArray(payload) ? payload : [payload]).map((row,i) => ({ id: 100 + i, ...row }))
            rows.push(...result)
          } else if (operation === 'update') result.forEach(row => Object.assign(row, payload))
          else tables[table] = rows.filter(row => !result.includes(row))
        }
        return Promise.resolve({ data: singular ? result[0] || null : result, error: null }).then(resolve, reject)
      },
    }
    return q
  } }
  const cache = {}
  function load(relative) {
    if (cache[relative]) return cache[relative]
    const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8')
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
    const mod = { exports: {} }
    vm.runInNewContext(output, { exports: mod.exports, module: mod, Date, Error, console, require(name) {
      if (name === '@/lib/supabase') return { supabase }
      if (name === '@/lib/core') return { agentisCore: { emit: async () => {} } }
      if (name === '@/lib/planning/roleMapping') return { mapPosteToRequirementRole: () => null }
      if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } }
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts')
      throw Error('Unexpected dependency: ' + name)
    } })
    return cache[relative] = mod.exports
  }
  const engine = load('lib/services/AvailabilityEngine.ts').default
  const service = load('lib/services/PlanningService.ts').PlanningService
  const validator = load('lib/services/PlanningValidator.ts').default
  const replacement = load('lib/services/ReplacementEngine.ts').default
  return { date, assignment, tables, writes, reads, engine, service, validator, replacement, load }
}

for (const status of ['Validée', 'En attente', 'Refusée', null]) {
  test(`creation: ${status || 'agent disponible'}`, async () => {
    const f = fixture(status)
    const action = () => f.service.createAssignment({ agent_id: 1, date: f.date, site_id: 2 })
    if (status === 'Validée') {
      await assert.rejects(action, /absence validée/)
      assert.equal(f.writes.length, 0)
    } else {
      await action()
      assert.equal(f.tables.planning_journalier.length, 1)
    }
    assert(f.reads.includes('absences'))
  })
}

test('inclusive dates, other agents and dates outside the absence', async () => {
  const f = fixture('Validée')
  f.tables.absences[0].date_fin = '2026-08-08'
  for (const date of ['2026-08-06', '2026-08-08']) await assert.rejects(() => f.engine.ensureAvailable(1, date), /absence validée/)
  for (const date of ['2026-08-05', '2026-08-09']) await f.engine.ensureAvailable(1, date)
  await f.engine.ensureAvailable(2, f.date)
  assert.equal(f.writes.length, 0)
})

for (const operation of ['edit', 'drag-and-drop', 'duplicate', 'replacement', 'replacement engine', 'periscolaire']) {
  test(`${operation}: validated absence refuses before any write`, async () => {
    const f = fixture('Validée', { agentId: operation === 'duplicate' ? 2 : 1 })
    f.tables.planning_journalier.push({ ...f.assignment })
    let action
    if (operation === 'edit') action = () => f.service.updateAssignment(10, { site_id: 3 })
    if (operation === 'drag-and-drop') action = () => f.service.moveAssignmentWithVacancy({ assignmentId: 10, date: f.date, sourceSiteId: 2, targetSiteId: 3 })
    if (operation === 'duplicate') {
      // The second agent blocks: even the first agent must not be inserted.
      f.tables.planning_journalier.push({ ...f.assignment, id: 11, agent_id: 2 })
      f.tables.absences[0].date_debut = f.tables.absences[0].date_fin = '2026-08-07'
      action = () => f.service.duplicateDay(f.date, '2026-08-07')
    }
    if (operation === 'replacement') action = () => f.service.replaceVacancy({ vacancyId: 10, agentId: 1, date: f.date })
    if (operation === 'replacement engine') action = () => f.replacement.assignCandidate({ vacancyId: 10, agentId: 1 })
    if (operation === 'periscolaire') action = () => f.service.createPeriscolaireAssignment({ date: f.date, agentId: 1, siteId: 2, serviceId: 3 })
    await assert.rejects(action, /absence validée/)
    assert.equal(f.writes.length, 0)
    assert.equal(f.tables.planning_journalier[0].site_id, 2)
  })
}

test('existing assignment edit excludes itself but still detects a different conflict', async () => {
  const f = fixture('En attente')
  f.tables.planning_journalier.push({ ...f.assignment })
  let result = await f.validator.validateAssignment({ ...f.assignment, excludeAssignmentId: 10 })
  assert.equal(result.valid, true)
  await f.service.updateAssignment(10, { site_id: 3 })
  assert.equal(f.tables.planning_journalier[0].site_id, 3)
  f.tables.planning_journalier.push({ ...f.assignment, id: 11 })
  result = await f.validator.validateAssignment({ ...f.assignment, excludeAssignmentId: 10 })
  assert.equal(result.valid, false)
  const count = f.writes.length
  await assert.rejects(() => f.service.updateAssignment(10, { site_id: 4 }), /déjà affecté/)
  assert.equal(f.writes.length, count)
})

test('editing checks the resulting agent and date, not the original assignment', async () => {
  const f = fixture('Validée', { agentId: 2 })
  f.tables.planning_journalier.push({ ...f.assignment })
  await assert.rejects(() => f.service.updateAssignment(10, { agent_id: 2 }), /absence validée/)
  f.tables.absences[0].agent_id = 1
  f.tables.absences[0].date_debut = f.tables.absences[0].date_fin = '2026-08-07'
  await assert.rejects(() => f.service.updateAssignment(10, { date: '2026-08-07' }), /absence validée/)
  assert.equal(f.writes.length, 0)
})

test('replacement confirmation rechecks absence after suggestions were computed', async () => {
  const f = fixture(null)
  assert.equal((await f.engine.checkAgentAvailability(1, f.date)).available, true)
  f.tables.absences.push({ id: 1, agent_id: 1, type: 'Congé', date_debut: f.date, date_fin: f.date, statut_validation: 'Validée' })
  await assert.rejects(() => f.service.replaceVacancy({ vacancyId: 10, agentId: 1, date: f.date }), /absence validée/)
  assert.equal(f.writes.length, 0)
})

test('availability read failure blocks before writes', async () => {
  const f = fixture(null, { failure: true })
  await assert.rejects(() => f.service.createAssignment({ agent_id: 1, date: f.date, site_id: 2 }), /Impossible de vérifier/)
  assert.equal(f.writes.length, 0)
})

test('import refuses the whole batch before deleting planning or creating sites', async () => {
  const f = fixture('Validée', { agentId: 2 })
  f.tables.agents.push({ id: 2, nom: 'Absent' })
  const { POST } = f.load('app/api/import-planning/route.ts')
  const response = await POST({ json: async () => ({ date: f.date, affectations: [{ nom: 'Agent', centre: 'New site' }, { nom: 'Absent', centre: 'Other site' }] }) })
  assert.equal(response.status, 409)
  assert.match(response.body.message, /absence validée/)
  assert.equal(f.writes.length, 0)
})

for (const status of ['En attente', 'Refusée', null]) {
  test(`allowed edit, move, duplicate and replacement: ${status || 'available'}`, async () => {
    {
      const f = fixture(status)
      f.tables.planning_journalier.push({ ...f.assignment })
      await f.service.updateAssignment(10, { site_id: 3 })
      assert.equal(f.tables.planning_journalier[0].site_id, 3)
    }
    {
      const f = fixture(status)
      f.tables.planning_journalier.push({ ...f.assignment })
      await f.service.moveAssignmentWithVacancy({ assignmentId: 10, date: f.date, sourceSiteId: 2, sourceService: 'matin', sourceStart: '08:00', sourceEnd: '10:00', targetSiteId: 3, targetService: 'matin', targetStart: '08:00', targetEnd: '10:00' })
      assert.equal(f.tables.planning_journalier[0].site_id, 3)
      assert(f.tables.planning_journalier.some(row => row.agent_id === null && row.est_poste_vacant))
    }
    {
      const f = fixture(status)
      f.tables.planning_journalier.push({ ...f.assignment, date: '2026-08-05' })
      await f.service.duplicateDay('2026-08-05', f.date)
      assert.equal(f.tables.planning_journalier.filter(row => row.date === f.date).length, 1)
    }
    {
      const f = fixture(status)
      f.tables.planning_journalier.push({ ...f.assignment, agent_id: null, est_poste_vacant: true })
      await f.service.replaceVacancy({ vacancyId: 10, agentId: 1, date: f.date, siteId: 2, service: 'matin', start: '08:00', end: '10:00' })
      assert.equal(f.tables.planning_journalier[0].agent_id, 1)
      assert.equal(f.tables.planning_journalier[0].est_poste_vacant, false)
    }
    {
      const f = fixture(status)
      f.tables.agents[0].statut = 'Actif'
      f.tables.planning_journalier.push({ ...f.assignment, agent_id: null, est_poste_vacant: true })
      await f.replacement.assignCandidate({ vacancyId: 10, agentId: 1 })
      assert.equal(f.tables.planning_journalier[0].agent_id, 1)
    }
  })
}
