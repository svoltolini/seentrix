import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

/**
 * CRA 101 — the foundation lesson.
 *
 * Required for every role so we can use it as the shared vocabulary. Keep the
 * body short enough that a 5-minute read + 5-question quiz really does fit
 * into the advertised duration.
 */
export const lesson: Lesson = {
  id: "cra-101",
  duration: "5 min",
  requiredForRoles: [
    "admin",
    "compliance_officer",
    "cto",
    "editor",
    "viewer",
  ],
  i18n: {
    en: {
      title: "CRA 101: scope and timeline",
      summary:
        "What the Cyber Resilience Act is, who it applies to, and the dates that matter. The baseline every teammate needs before touching anything else in Seentrix.",
      sections: [
        {
          heading: "What the CRA actually is",
          body: (
            <>
              <p>
                The Cyber Resilience Act — Regulation (EU) 2024/2847 — is an
                EU-wide law that sets baseline cybersecurity requirements for
                every <Term id="placing_on_market">product placed on the EU market</Term>{" "}
                that contains digital elements. It was adopted in 2024 and
                phases in through 2027. If we ship hardware, software,
                firmware, or an IoT device to anyone in the EU, the CRA
                applies to us.
              </p>
              <p className="mt-3">
                Two things make it different from previous EU directives:
                it&rsquo;s a <em>regulation</em> (directly binding, no
                member-state transposition needed), and it covers the entire
                product lifecycle — not just point-of-sale.
              </p>
            </>
          ),
        },
        {
          heading: "Who it applies to",
          body: (
            <>
              <p>The regulation recognises four economic operator roles:</p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Manufacturer</strong> — we&rsquo;re this if we
                  place a product on the EU market under our own name or
                  trademark. Most obligations land here.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Authorised representative</Term>
                  </strong>{" "}
                  — an EU-based party mandated by a non-EU manufacturer.
                </li>
                <li>
                  <strong>Importer</strong> — places a product from a non-EU
                  manufacturer on the EU market.
                </li>
                <li>
                  <strong>Distributor</strong> — makes a product available
                  without being the manufacturer or importer.
                </li>
              </ul>
              <p className="mt-3">
                Inside Seentrix this role is set on{" "}
                <strong>Settings → Entity role</strong>. Change it and the
                obligation checklist re-seeds.
              </p>
            </>
          ),
        },
        {
          heading: "The three dates that matter",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>11 June 2026</strong> — the day{" "}
                  <Term id="notified_body">notified body</Term> designations
                  kick in. If our conformity route involves a notified body
                  (Module B+C or Module H), we need one selected by then.
                </li>
                <li>
                  <strong>11 September 2026</strong> — mandatory incident
                  reporting starts. From this date, the{" "}
                  <Term id="article_14">Article 14</Term> 24h/72h/14d clock
                  applies to any actively-exploited vulnerability in our
                  products.
                </li>
                <li>
                  <strong>11 December 2027</strong> — full CRA compliance.
                  Every product with digital elements placed on the EU
                  market must have a{" "}
                  <Term id="doc">Declaration of Conformity</Term>, a{" "}
                  <Term id="ce_marking">CE marking</Term>, satisfy the{" "}
                  <Term id="essential_requirements">essential requirements</Term>
                  , and have a published vulnerability disclosure policy.
                </li>
              </ul>
              <p className="mt-3">
                Penalties scale up to €15 million or 2.5 % of global annual
                turnover, whichever is higher. That&rsquo;s the reason this
                isn&rsquo;t optional and why everyone on our team does this
                training.
              </p>
            </>
          ),
        },
        {
          heading: "What Seentrix does for us",
          body: (
            <>
              <p>
                Seentrix turns the CRA into a workflow: classify products,
                generate <Term id="sbom">SBOMs</Term>, track{" "}
                <Term id="vulnerability">vulnerabilities</Term>, issue the{" "}
                <Term id="doc">DoC</Term>, run the{" "}
                <Term id="article_14">Article 14</Term> reporting clock, and
                hold the evidence together for auditors. The rest of this
                Academy covers each area in depth — start with{" "}
                <strong>Annex I essential requirements</strong> or{" "}
                <strong>Vulnerability handling 101</strong> depending on
                your role.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Which of these products is NOT covered by the Cyber Resilience Act?",
          options: [
            "A smart thermostat sold in Germany",
            "An open-source CLI tool distributed commercially across the EU",
            "A cloud-only SaaS product with no on-device software",
            "A firmware blob shipped with an IoT sensor",
          ],
          correctIndex: 2,
          explanation:
            "Pure SaaS is covered by NIS2, not the CRA. The CRA applies to “products with digital elements” — hardware, software, firmware — placed on the EU market. A cloud-only service has no on-device digital element being placed on the market.",
        },
        {
          question:
            "When does full CRA compliance (including the obligation to hold a signed Declaration of Conformity for every product on the EU market) take effect?",
          options: [
            "11 June 2026",
            "11 September 2026",
            "1 January 2027",
            "11 December 2027",
          ],
          correctIndex: 3,
          explanation:
            "11 December 2027 is the full-compliance date. Earlier dates apply to notified-body designations (June 2026) and the Article 14 reporting obligation (September 2026).",
        },
        {
          question:
            "Who is the primary economic operator under the CRA when we place a product on the EU market under our own trademark?",
          options: [
            "Distributor",
            "Manufacturer",
            "Authorised representative",
            "Importer",
          ],
          correctIndex: 1,
          explanation:
            "Placing a product on the EU market under our own name or trademark makes us the manufacturer, which carries the bulk of CRA obligations.",
        },
        {
          question:
            "What is the maximum penalty under the CRA for placing a non-compliant product on the EU market?",
          options: [
            "€500,000 or 1% of global annual turnover",
            "€15 million or 2.5% of global annual turnover, whichever is higher",
            "€50 million flat",
            "Revocation of the company's trading licence",
          ],
          correctIndex: 1,
          explanation:
            "The CRA sets administrative fines up to €15M or 2.5% of global annual turnover, whichever is higher — aligned with the GDPR enforcement ceiling.",
        },
        {
          question:
            "A manufacturer based in the United States wants to sell their IoT product in the EU. What does the CRA require?",
          options: [
            "Nothing special — the CRA only applies to EU-based manufacturers",
            "They must appoint an Authorised Representative established in the EU",
            "They must open an EU subsidiary",
            "They must use a European notified body, which automatically represents them",
          ],
          correctIndex: 1,
          explanation:
            "CRA Article 18 requires non-EU manufacturers to appoint an Authorised Representative in the Union before placing products on the EU market. The AR holds the technical documentation and liaises with market surveillance authorities.",
        },
      ],
    },
    de: {
      title: "CRA 101: Anwendungsbereich und Zeitplan",
      summary:
        "Was der Cyber Resilience Act ist, für wen er gilt und welche Termine zählen. Die Basis, die jedes Teammitglied vor allem anderen in Seentrix benötigt.",
      sections: [
        {
          heading: "Was der CRA eigentlich ist",
          body: (
            <>
              <p>
                Der Cyber Resilience Act — Verordnung (EU) 2024/2847 — ist
                ein EU-weites Gesetz, das grundlegende
                Cybersicherheitsanforderungen für jedes{" "}
                <Term id="placing_on_market">auf dem EU-Markt bereitgestellte</Term>{" "}
                Produkt mit digitalen Elementen festlegt. 2024 beschlossen,
                Umsetzung bis 2027. Liefern wir Hardware, Software, Firmware
                oder ein IoT-Gerät an jemanden in der EU, gilt der CRA.
              </p>
              <p className="mt-3">
                Zwei Unterschiede zu früheren EU-Richtlinien: Es ist eine{" "}
                <em>Verordnung</em> (unmittelbar verbindlich, keine nationale
                Umsetzung nötig) und sie deckt den gesamten Produktlebenszyklus
                ab — nicht nur den Verkauf.
              </p>
            </>
          ),
        },
        {
          heading: "Für wen er gilt",
          body: (
            <>
              <p>Die Verordnung kennt vier Wirtschaftsakteursrollen:</p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Hersteller</strong> — das sind wir, wenn wir ein
                  Produkt unter eigenem Namen oder eigener Marke auf den
                  EU-Markt bringen. Die meisten Pflichten treffen hier.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Bevollmächtigter</Term>
                  </strong>{" "}
                  — eine in der EU ansässige Partei, mandatiert durch einen
                  Nicht-EU-Hersteller.
                </li>
                <li>
                  <strong>Einführer</strong> — bringt ein Produkt eines
                  Nicht-EU-Herstellers auf den EU-Markt.
                </li>
                <li>
                  <strong>Händler</strong> — stellt ein Produkt bereit, ohne
                  Hersteller oder Einführer zu sein.
                </li>
              </ul>
              <p className="mt-3">
                In Seentrix wird die Rolle unter{" "}
                <strong>Einstellungen → Rolle</strong> festgelegt. Beim
                Wechsel wird die Pflichtenliste neu erzeugt.
              </p>
            </>
          ),
        },
        {
          heading: "Die drei Termine, die zählen",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>11. Juni 2026</strong> — Benennung der{" "}
                  <Term id="notified_body">notifizierten Stellen</Term>.
                  Läuft unser Verfahren über eine notifizierte Stelle
                  (Modul B+C oder Modul H), muss sie bis dahin ausgewählt sein.
                </li>
                <li>
                  <strong>11. September 2026</strong> — verpflichtende
                  Vorfallsmeldungen starten. Ab diesem Tag gilt die{" "}
                  <Term id="article_14">Artikel-14</Term>-Meldefrist
                  24h/72h/14T bei jeder aktiv ausgenutzten Schwachstelle
                  unserer Produkte.
                </li>
                <li>
                  <strong>11. Dezember 2027</strong> — vollständige
                  CRA-Compliance. Jedes auf den EU-Markt gebrachte Produkt
                  mit digitalen Elementen braucht eine{" "}
                  <Term id="doc">Konformitätserklärung</Term>, eine{" "}
                  <Term id="ce_marking">CE-Kennzeichnung</Term>, die
                  Erfüllung der{" "}
                  <Term id="essential_requirements">grundlegenden Anforderungen</Term>{" "}
                  und eine veröffentlichte Offenlegungsrichtlinie.
                </li>
              </ul>
              <p className="mt-3">
                Bußgelder bis 15 Mio. € oder 2,5 % des weltweiten
                Jahresumsatzes, je nachdem welcher Betrag höher ist.
                Deshalb ist dieses Training Pflicht.
              </p>
            </>
          ),
        },
        {
          heading: "Was Seentrix für uns leistet",
          body: (
            <>
              <p>
                Seentrix macht aus dem CRA einen Workflow: Produkte
                klassifizieren, <Term id="sbom">SBOMs</Term> erzeugen,{" "}
                <Term id="vulnerability">Schwachstellen</Term> verfolgen,
                die <Term id="doc">Konformitätserklärung</Term> ausstellen,
                den <Term id="article_14">Artikel-14</Term>-Zähler laufen
                lassen und Nachweise audit-tauglich zusammenhalten. Die
                restliche Academy vertieft jeden Bereich — starten Sie mit{" "}
                <strong>Anhang I – grundlegende Anforderungen</strong> oder{" "}
                <strong>Schwachstellenbehandlung 101</strong> je nach Rolle.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Welches dieser Produkte fällt NICHT unter den Cyber Resilience Act?",
          options: [
            "Ein in Deutschland verkaufter smarter Thermostat",
            "Ein kommerziell EU-weit verteiltes Open-Source-CLI-Tool",
            "Ein reines Cloud-SaaS ohne Software auf dem Endgerät",
            "Ein mit einem IoT-Sensor ausgeliefertes Firmware-Paket",
          ],
          correctIndex: 2,
          explanation:
            "Reines SaaS fällt unter NIS2, nicht unter den CRA. Der CRA betrifft „Produkte mit digitalen Elementen“ — Hardware, Software, Firmware — die auf dem EU-Markt bereitgestellt werden. Ein reiner Cloud-Service hat kein digitales Element, das auf dem Markt bereitgestellt wird.",
        },
        {
          question:
            "Wann gilt die vollständige CRA-Compliance (inklusive der Pflicht, für jedes EU-Markt-Produkt eine unterzeichnete Konformitätserklärung vorzuhalten)?",
          options: [
            "11. Juni 2026",
            "11. September 2026",
            "1. Januar 2027",
            "11. Dezember 2027",
          ],
          correctIndex: 3,
          explanation:
            "Der 11. Dezember 2027 ist das Datum der vollständigen Compliance. Frühere Termine betreffen Benennung notifizierter Stellen (Juni 2026) und die Artikel-14-Meldepflicht (September 2026).",
        },
        {
          question:
            "Wer ist der primäre Wirtschaftsakteur unter dem CRA, wenn wir ein Produkt unter eigener Marke auf den EU-Markt bringen?",
          options: [
            "Händler",
            "Hersteller",
            "Bevollmächtigter",
            "Einführer",
          ],
          correctIndex: 1,
          explanation:
            "Das Inverkehrbringen unter eigener Marke oder eigenem Namen macht uns zum Hersteller — die Rolle mit den meisten CRA-Pflichten.",
        },
        {
          question:
            "Wie hoch ist das maximale Bußgeld für das Inverkehrbringen eines nicht konformen Produkts?",
          options: [
            "500.000 € oder 1 % des weltweiten Jahresumsatzes",
            "15 Mio. € oder 2,5 % des weltweiten Jahresumsatzes, je nachdem was höher ist",
            "50 Mio. € Festbetrag",
            "Entzug der Handelslizenz des Unternehmens",
          ],
          correctIndex: 1,
          explanation:
            "Der CRA sieht Bußgelder bis 15 Mio. € oder 2,5 % des weltweiten Jahresumsatzes vor — die höhere Zahl gilt. Das entspricht der DSGVO-Obergrenze.",
        },
        {
          question:
            "Ein US-Hersteller möchte sein IoT-Produkt in der EU verkaufen. Was verlangt der CRA?",
          options: [
            "Nichts Besonderes — der CRA gilt nur für EU-Hersteller",
            "Er muss einen in der EU ansässigen Bevollmächtigten benennen",
            "Er muss eine EU-Tochtergesellschaft gründen",
            "Er muss eine europäische notifizierte Stelle nutzen, die ihn automatisch vertritt",
          ],
          correctIndex: 1,
          explanation:
            "CRA Artikel 18 verlangt, dass Nicht-EU-Hersteller vor dem Inverkehrbringen einen in der Union niedergelassenen Bevollmächtigten benennen. Dieser hält die technische Dokumentation bereit und steht der Marktüberwachung zur Verfügung.",
        },
      ],
    },
    fr: {
      title: "CRA 101 : périmètre et calendrier",
      summary:
        "Ce qu’est le règlement (UE) sur la cyber-résilience (CRA), à qui il s’applique et les dates qui comptent. Le socle que chaque membre de l’équipe doit maîtriser avant tout le reste dans Seentrix.",
      sections: [
        {
          heading: "Ce qu’est réellement le CRA",
          body: (
            <>
              <p>
                Le Cyber Resilience Act — Règlement (UE) 2024/2847 — est une
                loi à portée européenne qui fixe des exigences essentielles de
                cybersécurité pour tout{" "}
                <Term id="placing_on_market">produit mis sur le marché de l’UE</Term>{" "}
                comportant des éléments numériques. Adopté en 2024, il entre
                progressivement en vigueur jusqu’en 2027. Si nous livrons du
                matériel, des logiciels, du firmware ou un appareil IoT à
                quiconque dans l’UE, le CRA nous s’applique.
              </p>
              <p className="mt-3">
                Deux points le distinguent des directives européennes
                précédentes : c’est un <em>règlement</em> (directement
                contraignant, sans transposition nationale) et il couvre
                l’intégralité du cycle de vie du produit — pas seulement la
                mise sur le marché.
              </p>
            </>
          ),
        },
        {
          heading: "À qui il s’applique",
          body: (
            <>
              <p>Le règlement reconnaît quatre rôles d’opérateur économique :</p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Fabricant</strong> — c’est notre rôle si nous
                  mettons un produit sur le marché de l’UE sous notre propre
                  nom ou marque. La majorité des obligations s’y concentre.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Mandataire</Term>
                  </strong>{" "}
                  — une partie établie dans l’UE, mandatée par un fabricant
                  hors UE.
                </li>
                <li>
                  <strong>Importateur</strong> — met sur le marché de l’UE
                  un produit d’un fabricant hors UE.
                </li>
                <li>
                  <strong>Distributeur</strong> — met un produit à
                  disposition sans être le fabricant ni l’importateur.
                </li>
              </ul>
              <p className="mt-3">
                Dans Seentrix, ce rôle est défini sous{" "}
                <strong>Paramètres → Rôle de l’entité</strong>. Le modifier
                régénère la liste de contrôle des obligations.
              </p>
            </>
          ),
        },
        {
          heading: "Les trois dates qui comptent",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>11 juin 2026</strong> — désignation des{" "}
                  <Term id="notified_body">organismes notifiés</Term>.
                  Si notre procédure d’évaluation de la conformité implique un
                  organisme notifié (Module B+C ou Module H), il doit être
                  sélectionné avant cette date.
                </li>
                <li>
                  <strong>11 septembre 2026</strong> — début de la
                  notification obligatoire des incidents. À partir de cette
                  date, l’horloge{" "}
                  <Term id="article_14">Article 14</Term> 24h/72h/14j
                  s’applique à toute vulnérabilité activement exploitée dans
                  nos produits.
                </li>
                <li>
                  <strong>11 décembre 2027</strong> — conformité CRA
                  complète. Tout produit comportant des éléments numériques
                  mis sur le marché de l’UE doit disposer d’une{" "}
                  <Term id="doc">déclaration de conformité</Term>, d’un{" "}
                  <Term id="ce_marking">marquage CE</Term>, satisfaire aux{" "}
                  <Term id="essential_requirements">exigences essentielles de cybersécurité</Term>
                  , et publier une politique de divulgation des
                  vulnérabilités.
                </li>
              </ul>
              <p className="mt-3">
                Les amendes peuvent atteindre 15 millions d’euros ou 2,5 %
                du chiffre d’affaires annuel mondial, le montant le plus
                élevé étant retenu. C’est pourquoi cette formation est
                obligatoire pour chaque membre de l’équipe.
              </p>
            </>
          ),
        },
        {
          heading: "Ce que Seentrix fait pour nous",
          body: (
            <>
              <p>
                Seentrix transforme le CRA en flux de travail : classifier les
                produits, générer des <Term id="sbom">SBOM</Term>, suivre les{" "}
                <Term id="vulnerability">vulnérabilités</Term>, émettre la{" "}
                <Term id="doc">déclaration de conformité</Term>, faire tourner
                l’horloge de notification{" "}
                <Term id="article_14">Article 14</Term> et conserver les
                preuves à disposition des auditeurs. Le reste de l’Academy
                approfondit chaque domaine — commencez par{" "}
                <strong>Annexe I — exigences essentielles</strong> ou{" "}
                <strong>Traitement des vulnérabilités 101</strong> selon
                votre rôle.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Lequel de ces produits n’est PAS couvert par le Cyber Resilience Act ?",
          options: [
            "Un thermostat intelligent vendu en Allemagne",
            "Un outil CLI open source distribué commercialement dans toute l’UE",
            "Un produit SaaS 100 % cloud sans logiciel sur l’appareil",
            "Un firmware livré avec un capteur IoT",
          ],
          correctIndex: 2,
          explanation:
            "Le SaaS pur relève de NIS2, pas du CRA. Le CRA s’applique aux « produits comportant des éléments numériques » — matériel, logiciel, firmware — mis sur le marché de l’UE. Un service entièrement dans le cloud n’a pas d’élément numérique mis sur le marché.",
        },
        {
          question:
            "Quand la conformité CRA complète (y compris l’obligation de détenir une déclaration de conformité signée pour chaque produit sur le marché de l’UE) entre-t-elle en vigueur ?",
          options: [
            "11 juin 2026",
            "11 septembre 2026",
            "1er janvier 2027",
            "11 décembre 2027",
          ],
          correctIndex: 3,
          explanation:
            "Le 11 décembre 2027 est la date de conformité complète. Les dates antérieures concernent les désignations d’organismes notifiés (juin 2026) et l’obligation de notification Article 14 (septembre 2026).",
        },
        {
          question:
            "Quel est le principal opérateur économique au sens du CRA lorsque nous mettons un produit sur le marché de l’UE sous notre propre marque ?",
          options: [
            "Distributeur",
            "Fabricant",
            "Mandataire",
            "Importateur",
          ],
          correctIndex: 1,
          explanation:
            "Mettre un produit sur le marché de l’UE sous son propre nom ou sa propre marque fait de nous le fabricant, qui supporte l’essentiel des obligations CRA.",
        },
        {
          question:
            "Quelle est l’amende maximale prévue par le CRA pour la mise sur le marché d’un produit non conforme ?",
          options: [
            "500 000 € ou 1 % du chiffre d’affaires annuel mondial",
            "15 millions d’euros ou 2,5 % du chiffre d’affaires annuel mondial, le montant le plus élevé étant retenu",
            "50 millions d’euros forfaitaires",
            "Retrait de la licence commerciale de l’entreprise",
          ],
          correctIndex: 1,
          explanation:
            "Le CRA prévoit des amendes administratives pouvant atteindre 15 M€ ou 2,5 % du chiffre d’affaires annuel mondial, le montant le plus élevé étant retenu — aligné sur le plafond d’application du RGPD.",
        },
        {
          question:
            "Un fabricant américain souhaite vendre son produit IoT dans l’UE. Que lui impose le CRA ?",
          options: [
            "Rien de particulier — le CRA ne s’applique qu’aux fabricants établis dans l’UE",
            "Il doit désigner un mandataire établi dans l’UE",
            "Il doit créer une filiale dans l’UE",
            "Il doit recourir à un organisme notifié européen, qui le représente automatiquement",
          ],
          correctIndex: 1,
          explanation:
            "L’Article 18 du CRA impose aux fabricants hors UE de désigner un mandataire établi dans l’Union avant de mettre des produits sur le marché de l’UE. Le mandataire détient la documentation technique et assure la liaison avec les autorités de surveillance du marché.",
        },
      ],
    },
    it: {
      title: "CRA 101: ambito di applicazione e calendario",
      summary:
        "Cos’è il regolamento UE sulla ciber-resilienza (CRA), a chi si applica e le date fondamentali. Il punto di partenza che ogni membro del team deve conoscere prima di usare qualsiasi altra funzione di Seentrix.",
      sections: [
        {
          heading: "Cos’è concretamente il CRA",
          body: (
            <>
              <p>
                Il Cyber Resilience Act — Regolamento (UE) 2024/2847 — è
                una legge a livello europeo che stabilisce requisiti essenziali
                di cibersicurezza per ogni{" "}
                <Term id="placing_on_market">prodotto immesso sul mercato dell’UE</Term>{" "}
                con elementi digitali. Adottato nel 2024, entra in vigore
                progressivamente fino al 2027. Se distribuiamo hardware,
                software, firmware o un dispositivo IoT a chiunque nell’UE,
                il CRA si applica a noi.
              </p>
              <p className="mt-3">
                Due aspetti lo distinguono dalle precedenti direttive UE:
                è un <em>regolamento</em> (direttamente vincolante, senza
                recepimento nazionale) e copre l’intero ciclo di vita del
                prodotto — non solo il momento di immissione sul mercato.
              </p>
            </>
          ),
        },
        {
          heading: "A chi si applica",
          body: (
            <>
              <p>Il regolamento riconosce quattro ruoli di operatore economico:</p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Fabbricante</strong> — è il nostro ruolo se
                  immettiamo un prodotto sul mercato dell’UE con il nostro
                  nome o marchio. La maggior parte degli obblighi ricade qui.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Rappresentante autorizzato</Term>
                  </strong>{" "}
                  — una parte stabilita nell’UE, incaricata da un fabbricante
                  extra-UE.
                </li>
                <li>
                  <strong>Importatore</strong> — immette sul mercato dell’UE
                  un prodotto di un fabbricante extra-UE.
                </li>
                <li>
                  <strong>Distributore</strong> — mette a disposizione un
                  prodotto senza essere il fabbricante né l’importatore.
                </li>
              </ul>
              <p className="mt-3">
                In Seentrix questo ruolo si imposta in{" "}
                <strong>Impostazioni → Ruolo dell’entità</strong>. Cambiarlo
                rigenera la lista di controllo degli obblighi.
              </p>
            </>
          ),
        },
        {
          heading: "Le tre date fondamentali",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>11 giugno 2026</strong> — designazione degli{" "}
                  <Term id="notified_body">organismi notificati</Term>.
                  Se la nostra procedura di valutazione della conformità
                  prevede un organismo notificato (Modulo B+C o Modulo H),
                  deve essere selezionato entro questa data.
                </li>
                <li>
                  <strong>11 settembre 2026</strong> — avvio della
                  notifica obbligatoria degli incidenti. Da questa data,
                  l’orologio{" "}
                  <Term id="article_14">Articolo 14</Term> 24h/72h/14gg
                  si applica a qualsiasi vulnerabilità sfruttata attivamente
                  nei nostri prodotti.
                </li>
                <li>
                  <strong>11 dicembre 2027</strong> — piena conformità CRA.
                  Ogni prodotto con elementi digitali immesso sul mercato
                  dell’UE deve disporre di una{" "}
                  <Term id="doc">dichiarazione di conformità</Term>, di una{" "}
                  <Term id="ce_marking">marcatura CE</Term>, soddisfare i{" "}
                  <Term id="essential_requirements">requisiti essenziali di cibersicurezza</Term>
                  , e avere una politica di divulgazione delle vulnerabilità
                  pubblicata.
                </li>
              </ul>
              <p className="mt-3">
                Le sanzioni possono arrivare fino a 15 milioni di euro o
                al 2,5 % del fatturato annuo mondiale, se superiore. Per
                questo la formazione è obbligatoria per tutto il team.
              </p>
            </>
          ),
        },
        {
          heading: "Cosa fa Seentrix per noi",
          body: (
            <>
              <p>
                Seentrix trasforma il CRA in un flusso di lavoro: classificare
                i prodotti, generare <Term id="sbom">SBOM</Term>, tracciare le{" "}
                <Term id="vulnerability">vulnerabilità</Term>, emettere la{" "}
                <Term id="doc">dichiarazione di conformità</Term>, avviare
                il timer di notifica{" "}
                <Term id="article_14">Articolo 14</Term> e raccogliere le
                prove per i revisori. Il resto dell’Academy approfondisce
                ogni area — iniziate con{" "}
                <strong>Allegato I — requisiti essenziali</strong> o{" "}
                <strong>Gestione delle vulnerabilità 101</strong> in base
                al vostro ruolo.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quale di questi prodotti NON è coperto dal Cyber Resilience Act?",
          options: [
            "Un termostato intelligente venduto in Germania",
            "Uno strumento CLI open source distribuito commercialmente in tutta l’UE",
            "Un prodotto SaaS interamente cloud senza software sul dispositivo",
            "Un firmware fornito con un sensore IoT",
          ],
          correctIndex: 2,
          explanation:
            "Il SaaS puro rientra nell’ambito di NIS2, non del CRA. Il CRA si applica ai «prodotti con elementi digitali» — hardware, software, firmware — immessi sul mercato dell’UE. Un servizio interamente in cloud non ha elementi digitali immessi sul mercato.",
        },
        {
          question:
            "Quando entra in vigore la piena conformità CRA (incluso l’obbligo di detenere una dichiarazione di conformità firmata per ogni prodotto sul mercato dell’UE)?",
          options: [
            "11 giugno 2026",
            "11 settembre 2026",
            "1° gennaio 2027",
            "11 dicembre 2027",
          ],
          correctIndex: 3,
          explanation:
            "L’11 dicembre 2027 è la data di piena conformità. Le date precedenti riguardano le designazioni degli organismi notificati (giugno 2026) e l’obbligo di notifica Articolo 14 (settembre 2026).",
        },
        {
          question:
            "Chi è il principale operatore economico ai sensi del CRA quando immettiamo un prodotto sul mercato dell’UE con il nostro marchio?",
          options: [
            "Distributore",
            "Fabbricante",
            "Rappresentante autorizzato",
            "Importatore",
          ],
          correctIndex: 1,
          explanation:
            "Immettere un prodotto sul mercato dell’UE con il proprio nome o marchio ci rende fabbricanti, il che comporta la maggior parte degli obblighi CRA.",
        },
        {
          question:
            "Qual è la sanzione massima prevista dal CRA per l’immissione sul mercato di un prodotto non conforme?",
          options: [
            "500 000 € o 1 % del fatturato annuo mondiale",
            "15 milioni di euro o 2,5 % del fatturato annuo mondiale, se superiore",
            "50 milioni di euro forfettari",
            "Revoca della licenza commerciale dell’azienda",
          ],
          correctIndex: 1,
          explanation:
            "Il CRA prevede sanzioni amministrative fino a 15 M€ o al 2,5 % del fatturato annuo mondiale, se superiore — allineato al massimale sanzionatorio del GDPR.",
        },
        {
          question:
            "Un fabbricante con sede negli Stati Uniti vuole vendere il proprio prodotto IoT nell’UE. Cosa richiede il CRA?",
          options: [
            "Nulla di speciale — il CRA si applica solo ai fabbricanti stabiliti nell’UE",
            "Deve designare un rappresentante autorizzato stabilito nell’UE",
            "Deve aprire una filiale nell’UE",
            "Deve avvalersi di un organismo notificato europeo, che lo rappresenta automaticamente",
          ],
          correctIndex: 1,
          explanation:
            "L’Articolo 18 del CRA impone ai fabbricanti extra-UE di designare un rappresentante autorizzato nell’Unione prima di immettere prodotti sul mercato dell’UE. Il rappresentante detiene la documentazione tecnica e funge da interlocutore con le autorità di vigilanza del mercato.",
        },
      ],
    },
  },
};

export default lesson;
