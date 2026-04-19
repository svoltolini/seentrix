/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "conformity-assessment-routes",
  duration: "8 min",
  requiredForRoles: ["admin", "compliance_officer"],
  prerequisites: ["cra-101", "annex-i-essential-requirements"],
  i18n: {
    en: {
      title: "Conformity assessment routes (Module A, B+C, H)",
      summary:
        "How we prove our product meets Annex I. The route depends on CRA classification — self-assessment, type examination, or full quality audit.",
      sections: [
        {
          heading: "Why four routes exist",
          body: (
            <p>
              The CRA sorts products into risk tiers — default,{" "}
              <em>Important Class I</em>, <em>Important Class II</em>, and{" "}
              <em>Critical</em>. Higher risk means more third-party scrutiny.
              The{" "}
              <Term id="conformity_assessment">conformity-assessment</Term>{" "}
              route is how we demonstrate compliance to the corresponding
              level. Pick the wrong route for our class and the CE marking
              is invalid — market surveillance can pull the product off
              shelves.
            </p>
          ),
        },
        {
          heading: "The four routes",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="module_a">Module A</Term> — Internal Control.
                  </strong>{" "}
                  Self-assessment. We prepare the technical documentation,
                  declare conformity, and affix CE. No notified body. Only
                  open for default-class products.
                </li>
                <li>
                  <strong>
                    <Term id="module_b_c">Module B+C</Term> — EU-type
                    examination + conformity to type.
                  </strong>{" "}
                  A notified body examines one representative sample, issues
                  a type certificate; we then declare every produced unit
                  conforms to that type. Mandatory for Important Class II.
                </li>
                <li>
                  <strong>
                    <Term id="module_h">Module H</Term> — Full quality
                    assurance.
                  </strong>{" "}
                  A notified body audits our entire quality system
                  (design → manufacturing → testing) and issues an
                  approval. Annual surveillance audits. Required for
                  Critical; available for Important Class II.
                </li>
                <li>
                  <strong>European Cybersecurity Certification.</strong>{" "}
                  Conformity via an EU cybersecurity certification scheme
                  under the Cybersecurity Act (CSA). Currently emerging.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Picking the right route in Seentrix",
          body: (
            <p>
              When we run the CRA assessment wizard on a product, Seentrix
              classifies it (default / Important I / Important II /
              Critical) and proposes an appropriate route. We can override,
              but only in the direction of <em>more</em> scrutiny, never
              less — picking Module A for a Critical product is a compliance
              failure. The <Term id="nando">NANDO</Term> database is where
              we pick a notified body for Module B+C or H.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Which conformity route is mandatory for Important Class II products?",
          options: [
            "Module A",
            "Module B+C or Module H",
            "European Cybersecurity Certification only",
            "Any of the above",
          ],
          correctIndex: 1,
          explanation:
            "Important Class II products cannot use Module A (self-assessment). They must go through a notified body, either via Module B+C (type examination) or Module H (full quality-system audit).",
        },
        {
          question:
            "What's the main operational difference between Module B+C and Module H?",
          options: [
            "Module H doesn't require a notified body",
            "Module B+C examines one sample; Module H audits the entire quality system with annual surveillance",
            "Module H is cheaper",
            "Only Module B+C is allowed for hardware",
          ],
          correctIndex: 1,
          explanation:
            "Module B+C is a type examination of a representative sample; Module H audits the whole design/manufacturing/testing quality system with annual surveillance audits.",
        },
        {
          question:
            "Our product is classified as default tier. Can we self-assess under Module A?",
          options: [
            "No, a notified body is always required",
            "Yes — Module A (internal control) is available for default-tier products",
            "Only if our parent company is based in the EU",
            "Only with a valid notified-body waiver",
          ],
          correctIndex: 1,
          explanation:
            "Module A is self-assessment and is available for default-tier products. No notified body is involved. Importance is given to keeping accurate technical documentation.",
        },
        {
          question:
            "We classified a product as Critical but picked Module A. What's the consequence?",
          options: [
            "Module A is invalid for Critical products; the CE marking is unlawful",
            "Works fine — Module A is a fallback route",
            "We get a warning from market surveillance but can continue selling",
            "Module H is auto-applied retroactively",
          ],
          correctIndex: 0,
          explanation:
            "Critical products must go through Module H (or an equivalent EU cybersecurity certification). Using Module A for a Critical product makes the CE marking unlawful and exposes us to CRA fines up to €15M / 2.5% of global turnover.",
        },
        {
          question:
            "Where do we look up a notified body's four-digit ID and scope?",
          options: [
            "The ENISA single reporting platform",
            "The NANDO database (ec.europa.eu/growth/tools-databases/nando)",
            "Our national trade register",
            "The EUDAMED database",
          ],
          correctIndex: 1,
          explanation:
            "NANDO (New Approach Notified and Designated Organisations) is the Commission's authoritative database of notified bodies, including their IDs, addresses, and scopes of competence.",
        },
      ],
    },
    de: {
      title: "Konformitätsbewertungs-Routen (Modul A, B+C, H)",
      summary:
        "Wie wir nachweisen, dass unser Produkt Anhang I erfüllt. Die Route hängt von der CRA-Klassifizierung ab — Selbstbewertung, Baumusterprüfung oder vollständiges Qualitätsaudit.",
      sections: [
        {
          heading: "Warum es vier Routen gibt",
          body: (
            <p>
              Der CRA teilt Produkte in Risikostufen ein — Standard,{" "}
              <em>Important Class I</em>, <em>Important Class II</em> und{" "}
              <em>Critical</em>. Höheres Risiko heißt mehr Drittprüfung.
              Die <Term id="conformity_assessment">Konformitätsbewertung</Term>{" "}
              ist der Weg, auf dem wir die jeweils erforderliche Prüftiefe
              nachweisen. Falsche Route für die Klasse = ungültige
              CE-Kennzeichnung — die Marktüberwachung kann das Produkt vom
              Markt nehmen.
            </p>
          ),
        },
        {
          heading: "Die vier Routen",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="module_a">Modul A</Term> — Interne
                    Fertigungskontrolle.
                  </strong>{" "}
                  Selbstbewertung. Wir erstellen die technische
                  Dokumentation, erklären die Konformität und bringen CE an.
                  Keine notifizierte Stelle. Nur für Standard-Produkte.
                </li>
                <li>
                  <strong>
                    <Term id="module_b_c">Modul B+C</Term> — EU-
                    Baumusterprüfung + Konformität mit dem Baumuster.
                  </strong>{" "}
                  Eine notifizierte Stelle prüft eine repräsentative Probe
                  und stellt ein Baumusterprüfzertifikat aus; wir erklären
                  dann für jede produzierte Einheit Konformität mit diesem
                  Baumuster. Pflicht für Important Class II.
                </li>
                <li>
                  <strong>
                    <Term id="module_h">Modul H</Term> — Umfassende
                    Qualitätssicherung.
                  </strong>{" "}
                  Eine notifizierte Stelle auditiert unser gesamtes
                  Qualitätssystem (Design → Fertigung → Prüfung) und
                  erteilt eine Zulassung. Jährliche Überwachungsaudits.
                  Pflicht für Critical; verfügbar für Important Class II.
                </li>
                <li>
                  <strong>Europäische Cybersicherheitszertifizierung.</strong>{" "}
                  Konformität über ein EU-Cybersicherheitszertifizierungs-
                  schema nach dem Cybersecurity Act (CSA). Im Entstehen.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Die richtige Route in Seentrix wählen",
          body: (
            <p>
              Beim CRA-Assessment-Assistenten klassifiziert Seentrix das
              Produkt (Standard / Important I / Important II / Critical)
              und schlägt eine passende Route vor. Eine Abweichung ist
              möglich, aber nur in Richtung <em>mehr</em> Prüftiefe, nie
              weniger — Modul A für ein Critical-Produkt ist ein
              Compliance-Verstoß. Die{" "}
              <Term id="nando">NANDO</Term>-Datenbank ist der Ort, an dem
              wir eine notifizierte Stelle für Modul B+C oder H auswählen.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Welche Konformitätsroute ist für Important-Class-II-Produkte Pflicht?",
          options: [
            "Modul A",
            "Modul B+C oder Modul H",
            "Nur Europäische Cybersicherheitszertifizierung",
            "Alle der genannten",
          ],
          correctIndex: 1,
          explanation:
            "Important-Class-II-Produkte dürfen nicht über Modul A (Selbstbewertung) laufen. Sie müssen durch eine notifizierte Stelle — entweder Modul B+C (Baumusterprüfung) oder Modul H (umfassendes Qualitätsaudit).",
        },
        {
          question:
            "Was ist der wesentliche Unterschied zwischen Modul B+C und Modul H?",
          options: [
            "Modul H benötigt keine notifizierte Stelle",
            "Modul B+C prüft ein Baumuster; Modul H auditiert das gesamte Qualitätssystem mit jährlicher Überwachung",
            "Modul H ist günstiger",
            "Nur Modul B+C ist für Hardware zulässig",
          ],
          correctIndex: 1,
          explanation:
            "Modul B+C ist eine Baumusterprüfung einer Probe; Modul H auditiert das gesamte Design-, Fertigungs- und Prüfsystem mit jährlichen Überwachungsaudits.",
        },
        {
          question:
            "Unser Produkt ist Standard-Klasse. Dürfen wir Modul A selbst bewerten?",
          options: [
            "Nein, eine notifizierte Stelle ist immer erforderlich",
            "Ja — Modul A (interne Fertigungskontrolle) ist für Standard-Produkte zulässig",
            "Nur wenn unsere Muttergesellschaft in der EU sitzt",
            "Nur mit Freigabe durch eine notifizierte Stelle",
          ],
          correctIndex: 1,
          explanation:
            "Modul A ist Selbstbewertung und für Standard-Produkte zulässig. Keine notifizierte Stelle beteiligt. Wichtig ist eine saubere technische Dokumentation.",
        },
        {
          question:
            "Wir haben ein Produkt als Critical klassifiziert, aber Modul A gewählt. Was ist die Folge?",
          options: [
            "Modul A ist für Critical unzulässig; die CE-Kennzeichnung ist rechtswidrig",
            "Funktioniert — Modul A ist eine Fallback-Route",
            "Wir erhalten eine Verwarnung, dürfen aber weiterverkaufen",
            "Modul H wird automatisch rückwirkend angewandt",
          ],
          correctIndex: 0,
          explanation:
            "Critical-Produkte müssen über Modul H (oder eine gleichwertige EU-Cybersicherheitszertifizierung) laufen. Modul A für Critical macht die CE-Kennzeichnung rechtswidrig und löst CRA-Bußgelder bis 15 Mio. € / 2,5 % des weltweiten Umsatzes aus.",
        },
        {
          question:
            "Wo schlagen wir die vierstellige Kennnummer und den Tätigkeitsbereich einer notifizierten Stelle nach?",
          options: [
            "Auf der einheitlichen ENISA-Meldeplattform",
            "In der NANDO-Datenbank (ec.europa.eu/growth/tools-databases/nando)",
            "In unserem nationalen Handelsregister",
            "In der EUDAMED-Datenbank",
          ],
          correctIndex: 1,
          explanation:
            "NANDO ist die maßgebliche Kommissions-Datenbank der notifizierten Stellen mit IDs, Adressen und Kompetenzbereichen.",
        },
      ],
    },
  },
};

export default lesson;
