/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "article-14-reporting",
  duration: "7 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Article 14 incident reporting (24h / 72h / 14d)",
      summary:
        "The three-stage clock that starts when we become aware of an actively-exploited vulnerability or severe incident. Miss a window and the fine is measured in millions.",
      sections: [
        {
          heading: "What triggers the clock",
          body: (
            <>
              <p>
                Article 14 is triggered the moment we <em>become aware</em>{" "}
                of one of two things in our product:
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  An <Term id="actively_exploited">actively exploited</Term>{" "}
                  vulnerability (credible real-world evidence, KEV entry,
                  weaponised PoC).
                </li>
                <li>
                  A <em>severe incident</em> affecting the product's
                  security.
                </li>
              </ul>
              <p className="mt-3">
                “Becoming aware” is a factual standard — the clock
                starts with the first credible internal signal, not when
                the incident review board finalises a decision. Seentrix's
                Incidents → New incident is the action that timestamps this
                moment in our audit trail.
              </p>
            </>
          ),
        },
        {
          heading: "The three windows",
          body: (
            <>
              <ul className="space-y-2 pl-5 [list-style:disc]">
                <li>
                  <strong>24 hours — <Term id="early_warning">early warning</Term>.</strong>{" "}
                  Short. Name the incident, whether we suspect malicious
                  activity, affected EU member states. Can be terse; we'll
                  refine later.
                </li>
                <li>
                  <strong>72 hours — <Term id="incident_report">incident report</Term>.</strong>{" "}
                  Severity assessment, indicators of compromise (IOCs),
                  affected products and users, mitigation in progress.
                  First substantive submission.
                </li>
                <li>
                  <strong>14 days — <Term id="final_report">final report</Term>.</strong>{" "}
                  Root-cause analysis, corrective measures (taken and
                  planned), residual risk, and how we communicated to
                  affected users.
                </li>
              </ul>
              <p className="mt-3">
                All three are filed via ENISA's single reporting platform.
                Seentrix prepares the PDF and renders the countdown rings
                so the team sees the remaining time, not just a deadline.
              </p>
            </>
          ),
        },
        {
          heading: "User notification (Article 14(6))",
          body: (
            <p>
              Alongside the ENISA reports, Article 14(6) mandates that we
              inform <em>affected users</em> of any actively-exploited
              vulnerability and provide mitigation guidance — “without
              undue delay.” The Incidents detail page has a notification
              composer that records the content and the send timestamp.
              Missing the user-notification step is the most common
              Article 14 failure found in post-incident audits.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "When does the Article 14 clock start?",
          options: [
            "When a CVE is publicly disclosed",
            "When our incident-review board formally classifies the issue",
            "The moment we become aware of the incident or actively-exploited vulnerability",
            "When a user files a complaint",
          ],
          correctIndex: 2,
          explanation:
            "“Becoming aware” starts the clock. That's the first credible internal signal — not the formal classification decision and not public disclosure. The Incidents → New incident action timestamps it.",
        },
        {
          question:
            "Which report must reach ENISA within 72 hours?",
          options: [
            "Early warning",
            "Incident report",
            "Final report",
            "User notification",
          ],
          correctIndex: 1,
          explanation:
            "24h = early warning, 72h = incident report, 14 days = final report. The 72-hour incident report is the first substantive filing with severity, IOCs, and mitigation in progress.",
        },
        {
          question:
            "In which phase do we file a root-cause analysis?",
          options: [
            "Early warning",
            "Incident report",
            "Final report (14 days)",
            "In a post-mortem, outside Article 14",
          ],
          correctIndex: 2,
          explanation:
            "The 14-day final report is where root-cause analysis, corrective measures, and residual risk land. Before that we often don't have the full picture.",
        },
        {
          question:
            "Article 14(6) requires us to notify affected users of actively-exploited vulnerabilities. How quickly?",
          options: [
            "Within 24 hours of ENISA filing",
            "Without undue delay",
            "Within the 14-day final-report window",
            "Only if the incident is still ongoing after 14 days",
          ],
          correctIndex: 1,
          explanation:
            "“Without undue delay” is the Article 14(6) standard for user notification. Missing the user-notification step is the most common post-incident audit finding.",
        },
        {
          question:
            "An intern discovers an actively-exploited CVE in our product and tells the lead engineer at 17:00 Friday. The incident-review board won't meet until Monday 9:00. When did the Article 14 clock start?",
          options: [
            "Monday 9:00, when the board reviews",
            "Friday 17:00, when we became aware",
            "When we publicly disclose",
            "Whenever we file with ENISA",
          ],
          correctIndex: 1,
          explanation:
            "“Becoming aware” is factual, not procedural. The clock started Friday 17:00. That means the 24-hour early-warning deadline is Saturday 17:00 — weekends and bank holidays don't extend the window.",
        },
      ],
    },
    de: {
      title: "Artikel 14 — Vorfallsmeldung (24h / 72h / 14T)",
      summary:
        "Der Dreistufen-Zähler ab Kenntnisnahme einer aktiv ausgenutzten Schwachstelle oder eines schweren Vorfalls. Verpasste Frist = Millionen-Bußgeld.",
      sections: [
        {
          heading: "Was den Zähler auslöst",
          body: (
            <>
              <p>
                Artikel 14 wird in dem Moment ausgelöst, in dem wir{" "}
                <em>Kenntnis</em> von einem dieser beiden Fälle erlangen:
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Einer <Term id="actively_exploited">aktiv ausgenutzten</Term>{" "}
                  Schwachstelle (glaubwürdige Realweltbelege, KEV-Eintrag,
                  ausgenutzter PoC).
                </li>
                <li>
                  Einem <em>schweren Vorfall</em>, der die Produktsicherheit
                  betrifft.
                </li>
              </ul>
              <p className="mt-3">
                „Kenntnisnahme“ ist faktisch — der Zähler läuft ab dem
                ersten glaubwürdigen internen Signal, nicht ab der
                formellen Entscheidung eines Gremiums. In Seentrix setzt
                Vorfälle → Neuer Vorfall diesen Zeitstempel.
              </p>
            </>
          ),
        },
        {
          heading: "Die drei Fristen",
          body: (
            <>
              <ul className="space-y-2 pl-5 [list-style:disc]">
                <li>
                  <strong>24 Stunden — <Term id="early_warning">Frühwarnung</Term>.</strong>{" "}
                  Kurz. Vorfall benennen, Verdacht auf böswillige Aktivität,
                  betroffene EU-Mitgliedstaaten. Darf knapp sein — wir
                  verfeinern später.
                </li>
                <li>
                  <strong>72 Stunden — <Term id="incident_report">Vorfallsbericht</Term>.</strong>{" "}
                  Schweregrad, Indicators of Compromise (IOCs), betroffene
                  Produkte und Nutzer, laufende Abhilfe. Erste inhaltliche
                  Meldung.
                </li>
                <li>
                  <strong>14 Tage — <Term id="final_report">Abschlussbericht</Term>.</strong>{" "}
                  Root-Cause-Analyse, ergriffene und geplante Maßnahmen,
                  Restrisiko und die Kommunikation an betroffene Nutzer.
                </li>
              </ul>
              <p className="mt-3">
                Alle drei werden über die einheitliche ENISA-Meldeplattform
                eingereicht. Seentrix erstellt die PDF und zeigt
                Countdown-Ringe — das Team sieht die Restzeit, nicht nur
                einen Stichtag.
              </p>
            </>
          ),
        },
        {
          heading: "Nutzerbenachrichtigung (Artikel 14(6))",
          body: (
            <p>
              Zusätzlich zu den ENISA-Meldungen verpflichtet Artikel 14(6)
              uns, <em>betroffene Nutzer</em> über aktiv ausgenutzte
              Schwachstellen zu informieren und Abhilfeanweisungen zu
              geben — „ohne ungebührliche Verzögerung“. Die
              Vorfallsdetailseite hat einen Benachrichtigungs-Composer, der
              Inhalt und Versanddatum erfasst. Fehlende
              Nutzerbenachrichtigung ist der häufigste Audit-Befund nach
              Vorfällen.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Wann beginnt die Artikel-14-Frist?",
          options: [
            "Bei öffentlicher CVE-Offenlegung",
            "Wenn das Incident-Gremium den Fall formell einstuft",
            "Mit der Kenntnisnahme des Vorfalls oder der aktiv ausgenutzten Schwachstelle",
            "Bei Beschwerde eines Nutzers",
          ],
          correctIndex: 2,
          explanation:
            "„Kenntnisnahme“ startet die Frist. Das ist das erste glaubwürdige interne Signal — nicht die formale Einstufung und nicht die öffentliche Offenlegung. Vorfälle → Neuer Vorfall setzt den Zeitstempel.",
        },
        {
          question: "Welche Meldung muss binnen 72 Stunden bei der ENISA sein?",
          options: [
            "Frühwarnung",
            "Vorfallsbericht",
            "Abschlussbericht",
            "Nutzerbenachrichtigung",
          ],
          correctIndex: 1,
          explanation:
            "24h = Frühwarnung, 72h = Vorfallsbericht, 14 Tage = Abschlussbericht. Der 72-Stunden-Bericht ist die erste inhaltliche Meldung mit Schweregrad, IOCs und laufender Abhilfe.",
        },
        {
          question: "In welcher Phase reichen wir eine Root-Cause-Analyse ein?",
          options: [
            "Frühwarnung",
            "Vorfallsbericht",
            "Abschlussbericht (14 Tage)",
            "In einer Post-Mortem außerhalb von Artikel 14",
          ],
          correctIndex: 2,
          explanation:
            "Der 14-Tage-Abschlussbericht enthält Root-Cause, ergriffene Maßnahmen und Restrisiko. Vorher fehlt oft noch das Gesamtbild.",
        },
        {
          question:
            "Artikel 14(6) verlangt, betroffene Nutzer über aktiv ausgenutzte Schwachstellen zu informieren. Wie schnell?",
          options: [
            "Binnen 24 Stunden nach ENISA-Meldung",
            "Ohne ungebührliche Verzögerung",
            "Innerhalb der 14-Tage-Abschlussfrist",
            "Nur wenn der Vorfall nach 14 Tagen noch läuft",
          ],
          correctIndex: 1,
          explanation:
            "„Ohne ungebührliche Verzögerung“ ist der Maßstab nach Artikel 14(6). Fehlende Nutzerbenachrichtigung ist der häufigste Audit-Befund.",
        },
        {
          question:
            "Ein Praktikant entdeckt eine aktiv ausgenutzte CVE Freitag 17:00 und informiert die Teamleitung. Das Incident-Gremium tagt erst Montag 9:00. Wann begann die Frist?",
          options: [
            "Montag 9:00, bei Gremiumsbewertung",
            "Freitag 17:00, mit Kenntnisnahme",
            "Bei öffentlicher Offenlegung",
            "Wenn wir der ENISA melden",
          ],
          correctIndex: 1,
          explanation:
            "Kenntnisnahme ist faktisch, nicht prozedural. Frist ab Freitag 17:00. Die 24-Stunden-Frühwarnfrist endet Samstag 17:00 — Wochenende und Feiertage verschieben nichts.",
        },
      ],
    },
  },
};

export default lesson;
