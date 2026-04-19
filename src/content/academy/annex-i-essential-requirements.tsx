/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "annex-i-essential-requirements",
  duration: "10 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Annex I — Essential cybersecurity requirements",
      summary:
        "The thirteen baseline cybersecurity properties every product we ship must have, plus the vulnerability-handling obligations that run alongside them.",
      sections: [
        {
          heading: "Two halves of Annex I",
          body: (
            <>
              <p>
                Annex I is split into two parts and both apply to every
                product with digital elements we place on the EU market.
                Missing either half invalidates the{" "}
                <Term id="doc">Declaration of Conformity</Term>.
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Part I — Product requirements.</strong> Thirteen
                  baseline cybersecurity properties the product itself must
                  exhibit at the point of{" "}
                  <Term id="placing_on_market">placing on the market</Term>.
                </li>
                <li>
                  <strong>Part II — Vulnerability handling.</strong> Eight
                  process obligations we run as a manufacturer throughout the{" "}
                  <Term id="support_period">support period</Term>. These
                  are about how we operate, not about the code in a release.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Part I at a glance",
          body: (
            <>
              <p>
                The thirteen Part I requirements cluster into five themes.
                In practice, Seentrix's checklist splits them back out so
                you can evidence each one individually, but it helps to know
                the groupings:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>No known exploitable vulnerabilities</strong> at
                  market placement (requires an active{" "}
                  <Term id="sbom">SBOM</Term> scan).
                </li>
                <li>
                  <strong>Secure by default</strong> — shipped configuration
                  has to be the safe one.
                </li>
                <li>
                  <strong>Identity and access control</strong> — authentication,
                  authorisation, and the principle of least privilege.
                </li>
                <li>
                  <strong>Data protection</strong> — confidentiality,
                  integrity, authenticity, and data minimisation.
                </li>
                <li>
                  <strong>Resilience and minimised attack surface</strong> —
                  resistance to denial-of-service, minimum necessary network
                  exposure, and secure update delivery.
                </li>
              </ul>
              <p className="mt-3">
                Harmonised standards — the EN 18031-1/2/3 series — describe
                concrete ways to meet each requirement. Using them gives you
                a legal <em>presumption of conformity</em>: if you follow EN
                18031, you're assumed compliant unless a market surveillance
                authority proves otherwise.
              </p>
            </>
          ),
        },
        {
          heading: "Part II — running the vulnerability-handling engine",
          body: (
            <>
              <p>
                Part II mandates the operational side of cybersecurity. The
                eight obligations map to dedicated Seentrix screens:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Active <Term id="sbom">SBOM</Term> + vulnerability scanning
                  (SBOM tab).
                </li>
                <li>
                  Address vulnerabilities via{" "}
                  <Term id="security_update">security updates</Term> without
                  undue delay (Releases tab).
                </li>
                <li>
                  Public <Term id="cvd">CVD</Term> contact point and
                  disclosure policy (Reports &gt; public security page).
                </li>
                <li>
                  Inform users of known exploitable vulnerabilities
                  (Incidents &gt; user notification).
                </li>
                <li>
                  Free security updates for at least the{" "}
                  <Term id="support_period">support period</Term> (Releases &gt;
                  support period).
                </li>
              </ul>
              <p className="mt-3">
                Part I is a one-time gate at launch. Part II is ongoing.
                Auditors check both — a product that met Part I on day one
                but stopped shipping security updates three years in is in
                breach.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Which of these is a Part II (vulnerability handling) obligation, not a Part I (product) one?",
          options: [
            "Secure-by-default configuration at shipment",
            "Operating a coordinated vulnerability disclosure policy",
            "Authenticity of firmware signatures",
            "Minimised network attack surface",
          ],
          correctIndex: 1,
          explanation:
            "A CVD policy is Part II (process). The other three are Part I (properties the product itself must exhibit at market placement).",
        },
        {
          question:
            "What does it mean to have a “presumption of conformity” with Annex I?",
          options: [
            "You are automatically exempt from Annex I",
            "Following a harmonised standard (EN 18031) is assumed to satisfy the corresponding requirements unless disproven",
            "You can skip the Declaration of Conformity",
            "A notified body has pre-approved your product",
          ],
          correctIndex: 1,
          explanation:
            "Presumption of conformity means that if you apply the relevant harmonised standards, compliance with the essential requirements is presumed — the burden shifts to the market surveillance authority to prove otherwise.",
        },
        {
          question:
            "A product met Annex I Part I at launch but stopped shipping security updates after 2 years. What's the consequence under the CRA?",
          options: [
            "No issue — Part I compliance is what counts",
            "Breach of Part II obligations; the product is non-compliant",
            "Only the support-period promise is breached; CRA compliance itself is intact",
            "The DoC expires and must be re-issued",
          ],
          correctIndex: 1,
          explanation:
            "Part II obligations run for the entire support period (minimum 5 years). Stopping security updates early is a breach of Annex I Part II and of Article 13.",
        },
        {
          question:
            "Which document evidences Annex I compliance to a market surveillance authority?",
          options: [
            "The Declaration of Conformity alone",
            "The technical documentation (Annex II) and the Declaration of Conformity together",
            "A notified body certificate only",
            "The SBOM",
          ],
          correctIndex: 1,
          explanation:
            "The DoC is the signed claim; the technical documentation (Annex II) contains the evidence supporting that claim. Market surveillance asks for both.",
        },
        {
          question:
            "Which of these Part I themes covers “authentication, authorisation, and least privilege”?",
          options: [
            "No known exploitable vulnerabilities",
            "Secure by default",
            "Identity and access control",
            "Resilience and minimised attack surface",
          ],
          correctIndex: 2,
          explanation:
            "The five themes of Part I group the thirteen requirements. Identity and access control covers authentication, authorisation, and least privilege.",
        },
      ],
    },
    de: {
      title: "Anhang I — Grundlegende Cybersicherheitsanforderungen",
      summary:
        "Die dreizehn grundlegenden Eigenschaften, die jedes unserer auf den EU-Markt gebrachten Produkte haben muss, plus die begleitenden Schwachstellenbehandlungspflichten.",
      sections: [
        {
          heading: "Zwei Hälften von Anhang I",
          body: (
            <>
              <p>
                Anhang I ist zweigeteilt, und beide Teile gelten für jedes
                von uns auf dem EU-Markt bereitgestellte Produkt mit
                digitalen Elementen. Fehlt einer der beiden Teile, ist die{" "}
                <Term id="doc">Konformitätserklärung</Term> ungültig.
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Teil I — Produktanforderungen.</strong> Dreizehn
                  Cybersicherheitseigenschaften, die das Produkt selbst zum
                  Zeitpunkt des{" "}
                  <Term id="placing_on_market">Inverkehrbringens</Term>{" "}
                  aufweisen muss.
                </li>
                <li>
                  <strong>Teil II — Schwachstellenbehandlung.</strong> Acht
                  prozessuale Pflichten, die wir als Hersteller während des
                  gesamten{" "}
                  <Term id="support_period">Support-Zeitraums</Term> laufen
                  lassen. Geht um unseren Betrieb, nicht um den Code im
                  Release.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Teil I im Überblick",
          body: (
            <>
              <p>
                Die dreizehn Teil-I-Anforderungen gruppieren sich in fünf
                Themenbereiche. Seentrix splittet sie in der Checkliste
                wieder auf, damit jede einzeln nachgewiesen werden kann,
                aber zur Orientierung:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Keine bekannten ausnutzbaren Schwachstellen</strong>{" "}
                  beim Markteintritt (aktiver{" "}
                  <Term id="sbom">SBOM</Term>-Scan nötig).
                </li>
                <li>
                  <strong>Secure by Default</strong> — die Auslieferungs-
                  konfiguration muss die sichere sein.
                </li>
                <li>
                  <strong>Identitäts- und Zugriffskontrolle</strong> —
                  Authentifizierung, Autorisierung, Least Privilege.
                </li>
                <li>
                  <strong>Datenschutz</strong> — Vertraulichkeit,
                  Integrität, Authentizität, Datenminimierung.
                </li>
                <li>
                  <strong>Resilienz und minimierte Angriffsfläche</strong> —
                  DoS-Widerstand, nur notwendige Netzexposition, sichere
                  Update-Auslieferung.
                </li>
              </ul>
              <p className="mt-3">
                Die harmonisierten Normen — EN 18031-1/2/3 — beschreiben
                konkrete Umsetzungen. Wer sie anwendet, erhält eine{" "}
                <em>Konformitätsvermutung</em>: es wird angenommen, die
                Anforderungen seien erfüllt, bis eine Marktüberwachungs-
                behörde das Gegenteil nachweist.
              </p>
            </>
          ),
        },
        {
          heading: "Teil II — die Schwachstellenbehandlung betreiben",
          body: (
            <>
              <p>
                Teil II regelt die operative Seite. Die acht Pflichten
                bilden dedizierte Seentrix-Screens ab:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Aktiver <Term id="sbom">SBOM</Term>- und
                  Schwachstellen-Scan (Tab SBOM).
                </li>
                <li>
                  Schwachstellen durch{" "}
                  <Term id="security_update">Sicherheitsupdates</Term> ohne
                  ungebührliche Verzögerung beheben (Tab Releases).
                </li>
                <li>
                  Öffentlicher <Term id="cvd">CVD</Term>-Kontaktpunkt und
                  Offenlegungsrichtlinie (Tab Meldungen &gt; Security-Seite).
                </li>
                <li>
                  Nutzer über aktiv ausgenutzte Schwachstellen informieren
                  (Tab Vorfälle &gt; Nutzerbenachrichtigung).
                </li>
                <li>
                  Kostenfreie Sicherheitsupdates für mindestens den{" "}
                  <Term id="support_period">Support-Zeitraum</Term>{" "}
                  (Tab Releases &gt; Support-Zeitraum).
                </li>
              </ul>
              <p className="mt-3">
                Teil I ist eine einmalige Hürde beim Start. Teil II läuft
                kontinuierlich. Prüfer kontrollieren beides — ein Produkt,
                das Teil I am ersten Tag erfüllte und nach drei Jahren keine
                Sicherheitsupdates mehr liefert, ist nicht konform.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Welche dieser Pflichten gehört zu Teil II (Schwachstellenbehandlung), nicht zu Teil I (Produkt)?",
          options: [
            "Secure-by-Default-Konfiguration bei Auslieferung",
            "Betrieb einer Richtlinie zur koordinierten Offenlegung von Schwachstellen",
            "Authentizität von Firmware-Signaturen",
            "Minimierte Netzangriffsfläche",
          ],
          correctIndex: 1,
          explanation:
            "Eine CVD-Richtlinie gehört zu Teil II (Prozess). Die übrigen drei gehören zu Teil I (Produkt-Eigenschaften zum Zeitpunkt des Inverkehrbringens).",
        },
        {
          question:
            "Was bedeutet „Konformitätsvermutung“ bezogen auf Anhang I?",
          options: [
            "Man ist automatisch von Anhang I befreit",
            "Das Befolgen einer harmonisierten Norm (EN 18031) wird als Erfüllung der entsprechenden Anforderungen angesehen, solange kein Gegenbeweis erbracht wird",
            "Die Konformitätserklärung entfällt",
            "Eine notifizierte Stelle hat das Produkt vorab genehmigt",
          ],
          correctIndex: 1,
          explanation:
            "Konformitätsvermutung heißt: wer die harmonisierten Normen anwendet, gilt als konform mit den grundlegenden Anforderungen, bis das Gegenteil von der Marktüberwachungsbehörde bewiesen wird.",
        },
        {
          question:
            "Ein Produkt erfüllte Teil I beim Start, lieferte aber nach 2 Jahren keine Sicherheitsupdates mehr. Welche Folge unter dem CRA?",
          options: [
            "Kein Problem — Teil-I-Konformität zählt",
            "Verstoß gegen Teil-II-Pflichten; das Produkt ist nicht konform",
            "Nur die Support-Zusage ist verletzt; die CRA-Konformität bleibt bestehen",
            "Die Konformitätserklärung läuft ab und muss neu ausgestellt werden",
          ],
          correctIndex: 1,
          explanation:
            "Teil-II-Pflichten laufen während des gesamten Support-Zeitraums (mind. 5 Jahre). Ein vorzeitiges Einstellen von Sicherheitsupdates ist ein Verstoß gegen Anhang I Teil II und gegen Artikel 13.",
        },
        {
          question:
            "Welches Dokument belegt die Anhang-I-Konformität gegenüber einer Marktüberwachungsbehörde?",
          options: [
            "Die Konformitätserklärung allein",
            "Die technische Dokumentation (Anhang II) zusammen mit der Konformitätserklärung",
            "Ausschließlich ein Zertifikat einer notifizierten Stelle",
            "Die SBOM",
          ],
          correctIndex: 1,
          explanation:
            "Die Konformitätserklärung ist die unterzeichnete Behauptung, die technische Dokumentation (Anhang II) enthält die Belege. Die Behörde verlangt beides.",
        },
        {
          question:
            "Welches der fünf Teil-I-Themenfelder umfasst „Authentifizierung, Autorisierung und Least Privilege“?",
          options: [
            "Keine bekannten ausnutzbaren Schwachstellen",
            "Secure by Default",
            "Identitäts- und Zugriffskontrolle",
            "Resilienz und minimierte Angriffsfläche",
          ],
          correctIndex: 2,
          explanation:
            "Die fünf Themen fassen die dreizehn Anforderungen. Identitäts- und Zugriffskontrolle umfasst Authentifizierung, Autorisierung und das Least-Privilege-Prinzip.",
        },
      ],
    },
  },
};

export default lesson;
