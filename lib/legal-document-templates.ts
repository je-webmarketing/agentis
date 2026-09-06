export type LegalSettings = {
  company_name?: string | null
  legal_form?: string | null
  share_capital?: string | null

  siren?: string | null
  siret?: string | null
  rcs?: string | null

  registered_address?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null

  contact_email?: string | null
  contact_phone?: string | null

  publication_director?: string | null

  host_name?: string | null
  host_address?: string | null
  host_postal_code?: string | null
  host_city?: string | null
  host_country?: string | null
  host_phone?: string | null

  privacy_contact_email?: string | null

  dpo_name?: string | null
  dpo_email?: string | null

  website_url?: string | null
}

export type LegalDocumentTemplate = {
  key: string
  title: string
  type:
    | "mentions_legales"
    | "confidentialite"
    | "cookies"
    | "cgu"
    | "rgpd"
  version: string
  content: string
}

function value(
  input: string | null | undefined,
  fallback: string
) {
  const cleaned =
    String(input ?? "").trim()

  return cleaned || fallback
}

function companyAddress(
  settings: LegalSettings
) {
  return [
    value(
      settings.registered_address,
      "[Adresse du siège]"
    ),
    value(
      settings.postal_code,
      "[Code postal]"
    ),
    value(
      settings.city,
      "[Ville]"
    ),
    value(
      settings.country,
      "France"
    ),
  ].join(" ")
}

function hostAddress(
  settings: LegalSettings
) {
  return [
    value(
      settings.host_address,
      "[Adresse de l’hébergeur]"
    ),
    value(
      settings.host_postal_code,
      "[Code postal]"
    ),
    value(
      settings.host_city,
      "[Ville]"
    ),
    value(
      settings.host_country,
      "[Pays]"
    ),
  ].join(" ")
}

export function generateMentionsLegales(
  settings: LegalSettings
): LegalDocumentTemplate {
  const company =
    value(
      settings.company_name,
      "[Raison sociale de l’éditeur]"
    )

  return {
    key: "mentions_legales",
    title: "Mentions légales",
    type: "mentions_legales",
    version: "1.0",

    content: `MENTIONS LÉGALES – AGENTIS

Dernière mise à jour : [date à renseigner]

1. ÉDITEUR DU SERVICE

Le logiciel AGENTIS est édité par :

Raison sociale : ${company}
Forme juridique : ${value(
      settings.legal_form,
      "[Forme juridique]"
    )}
Capital social : ${value(
      settings.share_capital,
      "[Capital social]"
    )}
Adresse du siège : ${companyAddress(
      settings
    )}
SIREN : ${value(
      settings.siren,
      "[SIREN]"
    )}
SIRET : ${value(
      settings.siret,
      "[SIRET]"
    )}
RCS : ${value(
      settings.rcs,
      "[RCS le cas échéant]"
    )}

E-mail : ${value(
      settings.contact_email,
      "[E-mail de contact]"
    )}
Téléphone : ${value(
      settings.contact_phone,
      "[Téléphone]"
    )}

Site officiel : ${value(
      settings.website_url,
      "[URL officielle d’AGENTIS]"
    )}

2. DIRECTEUR DE LA PUBLICATION

Directeur de la publication : ${value(
      settings.publication_director,
      "[Nom du directeur de publication]"
    )}

3. HÉBERGEMENT

Le service AGENTIS est hébergé par :

Hébergeur : ${value(
      settings.host_name,
      "[Nom de l’hébergeur]"
    )}
Adresse : ${hostAddress(settings)}
${settings.host_phone?.trim()
  ? `Téléphone : ${settings.host_phone.trim()}`
  : ""}

4. PROPRIÉTÉ INTELLECTUELLE

AGENTIS, son interface, ses éléments graphiques, ses contenus, sa structure, son code et plus généralement les éléments composant le logiciel sont protégés par les règles applicables en matière de propriété intellectuelle.

Toute reproduction, représentation, adaptation, extraction ou réutilisation non autorisée est interdite, sauf accord écrit préalable de l’éditeur ou disposition légale contraire.

5. RESPONSABILITÉ

AGENTIS est un outil logiciel destiné à assister ses utilisateurs dans leurs activités de gestion et de pilotage.

L’utilisateur reste responsable des données saisies, importées, exploitées ou diffusées au moyen du service, ainsi que des décisions prises à partir des informations affichées par AGENTIS.

L’éditeur s’efforce d’assurer la disponibilité et la fiabilité du service, sans pouvoir garantir une disponibilité permanente ou l’absence totale d’erreur.

6. LIENS ET SERVICES TIERS

AGENTIS peut intégrer ou permettre l’utilisation de services, API ou ressources provenant de tiers.

Ces services restent soumis à leurs propres conditions d’utilisation, politiques de confidentialité et règles de fonctionnement.

7. CONTACT

Pour toute question concernant AGENTIS :

E-mail : ${value(
      settings.contact_email,
      "[E-mail de contact]"
    )}

---

Document de travail généré automatiquement par AGENTIS.
Ce contenu doit être relu et validé avant publication.`,
  }
}

