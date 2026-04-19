/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "cvd-and-psirt",
  duration: "6 min",
  requiredForRoles: ["admin", "compliance_officer"],
  prerequisites: ["cra-101", "vulnerability-handling-101"],
  i18n: {
    en: {
      title: "Coordinated vulnerability disclosure and PSIRT",
      summary:
        "Running the public intake, setting expectations with researchers, and publishing advisories — the operator side of CRA Annex I Part II.",
      sections: [
        {
          heading: "Why we need a CVD policy",
          body: (
            <p>
              <Term id="cvd">Coordinated Vulnerability Disclosure</Term> is
              a public commitment that says: “if you find a security
              issue, here's how to report it, here's what we'll do, here's
              the legal safe harbour you get.” The CRA mandates this
              under Annex I Part II(1). Beyond compliance, a clear CVD
              policy also shapes the quality of the reports we receive —
              vague or absent policies mean no responsible researcher will
              report to us at all.
            </p>
          ),
        },
        {
          heading: "What a good policy contains",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Scope.</strong> Which products / versions /
                  domains the policy covers.
                </li>
                <li>
                  <strong>Intake channel.</strong> Where to submit (for us,
                  the public security page / PSIRT URL), secondary email.
                </li>
                <li>
                  <strong>Response SLAs.</strong> First acknowledgement,
                  triage verdict, fix timeline. Typical industry numbers:
                  5 business days to acknowledge, 30 days to verdict, 90
                  days to fix.
                </li>
                <li>
                  <strong>Safe harbour statement.</strong> We agree not to
                  pursue civil or criminal action against researchers who
                  follow the policy in good faith.
                </li>
                <li>
                  <strong>Credit &amp; coordinated disclosure.</strong>{" "}
                  We'll credit researchers in the advisory and agree on
                  public-disclosure timing together.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Running the PSIRT",
          body: (
            <p>
              The <Term id="psirt">PSIRT</Term> is the team that executes
              the policy: takes intake, triages, coordinates with the
              engineering team, publishes advisories, credits researchers.
              For small companies the PSIRT is often a single person
              wearing a second hat — that's fine, but the <em>function</em>{" "}
              has to exist and has to respond predictably. Seentrix's
              Reports tab is the operational surface: intake queue,
              triage workflow, advisory draft, publication to the public
              security page.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "What does CVD safe-harbour mean in practice?",
          options: [
            "The researcher gets a cash bounty",
            "We promise not to pursue civil or criminal action against researchers following the policy in good faith",
            "We keep the report secret forever",
            "The researcher becomes an employee",
          ],
          correctIndex: 1,
          explanation:
            "Safe harbour is a legal commitment: follow our policy, report in good faith, and we won't weaponise CFAA (US), UK Computer Misuse Act, German §202c StGB, etc. against you. Without it serious researchers won't report.",
        },
        {
          question: "Where in Seentrix do we publish our CVD policy?",
          options: [
            "Settings → Organization",
            "Reports → Public security page",
            "Products → Each product's detail page",
            "It's auto-generated from our company name",
          ],
          correctIndex: 1,
          explanation:
            "The Reports tab (vulnerability reports) hosts the public security page. The policy text lives in Settings inside that tab and appears verbatim on /security/<slug>.",
        },
        {
          question:
            "A researcher reports a critical vulnerability and threatens to disclose publicly in 48 hours unless we respond. What's the right move?",
          options: [
            "Ignore them",
            "Acknowledge immediately, triage at severity commensurate with their evidence, and negotiate a realistic coordinated-disclosure timeline",
            "File an Article 14 incident report",
            "Block the reporter",
          ],
          correctIndex: 1,
          explanation:
            "Acknowledge within our policy's SLA, triage fast, and negotiate. Threats are usually escalation in response to silence; a quick acknowledgement often de-escalates. Article 14 is for actively-exploited vulnerabilities, not every researcher report.",
        },
        {
          question:
            "A reporter submits through our public form with an email address but signs the report “anonymous.” How do we handle credit?",
          options: [
            "Always publish their email",
            "Ask the reporter what name (if any) they want credited before publishing the advisory",
            "Credit them by their email address automatically",
            "Don't credit anyone",
          ],
          correctIndex: 1,
          explanation:
            "Always ask. Some researchers want credit with real names, others with handles, others none. Publishing an email address attached to a security report is an information-leak of your own making.",
        },
        {
          question:
            "Our PSIRT received 30 reports in a month; 20 were clearly false positives / out-of-scope. Which Seentrix status should they end in?",
          options: [
            "Accepted",
            "Resolved",
            "Duplicate or Spam, depending on the case",
            "Triage (never close them)",
          ],
          correctIndex: 2,
          explanation:
            "Mark legitimate out-of-scope or non-issue reports as Duplicate / Spam. Closing with a short note maintains the audit trail without cluttering the active queue.",
        },
      ],
    },
    de: {
      title: "Koordinierte Offenlegung und PSIRT",
      summary:
        "Betrieb des öffentlichen Intakes, Erwartungen an Forscher setzen und Advisories veröffentlichen — die Betreiberseite von CRA Anhang I Teil II.",
      sections: [
        {
          heading: "Warum eine CVD-Richtlinie",
          body: (
            <p>
              <Term id="cvd">Coordinated Vulnerability Disclosure</Term>{" "}
              ist eine öffentliche Zusage: „Wenn du einen Sicherheitsfund
              machst, hier meldest du, das passiert dann, das ist dein
              rechtlicher Safe-Harbour.“ Der CRA verlangt das nach
              Anhang I Teil II(1). Jenseits der Compliance prägt eine
              klare Richtlinie auch die Qualität der Meldungen — ohne
              Richtlinie meldet kein seriöser Forscher.
            </p>
          ),
        },
        {
          heading: "Was eine gute Richtlinie enthält",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Scope.</strong> Welche Produkte / Versionen /
                  Domains erfasst sind.
                </li>
                <li>
                  <strong>Intake-Kanal.</strong> Wohin gemeldet wird (bei
                  uns die öffentliche Security-Seite / PSIRT-URL),
                  Sekundär-E-Mail.
                </li>
                <li>
                  <strong>Reaktions-SLAs.</strong> Erste Bestätigung,
                  Triage-Urteil, Fix-Zeitrahmen. Branchenübliche Werte:
                  5 Arbeitstage bis Bestätigung, 30 Tage bis Urteil, 90
                  Tage bis Fix.
                </li>
                <li>
                  <strong>Safe-Harbour-Erklärung.</strong> Verpflichtung,
                  keine zivil- oder strafrechtlichen Schritte gegen gutwillig
                  arbeitende Forscher einzuleiten.
                </li>
                <li>
                  <strong>Credit &amp; koordinierte Offenlegung.</strong>{" "}
                  Wir nennen Forscher im Advisory und stimmen den
                  Veröffentlichungs-Zeitplan gemeinsam ab.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Das PSIRT betreiben",
          body: (
            <p>
              Das <Term id="psirt">PSIRT</Term> setzt die Richtlinie um:
              Intake annehmen, triagieren, mit Engineering koordinieren,
              Advisories veröffentlichen, Forscher nennen. Bei kleinen
              Firmen ist das oft eine Person mit Doppelrolle — das ist ok,
              die <em>Funktion</em> muss aber existieren und berechenbar
              reagieren. Der Reports-Tab in Seentrix ist die operative
              Oberfläche: Intake-Queue, Triage-Workflow, Advisory-Entwurf,
              Veröffentlichung auf der öffentlichen Seite.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Was heißt CVD-Safe-Harbour praktisch?",
          options: [
            "Der Forscher erhält eine Geldprämie",
            "Zusage, gegen gutwillig nach der Richtlinie arbeitende Forscher keine zivil- oder strafrechtlichen Schritte einzuleiten",
            "Der Report bleibt ewig geheim",
            "Der Forscher wird Angestellter",
          ],
          correctIndex: 1,
          explanation:
            "Safe-Harbour ist eine rechtliche Zusage: wer nach unserer Richtlinie gutwillig meldet, riskiert keine Verfolgung nach CFAA, UK Computer Misuse Act, §202c StGB usw. Ohne das melden ernsthafte Forscher nicht.",
        },
        {
          question: "Wo in Seentrix veröffentlichen wir unsere CVD-Richtlinie?",
          options: [
            "Einstellungen → Organisation",
            "Meldungen → Öffentliche Security-Seite",
            "Produkte → jedes Produktdetail",
            "Wird aus dem Firmennamen generiert",
          ],
          correctIndex: 1,
          explanation:
            "Der Meldungen-Tab (Vulnerability Reports) hostet die öffentliche Security-Seite. Der Policy-Text wird dort im Settings-Bereich gepflegt und erscheint wörtlich unter /security/<slug>.",
        },
        {
          question:
            "Ein Forscher meldet eine kritische Schwachstelle und droht mit öffentlicher Offenlegung in 48 Stunden, wenn keine Antwort kommt. Richtiger Schritt?",
          options: [
            "Ignorieren",
            "Sofort bestätigen, evidenzangemessen triagieren und ein realistisches koordiniertes Disclosure-Timing verhandeln",
            "Artikel-14-Meldung einreichen",
            "Den Melder blockieren",
          ],
          correctIndex: 1,
          explanation:
            "Im Rahmen unserer Richtlinien-SLA bestätigen, schnell triagieren und verhandeln. Drohungen sind meist Eskalation wegen Stille; schnelle Bestätigung deeskaliert. Artikel 14 betrifft aktiv ausgenutzte Schwachstellen, nicht jede Forschermeldung.",
        },
        {
          question:
            "Ein Melder nutzt unser Formular mit E-Mail-Adresse, signiert aber als „anonym“. Wie umgehen mit Credit?",
          options: [
            "Immer die E-Mail veröffentlichen",
            "Vor Veröffentlichung des Advisories nachfragen, welcher Name (falls überhaupt) genannt werden soll",
            "Automatisch per E-Mail crediten",
            "Keinen Credit geben",
          ],
          correctIndex: 1,
          explanation:
            "Immer fragen. Manche wollen Credit mit Klarnamen, andere mit Handle, andere gar keinen. Eine E-Mail-Adresse neben einer Sicherheitsmeldung zu veröffentlichen ist ein selbstverschuldeter Info-Leak.",
        },
        {
          question:
            "Unser PSIRT erhielt in einem Monat 30 Meldungen; 20 waren offensichtlich False Positives / Out-of-Scope. In welchem Seentrix-Status sollen sie enden?",
          options: [
            "Akzeptiert",
            "Behoben",
            "Duplikat oder Spam, je nach Fall",
            "Triage (nie schließen)",
          ],
          correctIndex: 2,
          explanation:
            "Legitime Out-of-Scope- oder Nicht-Probleme als Duplikat / Spam schließen. Kurze Notiz hält den Audit-Trail sauber, ohne die aktive Queue zu verstopfen.",
        },
      ],
    },
  },
};

export default lesson;
