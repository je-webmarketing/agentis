const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Render component props and exercise handlers with a simulated Next router.
// No Supabase calls or browser persistence writes occur outside this fixture.
function fixture(initialUrl = 'date=2026-08-05&site=École&agent=Martin&technique=1') {
  let params = new URLSearchParams(initialUrl)
  let optimistic, pending = false
  const pushes = [], cache = {}, contexts = [], stored = {}
  const jsx = (type, props) => {
    if (type?.context) type.context.value = props.value
    return { type, props }
  }
  const react = {
    createContext(value) { const ctx = { value }; ctx.Provider = { context: ctx }; contexts.push(ctx); return ctx },
    useContext: ctx => ctx.value,
    useOptimistic: value => [optimistic ?? value, value => { optimistic = value }],
    useTransition: () => [pending, fn => { pending = true; fn() }],
    useEffect: () => {},
    useState: value => [value, () => {}],
  }
  const navigation = {
    usePathname: () => '/dashboard/planning',
    useSearchParams: () => params,
    useRouter: () => ({ push: (url, options) => pushes.push({ url, options }) }),
  }
  function load(file) {
    if (cache[file]) return cache[file]
    const module = { exports: {} }
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    vm.runInNewContext(code, {
      exports: module.exports, module, Date, URLSearchParams, Error,
      window: { localStorage: { setItem: (key, value) => { stored[key] = value } } }, document: {},
      require(name) {
        if (name === 'react') return react
        if (name === 'next/navigation') return navigation
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
        if (name === './PlanningDateNavigation') return load('components/agentis/planning/PlanningDateNavigation.tsx')
        return {}
      },
    })
    return cache[file] = module.exports
  }
  const dateModule = load('components/agentis/planning/PlanningDateNavigation.tsx')
  const Toolbar = load('components/agentis/planning/PlanningToolbar.tsx').default
  function nodes(node) {
    if (!node || typeof node !== 'object') return []
    return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)]
  }
  function render() {
    const provider = dateModule.default({ selectedDate: '2026-08-05', children: 'planning data' })
    const toolbar = Toolbar()
    const topConfig = nodes(toolbar).find(node => node.type === dateModule.PlanningDateInput)
    const upper = dateModule.PlanningDateInput(topConfig.props)
    const lower = dateModule.PlanningDateInput({ id: 'planning-filter-date', name: 'date' })
    return { provider, toolbar, upper, lower, nodes }
  }
  return {
    render, pushes,
    finishNavigation() { params = new URL(pushes.at(-1).url, 'https://agentis.invalid').searchParams; optimistic = undefined; pending = false },
    changeUrl(query) { params = new URLSearchParams(query); optimistic = undefined; pending = false },
  }
}

test('direct calendar selection synchronizes both inputs and the header before navigation finishes', () => {
  const f = fixture()
  f.render().lower.props.onChange({ target: { value: '2026-08-06' } })
  const view = f.render()
  assert.equal(view.upper.props.value, '2026-08-06')
  assert.equal(view.lower.props.value, '2026-08-06')
  assert(view.nodes(view.toolbar).some(node => node.props?.children === 'Jeudi 06 août 2026'))
  const query = new URL(f.pushes[0].url, 'https://agentis.invalid').searchParams
  assert.equal(query.get('date'), '2026-08-06')
  for (const [key, value] of [['site', 'École'], ['agent', 'Martin'], ['technique', '1']]) assert.equal(query.get(key), value)
  assert.equal(f.pushes[0].options.scroll, false)
})

test('upper calendar uses the same navigation and preserves repeated/unknown query parameters', () => {
  const f = fixture('date=2026-08-05&custom=a&custom=b')
  f.render().upper.props.onChange({ target: { value: '2026-08-06' } })
  assert.deepEqual(new URL(f.pushes[0].url, 'https://agentis.invalid').searchParams.getAll('custom'), ['a', 'b'])
  f.finishNavigation()
  const view = f.render()
  assert.equal(view.upper.props.value, '2026-08-06')
  assert.equal(view.lower.props.value, '2026-08-06')
  assert.equal(view.lower.props.name, 'date')
})

test('previous/next arrows synchronize dates including month boundaries', () => {
  const f = fixture('date=2026-08-01&site=Example')
  let view = f.render()
  view.nodes(view.toolbar).find(node => node.props?.title === 'Jour précédent').props.onClick()
  f.finishNavigation()
  view = f.render()
  assert.equal(view.upper.props.value, '2026-07-31')
  assert.equal(view.lower.props.value, '2026-07-31')
  view.nodes(view.toolbar).find(node => node.props?.title === 'Jour suivant').props.onClick()
  f.finishNavigation()
  assert.equal(f.render().lower.props.value, '2026-08-01')
  assert.equal(new URL(f.pushes[1].url, 'https://agentis.invalid').searchParams.get('site'), 'Example')
})

test('pending navigation shows loading and prevents interaction with stale planning data', () => {
  const f = fixture()
  f.render().upper.props.onChange({ target: { value: '2026-08-06' } })
  const view = f.render()
  assert.equal(view.upper.props.disabled, true)
  assert.equal(view.lower.props.disabled, true)
  assert(view.nodes(view.provider).some(node => node.props?.inert === true))
  assert(view.nodes(view.provider).some(node => node.props?.role === 'status'))
  f.finishNavigation()
  assert.equal(f.render().lower.props.disabled, false)
})

test('URL wins on fresh mount (F5), back/forward and external filter navigation', () => {
  const f = fixture('date=2026-08-06&site=Example')
  let view = f.render()
  assert.equal(view.upper.props.value, '2026-08-06')
  assert.equal(view.lower.props.value, '2026-08-06')
  f.changeUrl('date=2026-08-05&site=Other')
  view = f.render()
  assert.equal(view.upper.props.value, '2026-08-05')
  assert.equal(view.lower.props.value, '2026-08-05')
})

test('empty/invalid/same date does not navigate or change the selected date', () => {
  const f = fixture()
  for (const value of ['', 'invalid', '2026-02-30', '2026-08-05']) f.render().lower.props.onChange({ target: { value } })
  assert.equal(f.pushes.length, 0)
  assert.equal(f.render().upper.props.value, '2026-08-05')
})