export function generatePrivacyPolicy(
  settings: LegalSettings
): LegalDocumentTemplate {
  const privacyEmail =
    value(
      settings.privacy_contact_email ||
        settings.dpo_email ||
        settings.contact_email,
      "[E-mail de contact confidentialité]"
    )

  return {
    key: "politique_confidentialite",
    title:
      "Politique de confidentialité",
    type: "confidentialite",
    version: "1.0",

    content: `POLITIQUE DE CONFIDENTIALITÉ – AGENTIS

Dernière mise à jour : [date à renseigner]

1. OBJET

La présente politique décrit les principes appliqués par AGENTIS concernant le traitement des données personnelles utilisées dans le cadre de son logiciel et de ses services associés.

2. RESPONSABLE DU TRAITEMENT

Responsable : ${value(
      settings.company_name,
      "[Raison sociale]"
    )}

Adresse : ${companyAddress(settings)}

Contact confidentialité : ${privacyEmail}

${settings.dpo_name
  ? `DPO / Référent : ${settings.dpo_name}`
  : "DPO / Référent : [à renseigner si applicable]"}

${settings.dpo_email
  ? `E-mail DPO : ${settings.dpo_email}`
  : "E-mail DPO : [à renseigner si applicable]"}

3. CATÉGORIES DE DONNÉES SUSCEPTIBLES D’ÊTRE TRAITÉES

Selon l’utilisation faite d’AGENTIS, les données peuvent notamment comprendre :

- identité et coordonnées professionnelles ;
- informations liées aux comptes utilisateurs ;
- informations relatives aux agents et collaborateurs ;
- affectations, absences, plannings et données RH ;
- documents administratifs ;
- informations techniques de connexion ;
- journaux d’activité et de sécurité ;
- données importées depuis des sources externes configurées par l’organisation cliente.

4. FINALITÉS

Les données peuvent être utilisées notamment pour :

- fournir les fonctionnalités d’AGENTIS ;
- gérer les comptes et les habilitations ;
- gérer les agents, absences, plannings et affectations ;
- assurer la sécurité du service ;
- tracer certaines opérations sensibles ;
- gérer les sauvegardes ;
- assurer le support et la maintenance ;
- améliorer la qualité du service ;
- respecter les obligations applicables.

5. BASES DE TRAITEMENT

Les bases applicables peuvent varier selon les traitements réalisés et la relation entre l’éditeur, l’organisation cliente et les personnes concernées.

Elles doivent être précisées en fonction du contexte réel d’exploitation d’AGENTIS.

6. DESTINATAIRES

Les données sont accessibles uniquement aux personnes autorisées en fonction de leurs rôles et droits dans AGENTIS.

Certaines données peuvent également être traitées par des prestataires techniques intervenant pour l’hébergement, la maintenance, la sécurité ou d’autres services nécessaires au fonctionnement d’AGENTIS.

7. DURÉES DE CONSERVATION

Les durées de conservation doivent être définies selon la nature des données, leur finalité et les obligations applicables.

Les règles de conservation effectivement retenues pour AGENTIS doivent être documentées avant publication définitive de cette politique.

8. SÉCURITÉ

AGENTIS met en œuvre des mécanismes techniques et organisationnels destinés à limiter les accès non autorisés et à protéger les données utilisées par le service.

Ces mécanismes peuvent notamment inclure l’authentification, la gestion des rôles, des permissions, la journalisation, les contrôles d’accès et les sauvegardes.

9. DROITS DES PERSONNES

Selon la réglementation applicable et la situation concernée, les personnes peuvent disposer de droits relatifs à leurs données personnelles.

Les demandes peuvent être adressées à :

${privacyEmail}

10. SOUS-TRAITANTS ET SERVICES TIERS

AGENTIS peut s’appuyer sur des prestataires ou services techniques tiers.

La liste réellement applicable devra être tenue à jour en fonction de l’architecture de production du service.

11. ÉVOLUTIONS

Cette politique peut être mise à jour afin de tenir compte de l’évolution d’AGENTIS, de ses fonctionnalités ou du cadre applicable.

---

Document de travail généré automatiquement par AGENTIS.
Ce contenu doit être adapté au fonctionnement réel du service et validé avant publication.`,
  }
}

