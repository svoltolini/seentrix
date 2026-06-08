/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "enisa-single-reporting-platform",
  duration: "7 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["article-14-reporting"],
  i18n: {
    en: {
      title: "The ENISA Single Reporting Platform",
      summary:
        "Where Article 14 notifications are filed, how the three submissions and their deadlines work, and how Seentrix packages each stage for the platform.",
      sections: [
        {
          heading: "One platform, three submissions",
          body: (
            <p>
              Article 14 notifications are filed through the{" "}
              <Term id="single_reporting_platform">
                Single Reporting Platform
              </Term>{" "}
              established by <Term id="enisa">ENISA</Term> — one electronic entry
              point that routes your early warning, intermediate report and final
              report to the <Term id="csirt">CSIRT</Term> designated as
              coordinator and onward to the relevant authorities. You don't email
              a CSIRT or post a form on your website; you submit through the
              platform, which returns a reference number for each stage.
            </p>
          ),
        },
        {
          heading: "When each clock starts — and ends",
          body: (
            <p>
              The clock starts the moment you become aware. The{" "}
              <Term id="early_warning">early warning</Term> is due within{" "}
              <strong>24 hours</strong>, the intermediate report within{" "}
              <strong>72 hours</strong>, and the final report depends on the
              trigger: <strong>14 days</strong> for an actively-exploited
              vulnerability, or <strong>one month</strong> for a severe security
              incident. Getting that final window right matters — Seentrix's
              countdowns are trigger-aware so a vulnerability and an incident show
              different final deadlines.
            </p>
          ),
        },
        {
          heading: "What a submission contains — and the reference number",
          body: (
            <p>
              Each stage is a <strong>structured submission</strong>: your
              organisation and security contact, the report type and severity,
              the affected products, when you became aware, and the narrative for
              that stage. After you file it, the platform returns a{" "}
              <strong>reference number</strong> — keep it with the case, because
              it ties your three submissions together and proves the timeline to
              a market-surveillance authority.
            </p>
          ),
        },
        {
          heading: "How Seentrix packages it",
          body: (
            <p>
              On the incident's detail page each submitted stage can be exported
              as a <strong>submission package</strong> (a structured PDF plus
              copyable fields) that you file into the platform, and you record the
              returned <strong>SRP reference number</strong> back against the
              stage so the submission log is complete. Ask the Copilot "what
              reporting deadlines are open?" and it lists every open clock and
              when each is due — backed by the <Term id="article_14">Article 14</Term>{" "}
              workflow.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Where are Article 14 notifications filed?",
          options: [
            "By email to your national CSIRT",
            "Through the ENISA Single Reporting Platform",
            "As a public post on your website",
            "By post to the European Commission",
          ],
          correctIndex: 1,
          explanation:
            "Article 14 notifications go through the single reporting platform established by ENISA, which routes them to the coordinating CSIRT and onward.",
        },
        {
          question: "What is the final-report deadline for a severe security incident?",
          options: ["14 days", "72 hours", "One month", "10 years"],
          correctIndex: 2,
          explanation:
            "For a severe incident the final report is due within one month; for an actively-exploited vulnerability it is 14 days.",
        },
        {
          question:
            "What is the final-report deadline for an actively-exploited vulnerability?",
          options: ["24 hours", "14 days", "One month", "6 months"],
          correctIndex: 1,
          explanation:
            "An actively-exploited vulnerability's final report is due within 14 days; a severe incident gets one month.",
        },
        {
          question: "What should you keep after submitting a stage to the platform?",
          options: [
            "Nothing — the platform remembers it",
            "The reference number the platform returns",
            "A screenshot of your dashboard",
            "The reporter's email address",
          ],
          correctIndex: 1,
          explanation:
            "The platform returns a reference number per submission; retain it with the case to tie the three submissions together and evidence the timeline.",
        },
        {
          question: "When does the Article 14 reporting clock start?",
          options: [
            "When the final report is ready",
            "When the manufacturer becomes aware of the incident or exploited vulnerability",
            "When ENISA contacts you",
            "When the product is placed on the market",
          ],
          correctIndex: 1,
          explanation:
            "All three windows are measured from the moment the manufacturer becomes aware (aware_at).",
        },
      ],
    },
    de: {
      title: "Die ENISA Single Reporting Platform",
      summary:
        "Wo Meldungen nach Artikel 14 eingereicht werden, wie die drei Einreichungen und ihre Fristen funktionieren und wie Seentrix jede Phase für die Plattform aufbereitet.",
      sections: [
        {
          heading: "Eine Plattform, drei Einreichungen",
          body: (
            <p>
              Meldungen nach Artikel 14 werden über die von{" "}
              <Term id="enisa">ENISA</Term> eingerichtete{" "}
              <Term id="single_reporting_platform">
                Single Reporting Platform
              </Term>{" "}
              eingereicht — ein elektronischer Zugangspunkt, der Ihre Frühwarnung,
              den Zwischenbericht und den Abschlussbericht an das als Koordinator
              benannte <Term id="csirt">CSIRT</Term> und weiter an die
              zuständigen Behörden leitet. Sie senden keine E-Mail an ein CSIRT;
              Sie reichen über die Plattform ein, die für jede Phase eine
              Referenznummer zurückgibt.
            </p>
          ),
        },
        {
          heading: "Wann jede Uhr startet — und endet",
          body: (
            <p>
              Die Uhr startet, sobald Sie Kenntnis erlangen. Die{" "}
              <Term id="early_warning">Frühwarnung</Term> ist innerhalb von{" "}
              <strong>24 Stunden</strong> fällig, der Zwischenbericht innerhalb von{" "}
              <strong>72 Stunden</strong>, und der Abschlussbericht hängt vom
              Auslöser ab: <strong>14 Tage</strong> bei einer aktiv ausgenutzten
              Schwachstelle oder <strong>ein Monat</strong> bei einem schweren
              Sicherheitsvorfall. Die Seentrix-Countdowns sind auslöserabhängig.
            </p>
          ),
        },
        {
          heading: "Was eine Einreichung enthält — und die Referenznummer",
          body: (
            <p>
              Jede Phase ist eine <strong>strukturierte Einreichung</strong>: Ihre
              Organisation und der Sicherheitskontakt, Meldungstyp und Schweregrad,
              die betroffenen Produkte, der Zeitpunkt der Kenntnisnahme und die
              Beschreibung für diese Phase. Nach dem Einreichen gibt die Plattform
              eine <strong>Referenznummer</strong> zurück — bewahren Sie sie zum
              Fall auf, denn sie verbindet Ihre drei Einreichungen und belegt die
              Zeitleiste gegenüber einer Marktüberwachungsbehörde.
            </p>
          ),
        },
        {
          heading: "Wie Seentrix es aufbereitet",
          body: (
            <p>
              Auf der Detailseite des Vorfalls lässt sich jede eingereichte Phase
              als <strong>Einreichungspaket</strong> (strukturiertes PDF plus
              kopierbare Felder) exportieren, das Sie in die Plattform einstellen,
              und Sie erfassen die zurückgegebene{" "}
              <strong>SRP-Referenznummer</strong> wieder zur Phase. Fragen Sie den
              Copilot „Welche Meldefristen sind offen?“ und er listet jede offene
              Uhr samt Fälligkeit — gestützt auf den{" "}
              <Term id="article_14">Artikel-14</Term>-Workflow.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Wo werden Meldungen nach Artikel 14 eingereicht?",
          options: [
            "Per E-Mail an das nationale CSIRT",
            "Über die ENISA Single Reporting Platform",
            "Als öffentlicher Beitrag auf Ihrer Website",
            "Per Post an die Europäische Kommission",
          ],
          correctIndex: 1,
          explanation:
            "Meldungen nach Artikel 14 laufen über die von ENISA eingerichtete Single Reporting Platform, die sie an das koordinierende CSIRT weiterleitet.",
        },
        {
          question:
            "Wie lautet die Frist für den Abschlussbericht bei einem schweren Sicherheitsvorfall?",
          options: ["14 Tage", "72 Stunden", "Ein Monat", "10 Jahre"],
          correctIndex: 2,
          explanation:
            "Bei einem schweren Vorfall ist der Abschlussbericht innerhalb eines Monats fällig; bei einer aktiv ausgenutzten Schwachstelle 14 Tage.",
        },
        {
          question:
            "Wie lautet die Frist für den Abschlussbericht bei einer aktiv ausgenutzten Schwachstelle?",
          options: ["24 Stunden", "14 Tage", "Ein Monat", "6 Monate"],
          correctIndex: 1,
          explanation:
            "Der Abschlussbericht zu einer aktiv ausgenutzten Schwachstelle ist innerhalb von 14 Tagen fällig; ein schwerer Vorfall erhält einen Monat.",
        },
        {
          question:
            "Was sollten Sie nach dem Einreichen einer Phase auf der Plattform aufbewahren?",
          options: [
            "Nichts — die Plattform merkt es sich",
            "Die von der Plattform zurückgegebene Referenznummer",
            "Einen Screenshot Ihres Dashboards",
            "Die E-Mail-Adresse des Melders",
          ],
          correctIndex: 1,
          explanation:
            "Die Plattform gibt pro Einreichung eine Referenznummer zurück; bewahren Sie sie zum Fall auf, um die Zeitleiste zu belegen.",
        },
        {
          question: "Wann startet die Meldeuhr nach Artikel 14?",
          options: [
            "Wenn der Abschlussbericht fertig ist",
            "Wenn der Hersteller Kenntnis vom Vorfall oder der ausgenutzten Schwachstelle erlangt",
            "Wenn ENISA Sie kontaktiert",
            "Wenn das Produkt in Verkehr gebracht wird",
          ],
          correctIndex: 1,
          explanation:
            "Alle drei Fenster werden ab dem Moment der Kenntnisnahme (aware_at) gemessen.",
        },
      ],
    },
    fr: {
      title: "La plateforme de signalement unique de l'ENISA",
      summary:
        "Où les notifications de l'Article 14 sont déposées, comment fonctionnent les trois soumissions et leurs échéances, et comment Seentrix prépare chaque étape pour la plateforme.",
      sections: [
        {
          heading: "Une plateforme, trois soumissions",
          body: (
            <p>
              Les notifications de l'Article 14 sont déposées via la{" "}
              <Term id="single_reporting_platform">
                plateforme de signalement unique
              </Term>{" "}
              établie par l'<Term id="enisa">ENISA</Term> — un point d'entrée
              électronique qui achemine votre alerte précoce, votre rapport
              intermédiaire et votre rapport final vers le{" "}
              <Term id="csirt">CSIRT</Term> désigné comme coordinateur, puis vers
              les autorités compétentes. Vous n'envoyez pas d'e-mail ; vous
              soumettez via la plateforme, qui renvoie un numéro de référence pour
              chaque étape.
            </p>
          ),
        },
        {
          heading: "Quand chaque horloge démarre — et se termine",
          body: (
            <p>
              L'horloge démarre dès que vous avez connaissance. L'
              <Term id="early_warning">alerte précoce</Term> est due sous{" "}
              <strong>24 heures</strong>, le rapport intermédiaire sous{" "}
              <strong>72 heures</strong>, et le rapport final dépend du
              déclencheur : <strong>14 jours</strong> pour une vulnérabilité
              activement exploitée, ou <strong>un mois</strong> pour un incident
              de sécurité grave. Les comptes à rebours de Seentrix tiennent compte
              du déclencheur.
            </p>
          ),
        },
        {
          heading: "Ce que contient une soumission — et le numéro de référence",
          body: (
            <p>
              Chaque étape est une <strong>soumission structurée</strong> : votre
              organisation et votre contact sécurité, le type de signalement et la
              gravité, les produits concernés, la date de prise de connaissance et
              le récit de cette étape. Après le dépôt, la plateforme renvoie un{" "}
              <strong>numéro de référence</strong> — conservez-le avec le dossier,
              car il relie vos trois soumissions et prouve la chronologie à une
              autorité de surveillance du marché.
            </p>
          ),
        },
        {
          heading: "Comment Seentrix le prépare",
          body: (
            <p>
              Sur la page de détail de l'incident, chaque étape soumise peut être
              exportée en <strong>dossier de soumission</strong> (un PDF structuré
              et des champs copiables) que vous déposez dans la plateforme, et vous
              enregistrez le <strong>numéro de référence SRP</strong> renvoyé en
              regard de l'étape. Demandez au Copilot « quelles échéances de
              signalement sont ouvertes ? » et il liste chaque horloge ouverte et
              son échéance — appuyé sur le flux de l'
              <Term id="article_14">Article 14</Term>.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Où les notifications de l'Article 14 sont-elles déposées ?",
          options: [
            "Par e-mail à votre CSIRT national",
            "Via la plateforme de signalement unique de l'ENISA",
            "En publication publique sur votre site web",
            "Par courrier à la Commission européenne",
          ],
          correctIndex: 1,
          explanation:
            "Les notifications de l'Article 14 passent par la plateforme de signalement unique établie par l'ENISA, qui les achemine vers le CSIRT coordinateur.",
        },
        {
          question:
            "Quelle est l'échéance du rapport final pour un incident de sécurité grave ?",
          options: ["14 jours", "72 heures", "Un mois", "10 ans"],
          correctIndex: 2,
          explanation:
            "Pour un incident grave, le rapport final est dû sous un mois ; pour une vulnérabilité activement exploitée, c'est 14 jours.",
        },
        {
          question:
            "Quelle est l'échéance du rapport final pour une vulnérabilité activement exploitée ?",
          options: ["24 heures", "14 jours", "Un mois", "6 mois"],
          correctIndex: 1,
          explanation:
            "Le rapport final d'une vulnérabilité activement exploitée est dû sous 14 jours ; un incident grave obtient un mois.",
        },
        {
          question:
            "Que devez-vous conserver après avoir soumis une étape à la plateforme ?",
          options: [
            "Rien — la plateforme s'en souvient",
            "Le numéro de référence renvoyé par la plateforme",
            "Une capture d'écran de votre tableau de bord",
            "L'adresse e-mail du rapporteur",
          ],
          correctIndex: 1,
          explanation:
            "La plateforme renvoie un numéro de référence par soumission ; conservez-le avec le dossier pour prouver la chronologie.",
        },
        {
          question: "Quand l'horloge de signalement de l'Article 14 démarre-t-elle ?",
          options: [
            "Quand le rapport final est prêt",
            "Quand le fabricant a connaissance de l'incident ou de la vulnérabilité exploitée",
            "Quand l'ENISA vous contacte",
            "Quand le produit est mis sur le marché",
          ],
          correctIndex: 1,
          explanation:
            "Les trois fenêtres sont mesurées à partir du moment où le fabricant a connaissance (aware_at).",
        },
      ],
    },
    it: {
      title: "La piattaforma di segnalazione unica dell'ENISA",
      summary:
        "Dove si presentano le notifiche dell'Articolo 14, come funzionano le tre submission e le loro scadenze, e come Seentrix prepara ogni fase per la piattaforma.",
      sections: [
        {
          heading: "Una piattaforma, tre submission",
          body: (
            <p>
              Le notifiche dell'Articolo 14 si presentano tramite la{" "}
              <Term id="single_reporting_platform">
                piattaforma di segnalazione unica
              </Term>{" "}
              istituita dall'<Term id="enisa">ENISA</Term> — un unico punto di
              accesso elettronico che instrada l'allerta precoce, il rapporto
              intermedio e il rapporto finale al{" "}
              <Term id="csirt">CSIRT</Term> designato come coordinatore e poi alle
              autorità competenti. Non invii e-mail; presenti tramite la
              piattaforma, che restituisce un numero di riferimento per ogni fase.
            </p>
          ),
        },
        {
          heading: "Quando ogni orologio parte — e finisce",
          body: (
            <p>
              L'orologio parte nel momento in cui vieni a conoscenza. L'
              <Term id="early_warning">allerta precoce</Term> è dovuta entro{" "}
              <strong>24 ore</strong>, il rapporto intermedio entro{" "}
              <strong>72 ore</strong>, e il rapporto finale dipende dall'evento
              scatenante: <strong>14 giorni</strong> per una vulnerabilità
              attivamente sfruttata, o <strong>un mese</strong> per un grave
              incidente di sicurezza. I conti alla rovescia di Seentrix tengono
              conto dell'evento scatenante.
            </p>
          ),
        },
        {
          heading: "Cosa contiene una submission — e il numero di riferimento",
          body: (
            <p>
              Ogni fase è una <strong>submission strutturata</strong>: la tua
              organizzazione e il contatto di sicurezza, il tipo di segnalazione e
              la gravità, i prodotti interessati, quando sei venuto a conoscenza e
              la descrizione di quella fase. Dopo l'invio, la piattaforma
              restituisce un <strong>numero di riferimento</strong> — conservalo
              con il caso, perché collega le tre submission e dimostra la
              cronologia a un'autorità di vigilanza del mercato.
            </p>
          ),
        },
        {
          heading: "Come Seentrix la prepara",
          body: (
            <p>
              Nella pagina di dettaglio dell'incidente ogni fase inviata può
              essere esportata come <strong>pacchetto di submission</strong> (un
              PDF strutturato più campi copiabili) da inserire nella piattaforma, e
              registri il <strong>numero di riferimento SRP</strong> restituito in
              corrispondenza della fase. Chiedi al Copilot «quali scadenze di
              segnalazione sono aperte?» ed elenca ogni orologio aperto e la
              relativa scadenza — basato sul flusso dell'
              <Term id="article_14">Articolo 14</Term>.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Dove si presentano le notifiche dell'Articolo 14?",
          options: [
            "Via e-mail al CSIRT nazionale",
            "Tramite la piattaforma di segnalazione unica dell'ENISA",
            "Come post pubblico sul tuo sito web",
            "Per posta alla Commissione europea",
          ],
          correctIndex: 1,
          explanation:
            "Le notifiche dell'Articolo 14 passano per la piattaforma di segnalazione unica istituita dall'ENISA, che le instrada al CSIRT coordinatore.",
        },
        {
          question:
            "Qual è la scadenza del rapporto finale per un grave incidente di sicurezza?",
          options: ["14 giorni", "72 ore", "Un mese", "10 anni"],
          correctIndex: 2,
          explanation:
            "Per un grave incidente il rapporto finale è dovuto entro un mese; per una vulnerabilità attivamente sfruttata sono 14 giorni.",
        },
        {
          question:
            "Qual è la scadenza del rapporto finale per una vulnerabilità attivamente sfruttata?",
          options: ["24 ore", "14 giorni", "Un mese", "6 mesi"],
          correctIndex: 1,
          explanation:
            "Il rapporto finale di una vulnerabilità attivamente sfruttata è dovuto entro 14 giorni; un grave incidente ottiene un mese.",
        },
        {
          question:
            "Cosa dovresti conservare dopo aver inviato una fase alla piattaforma?",
          options: [
            "Niente — la piattaforma lo ricorda",
            "Il numero di riferimento restituito dalla piattaforma",
            "Uno screenshot della tua dashboard",
            "L'indirizzo e-mail del segnalante",
          ],
          correctIndex: 1,
          explanation:
            "La piattaforma restituisce un numero di riferimento per submission; conservalo con il caso per dimostrare la cronologia.",
        },
        {
          question: "Quando parte l'orologio di segnalazione dell'Articolo 14?",
          options: [
            "Quando il rapporto finale è pronto",
            "Quando il fabbricante viene a conoscenza dell'incidente o della vulnerabilità sfruttata",
            "Quando l'ENISA ti contatta",
            "Quando il prodotto è immesso sul mercato",
          ],
          correctIndex: 1,
          explanation:
            "Tutte e tre le finestre sono misurate dal momento in cui il fabbricante viene a conoscenza (aware_at).",
        },
      ],
    },
  },
};

export default lesson;
