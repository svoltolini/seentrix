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
  },
};

export default lesson;