export function generateCookiePolicy(
  settings: LegalSettings
): LegalDocumentTemplate {
  return {
    key: "politique_cookies",
    title:
      "Politique relative aux cookies",
    type: "cookies",
    version: "1.0",

    content: `POLITIQUE RELATIVE AUX COOKIES – AGENTIS

Dernière mise à jour : [date à renseigner]

1. OBJET

Cette politique présente les principes applicables aux cookies et autres technologies similaires pouvant être utilisés sur les interfaces web d’AGENTIS.

Site concerné : ${value(
      settings.website_url,
      "[URL officielle d’AGENTIS]"
    )}

2. COOKIES STRICTEMENT NÉCESSAIRES

Certains cookies ou mécanismes techniques peuvent être nécessaires au fonctionnement du service, par exemple pour :

- maintenir une session authentifiée ;
- assurer la sécurité ;
- mémoriser certains choix techniques ;
- assurer le bon fonctionnement de l’application.

3. COOKIES OU TRACEURS OPTIONNELS

Si AGENTIS utilise ultérieurement des outils d’analyse d’audience, de mesure, de personnalisation, de publicité ou d’autres technologies optionnelles, leur utilisation devra être décrite précisément dans cette politique.

4. CONSENTEMENT

Lorsque l’utilisation d’un traceur nécessite un choix de l’utilisateur, AGENTIS devra permettre à celui-ci d’exprimer ce choix avant activation du traceur concerné.

5. RETRAIT ET MODIFICATION DES CHOIX

Lorsque des préférences relatives aux cookies sont proposées, l’utilisateur doit pouvoir modifier ses choix depuis le mécanisme prévu à cet effet.

6. LISTE DES TRACEURS

À compléter avant publication en fonction des outils réellement utilisés en production :

- Nom : [à renseigner]
- Fournisseur : [à renseigner]
- Finalité : [à renseigner]
- Durée : [à renseigner]
- Catégorie : [nécessaire / mesure / autre]

7. CONTACT

Pour toute question :

${value(
      settings.privacy_contact_email ||
        settings.contact_email,
      "[E-mail de contact]"
    )}

---

Document de travail généré automatiquement par AGENTIS.
La liste des traceurs doit être contrôlée à partir de l’environnement réel de production avant publication.`,
  }
}

export function generateRgpdDocument(
  settings: LegalSettings
): LegalDocumentTemplate {
  return {
    key: "rgpd",
    title:
      "Protection des données personnelles",
    type: "rgpd",
    version: "1.0",

    content: `PROTECTION DES DONNÉES PERSONNELLES – AGENTIS

Dernière mise à jour : [date à renseigner]

1. ENGAGEMENT GÉNÉRAL

AGENTIS est conçu pour gérer des informations liées aux ressources humaines, aux plannings, aux absences, aux affectations et à d’autres processus métier.

La protection des données personnelles doit être prise en compte tout au long de l’utilisation du logiciel.

2. CONTACT

Responsable / éditeur :

${value(
      settings.company_name,
      "[Raison sociale]"
    )}

Contact confidentialité :

${value(
      settings.privacy_contact_email ||
        settings.contact_email,
      "[E-mail confidentialité]"
    )}

DPO / Référent :

${value(
      settings.dpo_name,
      "[À renseigner si applicable]"
    )}

E-mail DPO :

${value(
      settings.dpo_email,
      "[À renseigner si applicable]"
    )}

3. RÔLES DES PARTIES

Selon le contexte d’utilisation, l’organisation cliente et l’éditeur d’AGENTIS peuvent avoir des rôles différents concernant les traitements de données.

Ces rôles doivent être définis contractuellement selon les traitements réellement mis en œuvre.

4. CONTRÔLE DES ACCÈS

AGENTIS prévoit notamment :

- gestion des utilisateurs ;
- gestion des rôles ;
- gestion des permissions ;
- contrôle des périmètres d’accès ;
- journalisation de certaines opérations sensibles ;
- gestion des sessions ;
- mécanismes de sauvegarde et de contrôle d’intégrité.

5. MINIMISATION DES DONNÉES

Les organisations utilisant AGENTIS sont invitées à ne traiter que les informations nécessaires à leurs finalités métier.

6. CONSERVATION

Les règles de conservation doivent être définies selon les catégories de données exploitées par l’organisation cliente et les obligations qui lui sont applicables.

7. DROITS DES PERSONNES

Les mécanismes permettant la gestion des demandes relatives aux droits des personnes doivent être définis dans les procédures du responsable du traitement concerné.

8. SOUS-TRAITANCE

Lorsque AGENTIS intervient comme prestataire pour le compte d’une organisation cliente, les conditions relatives au traitement des données doivent être définies dans les documents contractuels appropriés.

9. INCIDENTS

Les événements susceptibles d’affecter la sécurité ou la confidentialité des données doivent être traités selon les procédures de sécurité prévues pour AGENTIS.

10. ÉVOLUTIONS

Ce document doit évoluer avec le logiciel, ses fonctionnalités, ses sous-traitants et son architecture technique.

---

Document de travail généré automatiquement par AGENTIS.
La qualification juridique exacte des rôles et traitements doit être vérifiée avant publication.`,
  }
}

