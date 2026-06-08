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
    fr: {
      title: "Divulgation coordonnée des vulnérabilités et PSIRT",
      summary:
        "Gérer l'intake public, définir les attentes avec les chercheurs et publier des avis — la perspective de l'opérateur face à l'annexe I partie II du CRA.",
      sections: [
        {
          heading: "Pourquoi nous avons besoin d'une politique CVD",
          body: (
            <p>
              <Term id="cvd">Coordinated Vulnerability Disclosure</Term> est
              un engagement public qui signifie : « si vous découvrez un
              problème de sécurité, voici comment le signaler, voici ce que
              nous ferons, voici la protection juridique dont vous
              bénéficiez. » Le CRA l'impose en vertu de l'annexe I partie
              II(1). Au-delà de la conformité, une politique CVD claire
              influe également sur la qualité des rapports que nous
              recevons — une politique vague ou absente dissuade tout
              chercheur responsable de nous contacter.
            </p>
          ),
        },
        {
          heading: "Ce que contient une bonne politique",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Périmètre.</strong> Les produits / versions /
                  domaines couverts par la politique.
                </li>
                <li>
                  <strong>Canal d'intake.</strong> Où soumettre (pour nous,
                  la page de sécurité publique / URL PSIRT), adresse e-mail
                  secondaire.
                </li>
                <li>
                  <strong>SLA de réponse.</strong> Premier accusé de
                  réception, verdict de triage, délai de correction.
                  Valeurs habituelles dans le secteur : 5 jours ouvrés
                  pour accuser réception, 30 jours pour le verdict, 90
                  jours pour la correction.
                </li>
                <li>
                  <strong>Clause de protection juridique.</strong> Nous
                  nous engageons à ne pas engager de poursuites civiles ou
                  pénales contre les chercheurs qui respectent la politique
                  de bonne foi.
                </li>
                <li>
                  <strong>Crédit &amp; divulgation coordonnée.</strong>{" "}
                  Nous mentionnerons les chercheurs dans l'avis et nous
                  conviendrons ensemble du calendrier de divulgation
                  publique.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Faire fonctionner le PSIRT",
          body: (
            <p>
              Le <Term id="psirt">PSIRT</Term> est l'équipe qui met en
              œuvre la politique : traite l'intake, effectue le triage,
              coordonne avec l'équipe d'ingénierie, publie les avis,
              crédite les chercheurs. Dans les petites entreprises, le
              PSIRT est souvent une seule personne portant un second
              rôle — c'est acceptable, mais la <em>fonction</em>{" "}
              doit exister et répondre de manière prévisible. L'onglet
              Rapports de Seentrix est la surface opérationnelle : file
              d'attente d'intake, flux de triage, brouillon d'avis,
              publication sur la page de sécurité publique.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Que signifie concrètement la protection juridique CVD ?",
          options: [
            "Le chercheur reçoit une prime en espèces",
            "Nous nous engageons à ne pas engager de poursuites civiles ou pénales contre les chercheurs qui respectent la politique de bonne foi",
            "Nous gardons le rapport secret indéfiniment",
            "Le chercheur devient un employé",
          ],
          correctIndex: 1,
          explanation:
            "La protection juridique est un engagement légal : respectez notre politique, signalez de bonne foi, et nous ne vous poursuivrons pas en vertu du CFAA (États-Unis), du UK Computer Misuse Act, du §202c StGB allemand, etc. Sans cela, les chercheurs sérieux ne signaleront pas.",
        },
        {
          question: "Où dans Seentrix publions-nous notre politique CVD ?",
          options: [
            "Paramètres → Organisation",
            "Rapports → Page de sécurité publique",
            "Produits → Page de détail de chaque produit",
            "Elle est auto-générée à partir du nom de notre entreprise",
          ],
          correctIndex: 1,
          explanation:
            "L'onglet Rapports (rapports de vulnérabilité) héberge la page de sécurité publique. Le texte de la politique se trouve dans les paramètres de cet onglet et apparaît verbatim sur /security/<slug>.",
        },
        {
          question:
            "Un chercheur signale une vulnérabilité critique et menace de la divulguer publiquement dans 48 heures si nous ne répondons pas. Quelle est la bonne démarche ?",
          options: [
            "L'ignorer",
            "Accuser réception immédiatement, effectuer le triage à la gravité correspondant aux preuves, et négocier un calendrier de divulgation coordonnée réaliste",
            "Déposer un rapport d'incident au titre de l'article 14",
            "Bloquer le signalant",
          ],
          correctIndex: 1,
          explanation:
            "Accuser réception dans les délais de notre SLA, effectuer le triage rapidement et négocier. Les menaces sont généralement une escalade face au silence ; un accusé de réception rapide désamorce souvent la situation. L'article 14 concerne les vulnérabilités activement exploitées, pas chaque rapport de chercheur.",
        },
        {
          question:
            "Un signalant soumet via notre formulaire public avec une adresse e-mail mais signe le rapport « anonyme ». Comment gérer le crédit ?",
          options: [
            "Toujours publier son adresse e-mail",
            "Demander au signalant quel nom (le cas échéant) il souhaite mentionner avant de publier l'avis",
            "Le créditer automatiquement par son adresse e-mail",
            "Ne créditer personne",
          ],
          correctIndex: 1,
          explanation:
            "Toujours demander. Certains chercheurs veulent être crédités avec leur vrai nom, d'autres avec un pseudonyme, d'autres pas du tout. Publier une adresse e-mail associée à un rapport de sécurité constitue une fuite d'informations de notre propre fait.",
        },
        {
          question:
            "Notre PSIRT a reçu 30 rapports en un mois ; 20 étaient clairement des faux positifs / hors périmètre. Dans quel statut Seentrix doivent-ils se terminer ?",
          options: [
            "Accepté",
            "Résolu",
            "Doublon ou Spam, selon le cas",
            "Triage (ne jamais les fermer)",
          ],
          correctIndex: 2,
          explanation:
            "Clôturer les rapports légitimes hors périmètre ou sans problème réel en tant que Doublon / Spam. Une brève note maintient la piste d'audit sans encombrer la file active.",
        },
      ],
    },
    it: {
      title: "Divulgazione coordinata delle vulnerabilità e PSIRT",
      summary:
        "Gestire l'intake pubblico, definire le aspettative con i ricercatori e pubblicare gli avvisi — la prospettiva dell'operatore rispetto all'allegato I parte II del CRA.",
      sections: [
        {
          heading: "Perché abbiamo bisogno di una politica CVD",
          body: (
            <p>
              <Term id="cvd">Coordinated Vulnerability Disclosure</Term> è
              un impegno pubblico che significa: «se trovate un problema di
              sicurezza, ecco come segnalarlo, ecco cosa faremo, ecco la
              protezione legale di cui godrete.» Il CRA lo impone ai sensi
              dell'allegato I parte II(1). Al di là della conformità, una
              politica CVD chiara influisce anche sulla qualità delle
              segnalazioni che riceviamo — politiche vaghe o assenti
              dissuadono qualsiasi ricercatore responsabile dal contattarci.
            </p>
          ),
        },
        {
          heading: "Cosa contiene una buona politica",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Perimetro.</strong> Quali prodotti / versioni /
                  domini sono coperti dalla politica.
                </li>
                <li>
                  <strong>Canale di intake.</strong> Dove inviare la
                  segnalazione (per noi, la pagina di sicurezza pubblica /
                  URL PSIRT), e-mail secondaria.
                </li>
                <li>
                  <strong>SLA di risposta.</strong> Prima conferma di
                  ricezione, verdetto di triage, tempistica di correzione.
                  Valori tipici del settore: 5 giorni lavorativi per la
                  conferma, 30 giorni per il verdetto, 90 giorni per la
                  correzione.
                </li>
                <li>
                  <strong>Clausola di protezione legale.</strong> Ci
                  impegniamo a non intraprendere azioni civili o penali
                  contro i ricercatori che seguono la politica in buona
                  fede.
                </li>
                <li>
                  <strong>Credito &amp; divulgazione coordinata.</strong>{" "}
                  Menzioneremo i ricercatori nell'avviso e concorderemo
                  insieme i tempi della divulgazione pubblica.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Gestire il PSIRT",
          body: (
            <p>
              Il <Term id="psirt">PSIRT</Term> è il team che esegue la
              politica: gestisce l'intake, effettua il triage, si coordina
              con il team di ingegneria, pubblica gli avvisi, accredita i
              ricercatori. Nelle piccole aziende il PSIRT è spesso una
              sola persona con un secondo ruolo — va bene, ma la{" "}
              <em>funzione</em>{" "}
              deve esistere e rispondere in modo prevedibile. La scheda
              Segnalazioni di Seentrix è la superficie operativa: coda di
              intake, flusso di triage, bozza di avviso, pubblicazione
              sulla pagina di sicurezza pubblica.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Cosa significa in pratica la protezione legale CVD?",
          options: [
            "Il ricercatore riceve un premio in denaro",
            "Ci impegniamo a non intraprendere azioni civili o penali contro i ricercatori che seguono la politica in buona fede",
            "Manteniamo il rapporto segreto per sempre",
            "Il ricercatore diventa un dipendente",
          ],
          correctIndex: 1,
          explanation:
            "La protezione legale è un impegno giuridico: seguite la nostra politica, segnalate in buona fede, e non vi perseguiremo ai sensi del CFAA (USA), UK Computer Misuse Act, §202c StGB tedesco, ecc. Senza di essa i ricercatori seri non segnaleranno.",
        },
        {
          question: "Dove in Seentrix pubblichiamo la nostra politica CVD?",
          options: [
            "Impostazioni → Organizzazione",
            "Segnalazioni → Pagina di sicurezza pubblica",
            "Prodotti → Pagina di dettaglio di ciascun prodotto",
            "Viene generata automaticamente dal nome della nostra azienda",
          ],
          correctIndex: 1,
          explanation:
            "La scheda Segnalazioni (segnalazioni di vulnerabilità) ospita la pagina di sicurezza pubblica. Il testo della politica si trova nelle impostazioni di quella scheda e appare verbatim su /security/<slug>.",
        },
        {
          question:
            "Un ricercatore segnala una vulnerabilità critica e minaccia di divulgarla pubblicamente entro 48 ore se non riceviamo risposta. Qual è la mossa giusta?",
          options: [
            "Ignorarlo",
            "Confermare immediatamente la ricezione, effettuare il triage a una gravità commisurata alle sue prove e negoziare una tempistica di divulgazione coordinata realistica",
            "Presentare un rapporto di incidente ai sensi dell'articolo 14",
            "Bloccare il segnalante",
          ],
          correctIndex: 1,
          explanation:
            "Confermare la ricezione entro i termini del nostro SLA, effettuare il triage rapidamente e negoziare. Le minacce sono solitamente un'escalation in risposta al silenzio; una conferma rapida spesso de-escalation. L'articolo 14 riguarda le vulnerabilità sfruttate attivamente, non ogni segnalazione di ricercatore.",
        },
        {
          question:
            "Un segnalante invia tramite il nostro modulo pubblico con un indirizzo e-mail ma firma il rapporto come «anonimo». Come gestiamo il credito?",
          options: [
            "Pubblicare sempre il suo indirizzo e-mail",
            "Chiedere al segnalante quale nome (se presente) desidera sia menzionato prima di pubblicare l'avviso",
            "Accreditarlo automaticamente tramite il suo indirizzo e-mail",
            "Non accreditare nessuno",
          ],
          correctIndex: 1,
          explanation:
            "Chiedere sempre. Alcuni ricercatori vogliono essere accreditati con il vero nome, altri con uno pseudonimo, altri con nessun credito. Pubblicare un indirizzo e-mail abbinato a un rapporto di sicurezza è una perdita di informazioni di nostra stessa creazione.",
        },
        {
          question:
            "Il nostro PSIRT ha ricevuto 30 segnalazioni in un mese; 20 erano chiaramente falsi positivi / fuori perimetro. In quale stato Seentrix devono finire?",
          options: [
            "Accettato",
            "Risolto",
            "Duplicato o Spam, a seconda del caso",
            "Triage (non chiuderli mai)",
          ],
          correctIndex: 2,
          explanation:
            "Chiudere le segnalazioni legittime fuori perimetro o che non costituiscono un problema reale come Duplicato / Spam. Una breve nota mantiene la pista di audit senza intasare la coda attiva.",
        },
      ],
    },
  },
};

export default lesson;
