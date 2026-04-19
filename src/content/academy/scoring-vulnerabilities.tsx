/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "scoring-vulnerabilities",
  duration: "5 min",
  requiredForRoles: ["cto"],
  prerequisites: ["vulnerability-handling-101"],
  i18n: {
    en: {
      title: "Scoring vulnerabilities (CVSS, EPSS, KEV)",
      summary:
        "Three complementary signals for deciding what to fix first. None of them replaces contextual judgement.",
      sections: [
        {
          heading: "CVSS — severity, not urgency",
          body: (
            <p>
              <Term id="cvss">CVSS</Term> scores a vulnerability's intrinsic
              severity on a 0.0–10.0 scale. It's the lingua franca of
              vulnerability feeds, but it's a static property: a
              CVSS-9.8 “critical” in a component we've disabled is
              still low <em>risk</em>. CVSS v4 (2023) is the current spec;
              many feeds still publish v3 scores. Use CVSS as the opening
              severity assumption, not the final answer.
            </p>
          ),
        },
        {
          heading: "EPSS — probability of exploitation",
          body: (
            <p>
              <Term id="epss">EPSS</Term> is a 0.0–1.0 daily probability
              estimate that a given CVE will be exploited in the next 30
              days. Most CVEs sit below 0.01 — they'll never be exploited.
              An EPSS above 0.5 combined with a high CVSS usually means
              “fix this week.” EPSS complements CVSS: one tells
              us how bad, the other tells us how likely.
            </p>
          ),
        },
        {
          heading: "KEV — we know it's being exploited",
          body: (
            <p>
              The CISA <Term id="kev">KEV</Term> catalog is a curated list
              of CVEs actively exploited in the wild. An appearance on KEV
              is the strongest signal available, and it jumps the issue to
              the top of our triage queue regardless of CVSS or EPSS. In
              Seentrix, KEV-listed vulnerabilities show a red dot on the
              vulnerabilities table and light up the KEV KPI on the tab
              header.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "A vulnerability has CVSS 9.8, EPSS 0.001, not on KEV. How should we treat it?",
          options: [
            "Emergency — CVSS 9.8 is critical",
            "Fix within normal sprint cadence — high intrinsic severity but low probability of exploitation",
            "Ignore — low EPSS means it's safe",
            "Always remove the component",
          ],
          correctIndex: 1,
          explanation:
            "High CVSS + low EPSS + not on KEV = treat with attention but without panic. High intrinsic severity with low exploitation likelihood is a normal sprint-cycle fix, not an emergency page.",
        },
        {
          question: "What is the KEV catalog?",
          options: [
            "A directory of known-good firmware components",
            "The CISA list of CVEs actively exploited in the wild",
            "An EPSS replacement maintained by ENISA",
            "A scanner's internal ruleset",
          ],
          correctIndex: 1,
          explanation:
            "KEV = Known Exploited Vulnerabilities catalog, maintained by CISA. ~5–10 CVEs are added per week. Presence on KEV is the strongest exploit signal we have short of our own logs.",
        },
        {
          question:
            "An EPSS score of 0.85 means approximately what?",
          options: [
            "The CVE is exploited 85% of the time on first scan",
            "There's roughly an 85% probability this CVE will be exploited in the next 30 days",
            "The CVE is 85% severe",
            "85% of scanners detect this CVE",
          ],
          correctIndex: 1,
          explanation:
            "EPSS is a 30-day exploitation-probability estimate. 0.85 is very high — the overwhelming majority of CVEs never reach 0.1.",
        },
        {
          question:
            "Which signal alone justifies the “actively exploited” flag under CRA Article 14?",
          options: [
            "CVSS \u226510",
            "EPSS \u22650.5",
            "KEV listing (or equivalent evidence like our own production logs)",
            "Any vulnerability older than 90 days",
          ],
          correctIndex: 2,
          explanation:
            "Actively exploited is a factual claim. KEV listing is the cleanest supporting evidence; comparable threat-intel or our own logs work too. CVSS and EPSS alone predict severity / likelihood but don't establish exploitation.",
        },
        {
          question:
            "A CVE affects a component bundled in our product but disabled at build time. What's the right triage?",
          options: [
            "Score CVSS as-is; treat as high",
            "Mark as Not Applicable / Accepted with evidence that the component is disabled",
            "Remove the component — always",
            "Log as Resolved without action",
          ],
          correctIndex: 1,
          explanation:
            "Context is everything. A disabled component isn't exploitable in our shipped configuration. Accept with documented evidence (build flags, test coverage proving it's off). CVSS isn't wrong — it's just not describing our risk.",
        },
      ],
    },
    de: {
      title: "Schwachstellen-Scoring (CVSS, EPSS, KEV)",
      summary:
        "Drei ergänzende Signale für die Priorisierung. Keines ersetzt kontextbezogene Einschätzung.",
      sections: [
        {
          heading: "CVSS — Schwere, nicht Dringlichkeit",
          body: (
            <p>
              <Term id="cvss">CVSS</Term> bewertet die intrinsische Schwere
              einer Schwachstelle auf einer Skala 0,0–10,0. Gemeinsame
              Sprache aller Feeds, aber statisch: ein CVSS-9,8
              „kritisch“ in einer deaktivierten Komponente ist
              geringes <em>Risiko</em>. CVSS v4 (2023) ist aktuell; viele
              Feeds melden noch v3. CVSS ist die Ausgangsannahme, nicht die
              Endentscheidung.
            </p>
          ),
        },
        {
          heading: "EPSS — Ausnutzungswahrscheinlichkeit",
          body: (
            <p>
              <Term id="epss">EPSS</Term> ist eine tägliche Schätzung
              (0,0–1,0) dafür, dass eine CVE in den nächsten 30 Tagen
              ausgenutzt wird. Die meisten CVEs liegen unter 0,01 — sie
              werden nie ausgenutzt. EPSS über 0,5 plus hoher CVSS: „diese
              Woche fixen“. EPSS ergänzt CVSS: das eine sagt wie
              schlimm, das andere wie wahrscheinlich.
            </p>
          ),
        },
        {
          heading: "KEV — aktiv ausgenutzt",
          body: (
            <p>
              Der CISA-<Term id="kev">KEV</Term>-Katalog listet CVEs, die
              aktiv in freier Wildbahn ausgenutzt werden. Eintrag im KEV
              ist das stärkste Signal und verschiebt das Thema unabhängig
              von CVSS/EPSS ganz oben in unsere Triage. In Seentrix zeigen
              KEV-gelistete Einträge einen roten Punkt in der Tabelle und
              leuchten im KEV-KPI im Tab-Header auf.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Eine Schwachstelle hat CVSS 9,8, EPSS 0,001, nicht im KEV. Wie behandeln?",
          options: [
            "Notfall — CVSS 9,8 ist kritisch",
            "Im normalen Sprint fixen — hohe intrinsische Schwere, niedrige Ausnutzungswahrscheinlichkeit",
            "Ignorieren — niedriger EPSS heißt sicher",
            "Komponente immer entfernen",
          ],
          correctIndex: 1,
          explanation:
            "Hoher CVSS + niedriger EPSS + kein KEV = aufmerksam, aber ohne Panik. Normale Sprint-Cadence, kein Notfall-Page.",
        },
        {
          question: "Was ist der KEV-Katalog?",
          options: [
            "Verzeichnis vertrauenswürdiger Firmware-Komponenten",
            "CISA-Liste der aktiv ausgenutzten CVEs",
            "EPSS-Ersatz der ENISA",
            "Interner Scanner-Regelsatz",
          ],
          correctIndex: 1,
          explanation:
            "KEV = Known Exploited Vulnerabilities, gepflegt von der CISA. ~5–10 CVEs pro Woche. Eintrag im KEV ist das stärkste Ausnutzungssignal neben eigenen Logs.",
        },
        {
          question: "Ein EPSS-Wert von 0,85 bedeutet ungefähr was?",
          options: [
            "Die CVE wird beim ersten Scan zu 85 % ausgenutzt",
            "Rund 85 % Wahrscheinlichkeit der Ausnutzung in den nächsten 30 Tagen",
            "Die CVE ist zu 85 % schwer",
            "85 % der Scanner erkennen die CVE",
          ],
          correctIndex: 1,
          explanation:
            "EPSS ist eine 30-Tage-Wahrscheinlichkeit. 0,85 ist sehr hoch — die überwältigende Mehrheit der CVEs erreicht nie 0,1.",
        },
        {
          question:
            "Welches Signal allein rechtfertigt die Markierung „aktiv ausgenutzt“ nach Artikel 14?",
          options: [
            "CVSS \u226510",
            "EPSS \u22650,5",
            "KEV-Eintrag (oder gleichwertige Belege wie eigene Produktions-Logs)",
            "Jede CVE, älter als 90 Tage",
          ],
          correctIndex: 2,
          explanation:
            "Aktiv ausgenutzt ist ein faktischer Befund. KEV ist der sauberste Beleg; vergleichbare Threat-Intel oder eigene Logs reichen ebenfalls. CVSS und EPSS allein belegen keine Ausnutzung.",
        },
        {
          question:
            "Eine CVE betrifft eine Komponente, die wir mitliefern, aber zur Build-Zeit deaktivieren. Richtige Triage?",
          options: [
            "CVSS so übernehmen; als hoch einstufen",
            "Als Nicht zutreffend / Akzeptiert mit Nachweis (Build-Flags, Tests) markieren",
            "Komponente immer entfernen",
            "Ohne Aktion als Behoben loggen",
          ],
          correctIndex: 1,
          explanation:
            "Kontext entscheidet. Eine deaktivierte Komponente ist im ausgelieferten Stand nicht ausnutzbar. Mit dokumentierten Belegen akzeptieren; CVSS ist nicht falsch, beschreibt aber nicht unser Risiko.",
        },
      ],
    },
  },
};

export default lesson;
