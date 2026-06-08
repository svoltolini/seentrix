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
    fr: {
      title: "Scoring des vulnérabilités (CVSS, EPSS, KEV)",
      summary:
        "Trois signaux complémentaires pour décider quoi corriger en premier. Aucun ne remplace le jugement contextuel.",
      sections: [
        {
          heading: "CVSS — sévérité, pas urgence",
          body: (
            <p>
              <Term id="cvss">CVSS</Term> évalue la sévérité intrinsèque
              d'une vulnérabilité sur une échelle de 0,0 à 10,0. C'est la
              lingua franca des flux de vulnérabilités, mais c'est une
              propriété statique : un CVSS-9,8 « critique » dans un
              composant que nous avons désactivé reste un <em>risque</em>{" "}
              faible. CVSS v4 (2023) est la spécification actuelle ;
              de nombreux flux publient encore des scores v3. Utilisez
              CVSS comme hypothèse de sévérité initiale, pas comme réponse
              définitive.
            </p>
          ),
        },
        {
          heading: "EPSS — probabilité d'exploitation",
          body: (
            <p>
              <Term id="epss">EPSS</Term> est une estimation quotidienne
              (0,0–1,0) indiquant la probabilité qu'un CVE donné soit
              exploité dans les 30 prochains jours. La plupart des CVEs
              sont en dessous de 0,01 — ils ne seront jamais exploités.
              Un EPSS supérieur à 0,5 combiné à un CVSS élevé signifie
              généralement « corriger cette semaine ». EPSS complète CVSS :
              l'un indique la gravité, l'autre la probabilité.
            </p>
          ),
        },
        {
          heading: "KEV — exploitation confirmée",
          body: (
            <p>
              Le catalogue CISA <Term id="kev">KEV</Term> est une liste
              curatée de CVEs activement exploités dans la nature. Une
              inscription au KEV est le signal le plus fort disponible et
              fait remonter le problème en tête de notre file de triage
              indépendamment du CVSS ou de l'EPSS. Dans Seentrix, les
              vulnérabilités inscrites au KEV affichent un point rouge dans
              le tableau des vulnérabilités et font s'allumer le KPI KEV
              dans l'en-tête de l'onglet.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Une vulnérabilité a un CVSS de 9,8, un EPSS de 0,001, et n'est pas dans le KEV. Comment la traiter ?",
          options: [
            "Urgence — CVSS 9,8 est critique",
            "Corriger dans le sprint normal — sévérité intrinsèque élevée mais probabilité d'exploitation faible",
            "Ignorer — un EPSS faible signifie que c'est sûr",
            "Toujours supprimer le composant",
          ],
          correctIndex: 1,
          explanation:
            "CVSS élevé + EPSS faible + absent du KEV = traiter avec attention mais sans panique. Sévérité intrinsèque élevée avec faible probabilité d'exploitation : correction dans le cycle de sprint normal, pas une urgence.",
        },
        {
          question: "Qu'est-ce que le catalogue KEV ?",
          options: [
            "Un répertoire de composants firmware approuvés",
            "La liste CISA des CVEs activement exploités dans la nature",
            "Un remplacement d'EPSS maintenu par ENISA",
            "Un jeu de règles interne à un scanner",
          ],
          correctIndex: 1,
          explanation:
            "KEV = catalogue Known Exploited Vulnerabilities, maintenu par la CISA. ~5 à 10 CVEs sont ajoutés par semaine. La présence dans le KEV est le signal d'exploitation le plus fort dont nous disposons, hormis nos propres logs.",
        },
        {
          question:
            "Un score EPSS de 0,85 signifie approximativement quoi ?",
          options: [
            "Le CVE est exploité dans 85 % des cas lors du premier scan",
            "Il y a environ 85 % de probabilité que ce CVE soit exploité dans les 30 prochains jours",
            "Le CVE est sévère à 85 %",
            "85 % des scanners détectent ce CVE",
          ],
          correctIndex: 1,
          explanation:
            "EPSS est une estimation de probabilité d'exploitation sur 30 jours. 0,85 est très élevé — l'écrasante majorité des CVEs n'atteint jamais 0,1.",
        },
        {
          question:
            "Quel signal seul justifie le flag « vulnérabilité activement exploitée » au titre de l'Article 14 du CRA ?",
          options: [
            "CVSS \u226510",
            "EPSS \u22650,5",
            "Inscription au KEV (ou preuves équivalentes comme nos propres logs de production)",
            "Toute vulnérabilité de plus de 90 jours",
          ],
          correctIndex: 2,
          explanation:
            "Activement exploitée est un constat factuel. L'inscription au KEV est la preuve la plus claire ; un renseignement sur les menaces comparable ou nos propres logs conviennent également. Le CVSS et l'EPSS seuls prédisent la sévérité / la probabilité mais n'établissent pas l'exploitation.",
        },
        {
          question:
            "Un CVE affecte un composant intégré à notre produit mais désactivé à la compilation. Quelle est la bonne triage ?",
          options: [
            "Appliquer le CVSS tel quel ; traiter comme élevé",
            "Marquer comme Non applicable / Accepté avec la preuve que le composant est désactivé",
            "Supprimer le composant — toujours",
            "Enregistrer comme Résolu sans action",
          ],
          correctIndex: 1,
          explanation:
            "Le contexte est tout. Un composant désactivé n'est pas exploitable dans notre configuration livrée. Accepter avec une documentation (flags de compilation, couverture de tests prouvant qu'il est désactivé). Le CVSS n'est pas faux — il ne décrit simplement pas notre risque.",
        },
      ],
    },
    it: {
      title: "Scoring delle vulnerabilità (CVSS, EPSS, KEV)",
      summary:
        "Tre segnali complementari per decidere cosa correggere per primo. Nessuno sostituisce il giudizio contestuale.",
      sections: [
        {
          heading: "CVSS — gravità, non urgenza",
          body: (
            <p>
              <Term id="cvss">CVSS</Term> valuta la gravità intrinseca
              di una vulnerabilità su una scala da 0,0 a 10,0. È la lingua
              franca dei feed di vulnerabilità, ma è una proprietà statica:
              un CVSS-9,8 «critico» in un componente che abbiamo disabilitato
              è comunque un <em>rischio</em> basso. CVSS v4 (2023) è la
              specifica attuale; molti feed pubblicano ancora punteggi v3.
              Usare CVSS come ipotesi di gravità iniziale, non come risposta
              definitiva.
            </p>
          ),
        },
        {
          heading: "EPSS — probabilità di sfruttamento",
          body: (
            <p>
              <Term id="epss">EPSS</Term> è una stima giornaliera (0,0–1,0)
              della probabilità che un dato CVE venga sfruttato nei prossimi
              30 giorni. La maggior parte dei CVE è al di sotto di 0,01 —
              non verranno mai sfruttati. Un EPSS superiore a 0,5 combinato
              con un CVSS elevato significa generalmente «correggere questa
              settimana». EPSS integra CVSS: uno indica la gravità, l'altro
              la probabilità.
            </p>
          ),
        },
        {
          heading: "KEV — sfruttamento confermato",
          body: (
            <p>
              Il catalogo CISA <Term id="kev">KEV</Term> è un elenco curato
              di CVE sfruttati attivamente in the wild. La presenza nel KEV
              è il segnale più forte disponibile e fa salire il problema
              in cima alla nostra coda di triage indipendentemente da CVSS
              o EPSS. In Seentrix, le vulnerabilità incluse nel KEV mostrano
              un punto rosso nella tabella delle vulnerabilità e accendono
              il KPI KEV nell'intestazione della scheda.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Una vulnerabilità ha CVSS 9,8, EPSS 0,001, non è nel KEV. Come trattarla?",
          options: [
            "Emergenza — CVSS 9,8 è critico",
            "Correggere nel normale ciclo di sprint — gravità intrinseca elevata ma bassa probabilità di sfruttamento",
            "Ignorare — EPSS basso significa sicuro",
            "Rimuovere sempre il componente",
          ],
          correctIndex: 1,
          explanation:
            "CVSS alto + EPSS basso + assente dal KEV = trattare con attenzione ma senza panico. Gravità intrinseca elevata con bassa probabilità di sfruttamento è una correzione nel normale ciclo di sprint, non un'emergenza.",
        },
        {
          question: "Cos'è il catalogo KEV?",
          options: [
            "Un elenco di componenti firmware affidabili",
            "La lista CISA dei CVE sfruttati attivamente in the wild",
            "Un sostituto di EPSS gestito da ENISA",
            "Un set di regole interno a uno scanner",
          ],
          correctIndex: 1,
          explanation:
            "KEV = catalogo Known Exploited Vulnerabilities, gestito dalla CISA. ~5–10 CVE vengono aggiunti a settimana. La presenza nel KEV è il segnale di sfruttamento più forte di cui disponiamo al di fuori dei nostri log.",
        },
        {
          question:
            "Un punteggio EPSS di 0,85 significa approssimativamente cosa?",
          options: [
            "Il CVE viene sfruttato nell'85% dei casi al primo scan",
            "C'è circa l'85% di probabilità che questo CVE venga sfruttato nei prossimi 30 giorni",
            "Il CVE è grave all'85%",
            "L'85% degli scanner rileva questo CVE",
          ],
          correctIndex: 1,
          explanation:
            "EPSS è una stima di probabilità di sfruttamento su 30 giorni. 0,85 è molto alto — la stragrande maggioranza dei CVE non raggiunge mai 0,1.",
        },
        {
          question:
            "Quale segnale da solo giustifica il flag «vulnerabilità sfruttata attivamente» ai sensi dell'Articolo 14 del CRA?",
          options: [
            "CVSS \u226510",
            "EPSS \u22650,5",
            "Iscrizione al KEV (o prove equivalenti come i nostri log di produzione)",
            "Qualsiasi vulnerabilità più vecchia di 90 giorni",
          ],
          correctIndex: 2,
          explanation:
            "Sfruttata attivamente è un accertamento fattuale. L'iscrizione al KEV è la prova più chiara; un threat intelligence comparabile o i nostri log sono ugualmente validi. CVSS e EPSS da soli predicono gravità / probabilità ma non dimostrano lo sfruttamento.",
        },
        {
          question:
            "Un CVE riguarda un componente incluso nel nostro prodotto ma disabilitato in fase di compilazione. Qual è il triage corretto?",
          options: [
            "Applicare il CVSS così com'è; trattare come alto",
            "Contrassegnare come Non applicabile / Accettato con la prova che il componente è disabilitato",
            "Rimuovere sempre il componente",
            "Registrare come Risolto senza azione",
          ],
          correctIndex: 1,
          explanation:
            "Il contesto è tutto. Un componente disabilitato non è sfruttabile nella nostra configurazione rilasciata. Accettare con documentazione (flag di compilazione, copertura dei test che prova che è disattivato). Il CVSS non è errato — semplicemente non descrive il nostro rischio.",
        },
      ],
    },
  },
};

export default lesson;