export function generateCgu(
  settings: LegalSettings
): LegalDocumentTemplate {
  return {
    key: "cgu",
    title:
      "Conditions Générales d’Utilisation",
    type: "cgu",
    version: "1.0",

    content: `CONDITIONS GÉNÉRALES D’UTILISATION – AGENTIS

Dernière mise à jour : [date à renseigner]

1. OBJET

Les présentes Conditions Générales d’Utilisation ont pour objet de définir les règles d’accès et d’utilisation du logiciel AGENTIS.

AGENTIS est édité par :

${value(
      settings.company_name,
      "[Raison sociale]"
    )}

2. ACCÈS AU SERVICE

L’accès à AGENTIS peut nécessiter la création d’un compte utilisateur et l’attribution de droits spécifiques.

L’utilisateur doit utiliser ses accès de manière personnelle et sécurisée.

3. COMPTES UTILISATEURS

Chaque utilisateur est responsable de l’utilisation de son compte.

Toute utilisation suspecte ou accès non autorisé doit être signalé selon les procédures mises à disposition.

4. RÔLES ET PERMISSIONS

AGENTIS permet d’attribuer différents rôles et niveaux d’accès.

Les fonctionnalités accessibles à un utilisateur dépendent notamment de son rôle, de ses permissions et de son périmètre d’intervention.

5. UTILISATION DU SERVICE

L’utilisateur s’engage notamment à :

- utiliser AGENTIS conformément à sa finalité ;
- ne pas tenter de contourner les mécanismes de sécurité ;
- ne pas accéder à des données auxquelles il n’est pas autorisé ;
- ne pas compromettre le fonctionnement du service ;
- respecter les droits des tiers.

6. DONNÉES

L’organisation cliente reste responsable de la qualité, de la pertinence et de la légitimité des données qu’elle saisit, importe ou utilise dans AGENTIS.

7. DISPONIBILITÉ

L’éditeur met en œuvre les moyens raisonnables pour assurer le fonctionnement du service.

Des interruptions peuvent néanmoins intervenir notamment pour maintenance, mise à jour, incident ou évolution technique.

8. SÉCURITÉ

AGENTIS intègre différents mécanismes de sécurité, notamment la gestion des accès, permissions, journaux et sauvegardes.

9. PROPRIÉTÉ INTELLECTUELLE

AGENTIS et ses composants restent protégés par les droits applicables.

L’accès au logiciel n’emporte aucun transfert de propriété intellectuelle au profit de l’utilisateur ou de l’organisation cliente.

10. SERVICES TIERS

Certaines fonctionnalités peuvent dépendre de services ou fournisseurs tiers.

Leur fonctionnement peut être soumis aux règles et conditions propres à ces fournisseurs.

11. SUSPENSION

L’accès à AGENTIS peut être suspendu lorsqu’une mesure est nécessaire pour assurer la sécurité, protéger les données ou faire respecter les conditions applicables.

12. MODIFICATION DES CONDITIONS

Les présentes conditions peuvent évoluer afin de tenir compte des évolutions fonctionnelles, techniques ou organisationnelles d’AGENTIS.

13. CONTACT

${value(
      settings.contact_email,
      "[E-mail de contact]"
    )}

Site :

${value(
      settings.website_url,
      "[Site officiel AGENTIS]"
    )}

---

Document de travail généré automatiquement par AGENTIS.
Les conditions commerciales, abonnements, responsabilités contractuelles et éventuelles CGV doivent être traités séparément avant commercialisation.`,
  }
}

export function generateLegalDocument(
  type:
    | "mentions_legales"
    | "confidentialite"
    | "cookies"
    | "cgu"
    | "rgpd",
  settings: LegalSettings
) {
  switch (type) {
    case "mentions_legales":
      return generateMentionsLegales(
        settings
      )

    case "confidentialite":
      return generatePrivacyPolicy(
        settings
      )

    case "cookies":
      return generateCookiePolicy(
        settings
      )

    case "cgu":
      return generateCgu(
        settings
      )

    case "rgpd":
      return generateRgpdDocument(
        settings
      )
  }
}