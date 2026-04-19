/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "economic-operator-roles",
  duration: "5 min",
  requiredForRoles: ["admin", "compliance_officer"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Economic-operator roles",
      summary:
        "Manufacturer, authorised representative, importer, distributor — the four CRA roles and what obligations each one carries.",
      sections: [
        {
          heading: "Why the role matters",
          body: (
            <p>
              The CRA calibrates obligations by role. A manufacturer owns
              the conformity assessment and the DoC. An importer verifies
              the manufacturer's work. A distributor just checks the CE
              marking is there. Picking the right role for our org on{" "}
              <strong>Settings → Entity role</strong> reshapes our
              obligation checklist — wrong role = wrong checklist = wrong
              evidence for an audit.
            </p>
          ),
        },
        {
          heading: "The four roles",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Manufacturer.</strong> We place the product on
                  the EU market under our own name or trademark. We own
                  Annex I, Annex V, Article 13, Article 14 — the full set.
                  Most Seentrix customers are here.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Authorised representative</Term>
                    .
                  </strong>{" "}
                  EU-based, mandated in writing by a non-EU manufacturer.
                  Holds the technical documentation and liaises with market
                  surveillance on the manufacturer's behalf. Required under{" "}
                  <strong>Article 18</strong> whenever the manufacturer
                  sits outside the EU.
                </li>
                <li>
                  <strong>Importer.</strong> Places a non-EU-manufactured
                  product on the EU market. Verifies the DoC exists, the
                  CE marking is present, and the manufacturer has a valid
                  authorised representative. Not responsible for producing
                  the DoC, but <em>is</em> liable if they place a
                  non-compliant product.
                </li>
                <li>
                  <strong>Distributor.</strong> Sells a product without
                  being the manufacturer or the importer. Checks CE marking
                  + DoC availability + user instructions. Lightest
                  obligation set, but still has a duty to refuse to sell
                  products that obviously don't comply.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "The “substantial modification” rule",
          body: (
            <p>
              A distributor or importer who <em>substantially modifies</em>{" "}
              a product — adding new firmware, re-branding it, changing its
              cybersecurity posture — becomes the manufacturer in the eyes
              of the CRA, with the full obligation set. White-labelling an
              OEM product and flashing our own firmware is substantial
              modification; bundling it in a box with a leaflet is not.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "We buy an IoT device from a US manufacturer and sell it in the EU with no changes. What role are we under the CRA?",
          options: [
            "Manufacturer",
            "Authorised representative",
            "Importer",
            "Distributor",
          ],
          correctIndex: 2,
          explanation:
            "Placing a non-EU-manufactured product on the EU market makes us the importer. We're responsible for verifying DoC + CE marking + authorised representative, but the manufacturer still owns the Annex I work.",
        },
        {
          question:
            "We buy an OEM device, flash our own firmware, and sell it under our brand. What role?",
          options: [
            "Distributor — we didn't build the hardware",
            "Manufacturer — flashing firmware under our brand is substantial modification",
            "Importer, because someone else made the hardware",
            "Authorised representative of the OEM",
          ],
          correctIndex: 1,
          explanation:
            "Substantial modification (our firmware, our brand) makes us the manufacturer under the CRA. We inherit the full obligation set including Annex I and DoC.",
        },
        {
          question:
            "A non-EU manufacturer wants to sell directly in the EU without appointing a representative. Can they?",
          options: [
            "Yes, if the product is CE-marked",
            "Yes, if the importer accepts the technical documentation",
            "No — Article 18 requires an authorised representative in the EU",
            "Only for Important Class II products",
          ],
          correctIndex: 2,
          explanation:
            "Article 18 is unconditional: non-EU manufacturers must appoint an EU-based authorised representative before placing products on the EU market. No workaround.",
        },
        {
          question:
            "Which operator holds primary responsibility for Annex I compliance?",
          options: [
            "Manufacturer",
            "Authorised representative",
            "Importer",
            "Distributor",
          ],
          correctIndex: 0,
          explanation:
            "The manufacturer is the operator who must satisfy Annex I, prepare the technical documentation, and issue the DoC. Other operators verify or support but don't own compliance.",
        },
        {
          question:
            "Our org setting in Seentrix is marked as Manufacturer, but we're actually just an EU distributor. What's the impact?",
          options: [
            "Nothing — the setting is cosmetic",
            "The obligation checklist pushes Annex I + DoC tasks we aren't actually responsible for — distracting but not unsafe",
            "We inherit manufacturer liability through the misconfiguration, which is exactly what we shouldn't claim in an audit",
            "The distributor tasks are added automatically on top",
          ],
          correctIndex: 2,
          explanation:
            "Seentrix's checklist is driven by the role. Claiming manufacturer status when we're a distributor invites manufacturer-level liability we don't have the evidence for. Fix the role on Settings → Entity role to match reality.",
        },
      ],
    },
    de: {
      title: "Wirtschaftsakteursrollen",
      summary:
        "Hersteller, Bevollmächtigter, Einführer, Händler — die vier CRA-Rollen und ihre jeweiligen Pflichten.",
      sections: [
        {
          heading: "Warum die Rolle zählt",
          body: (
            <p>
              Der CRA staffelt die Pflichten nach Rolle. Ein Hersteller
              verantwortet Konformitätsbewertung und DoC. Ein Einführer
              prüft die Arbeit des Herstellers. Ein Händler prüft nur, ob
              die CE-Kennzeichnung vorhanden ist. Die richtige Rolle unter{" "}
              <strong>Einstellungen → Rolle</strong> auszuwählen, formt
              die Pflichtenliste — falsche Rolle = falsche Liste = falsche
              Belege im Audit.
            </p>
          ),
        },
        {
          heading: "Die vier Rollen",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Hersteller.</strong> Wir bringen das Produkt unter
                  eigenem Namen oder eigener Marke auf den EU-Markt. Wir
                  verantworten Anhang I, Anhang V, Artikel 13, Artikel 14 —
                  das volle Set. Die meisten Seentrix-Kunden sind hier.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Bevollmächtigter</Term>
                    .
                  </strong>{" "}
                  In der EU ansässig, schriftlich von einem
                  Nicht-EU-Hersteller mandatiert. Hält die technische
                  Dokumentation bereit und steht der Marktüberwachung
                  gegenüber. Pflicht nach <strong>Artikel 18</strong> bei
                  jedem Nicht-EU-Hersteller.
                </li>
                <li>
                  <strong>Einführer.</strong> Bringt ein außerhalb der EU
                  hergestelltes Produkt auf den EU-Markt. Prüft DoC +
                  CE-Kennzeichnung + gültigen Bevollmächtigten. Erstellt
                  die DoC nicht, haftet aber, wenn ein nicht-konformes
                  Produkt in Verkehr gebracht wird.
                </li>
                <li>
                  <strong>Händler.</strong> Verkauft ein Produkt, ohne
                  Hersteller oder Einführer zu sein. Prüft CE-Kennzeichnung
                  + Verfügbarkeit der DoC + Nutzerinformationen. Geringste
                  Pflicht, aber die Pflicht, offensichtlich
                  nicht-konforme Produkte nicht zu verkaufen.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Die Regel zur „wesentlichen Modifikation“",
          body: (
            <p>
              Ein Händler oder Einführer, der ein Produkt{" "}
              <em>wesentlich modifiziert</em> — neue Firmware, Umbranding,
              Änderung der Cybersicherheits-Eigenschaften — wird für den
              CRA zum Hersteller, mit dem vollen Pflichtensatz. Ein
              OEM-Produkt zu white-labeln und eigene Firmware zu flashen ist
              wesentliche Modifikation; es mit einer Beilage in eine Box zu
              packen ist es nicht.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Wir kaufen ein IoT-Gerät von einem US-Hersteller und verkaufen es unverändert in der EU. Welche Rolle haben wir nach dem CRA?",
          options: [
            "Hersteller",
            "Bevollmächtigter",
            "Einführer",
            "Händler",
          ],
          correctIndex: 2,
          explanation:
            "Das Inverkehrbringen eines außerhalb der EU hergestellten Produkts macht uns zum Einführer. Wir prüfen DoC + CE + Bevollmächtigten; der Hersteller verantwortet weiterhin Anhang I.",
        },
        {
          question:
            "Wir kaufen ein OEM-Gerät, flashen eigene Firmware und verkaufen es unter unserer Marke. Welche Rolle?",
          options: [
            "Händler — wir haben die Hardware nicht gebaut",
            "Hersteller — eigene Firmware unter eigener Marke ist wesentliche Modifikation",
            "Einführer, weil jemand anders die Hardware gebaut hat",
            "Bevollmächtigter des OEM",
          ],
          correctIndex: 1,
          explanation:
            "Wesentliche Modifikation (eigene Firmware, eigene Marke) macht uns zum Hersteller. Wir übernehmen das volle Pflichtenset einschließlich Anhang I und DoC.",
        },
        {
          question:
            "Ein Nicht-EU-Hersteller will ohne Bevollmächtigten direkt in der EU verkaufen. Zulässig?",
          options: [
            "Ja, wenn das Produkt CE-gekennzeichnet ist",
            "Ja, wenn der Einführer die technische Dokumentation akzeptiert",
            "Nein — Artikel 18 verlangt einen Bevollmächtigten in der EU",
            "Nur für Important-Class-II-Produkte",
          ],
          correctIndex: 2,
          explanation:
            "Artikel 18 ist ohne Wenn und Aber: Nicht-EU-Hersteller müssen vor dem Inverkehrbringen einen in der EU ansässigen Bevollmächtigten benennen.",
        },
        {
          question:
            "Welcher Akteur trägt die Hauptverantwortung für die Anhang-I-Konformität?",
          options: [
            "Hersteller",
            "Bevollmächtigter",
            "Einführer",
            "Händler",
          ],
          correctIndex: 0,
          explanation:
            "Der Hersteller erfüllt Anhang I, erstellt die technische Dokumentation und stellt die DoC aus. Andere Akteure prüfen oder unterstützen, tragen aber nicht die Konformität.",
        },
        {
          question:
            "Unsere Seentrix-Rolle steht auf „Hersteller“, wir sind aber nur EU-Händler. Folge?",
          options: [
            "Keine — die Einstellung ist kosmetisch",
            "Die Checkliste listet Anhang-I- und DoC-Aufgaben, die uns nicht betreffen — störend, aber nicht unsicher",
            "Wir beanspruchen damit Herstellerhaftung ohne die Belege — im Audit genau das, was wir nicht wollen",
            "Händleraufgaben werden automatisch ergänzt",
          ],
          correctIndex: 2,
          explanation:
            "Seentrix leitet die Checkliste aus der Rolle ab. Als Hersteller aufzutreten, ohne tatsächlich Hersteller zu sein, lädt Herstellerhaftung ein, für die die Nachweise fehlen. Rolle unter Einstellungen → Rolle korrigieren.",
        },
      ],
    },
  },
};

export default lesson;
