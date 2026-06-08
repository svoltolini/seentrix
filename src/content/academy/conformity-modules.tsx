/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "conformity-modules",
  duration: "7 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["conformity-assessment-routes"],
  i18n: {
    en: {
      title: "Conformity-assessment modules",
      summary:
        "The Annex VIII modules (A, B+C, H), when a notified body is required, and the surveillance audits that follow.",
      sections: [
        {
          heading: "Why there are modules",
          body: (
            <p>
              The <Term id="conformity_assessment">conformity assessment</Term>{" "}
              you must run depends on the product's CRA category. Annex VIII
              defines the procedures: a default product self-assesses, while
              important and critical products bring in a{" "}
              <Term id="notified_body">notified body</Term>. The module you choose
              is recorded against the product and shapes the rest of the file.
            </p>
          ),
        },
        {
          heading: "Module A, B+C and H",
          body: (
            <p>
              <Term id="module_a">Module A</Term> is internal control — the
              manufacturer self-assesses and issues the declaration.{" "}
              <Term id="module_b_c">Module B+C</Term> pairs an EU-type
              examination (a notified body checks a representative sample) with
              conformity-to-type in production.{" "}
              <Term id="module_h">Module H</Term> is full quality assurance — the
              notified body approves and audits your quality system across design
              and production. A European cybersecurity certification scheme can
              substitute where one exists.
            </p>
          ),
        },
        {
          heading: "Notified bodies & surveillance",
          body: (
            <p>
              When a notified body is involved you keep its name and number, the
              certificate it issues, and the notes from its{" "}
              <strong>surveillance audits</strong> — the periodic checks that your
              quality system (module H) or production (module C) still conforms.
              In Seentrix the chosen module + notified body live on the
              conformity tab, and the surveillance notes on the Lifecycle & Supply
              Chain tab.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Which module is internal control (self-assessment)?",
          options: ["Module A", "Module B+C", "Module H", "Module Z"],
          correctIndex: 0,
          explanation:
            "Module A is internal control: the manufacturer self-assesses and issues the declaration, with no notified body.",
        },
        {
          question: "When is a notified body required?",
          options: [
            "For every product",
            "For important and critical products (modules B+C or H)",
            "Only for free software",
            "Never under the CRA",
          ],
          correctIndex: 1,
          explanation:
            "Default products self-assess (module A); important/critical products bring in a notified body via module B+C or H.",
        },
        {
          question: "What does Module H cover?",
          options: [
            "A single product photo",
            "Full quality assurance — the notified body approves and audits the quality system",
            "Only the packaging",
            "A 24-hour incident report",
          ],
          correctIndex: 1,
          explanation:
            "Module H is full quality assurance across design and production, approved and audited by a notified body.",
        },
        {
          question: "What is Module B+C?",
          options: [
            "Two unrelated documents",
            "EU-type examination plus conformity to type in production",
            "A marketing review",
            "A penetration test",
          ],
          correctIndex: 1,
          explanation:
            "Module B is the EU-type examination; module C is conformity to the examined type during production.",
        },
        {
          question: "What ongoing duty follows under module H?",
          options: [
            "Nothing once certified",
            "Periodic surveillance audits of the quality system by the notified body",
            "Daily incident reports",
            "Re-printing the CE mark weekly",
          ],
          correctIndex: 1,
          explanation:
            "Under module H the notified body carries out periodic surveillance audits; keep the notes with the product.",
        },
      ],
    },
    de: {
      title: "Konformitätsbewertungsmodule",
      summary:
        "Die Module nach Anhang VIII (A, B+C, H), wann eine notifizierte Stelle erforderlich ist und die anschließenden Überwachungsaudits.",
      sections: [
        {
          heading: "Warum es Module gibt",
          body: (
            <p>
              Die durchzuführende{" "}
              <Term id="conformity_assessment">Konformitätsbewertung</Term> hängt
              von der CRA-Kategorie des Produkts ab. Anhang VIII definiert die
              Verfahren: ein Standardprodukt bewertet sich selbst, während
              wichtige und kritische Produkte eine{" "}
              <Term id="notified_body">notifizierte Stelle</Term> einbeziehen. Das
              gewählte Modul wird beim Produkt erfasst und prägt die übrige Akte.
            </p>
          ),
        },
        {
          heading: "Modul A, B+C und H",
          body: (
            <p>
              <Term id="module_a">Modul A</Term> ist die interne Kontrolle — der
              Hersteller bewertet sich selbst und stellt die Erklärung aus.{" "}
              <Term id="module_b_c">Modul B+C</Term> verbindet eine
              EU-Baumusterprüfung (eine notifizierte Stelle prüft ein Muster) mit
              der Konformität mit der Bauart in der Produktion.{" "}
              <Term id="module_h">Modul H</Term> ist die umfassende
              Qualitätssicherung — die notifizierte Stelle genehmigt und auditiert
              Ihr Qualitätssystem über Design und Produktion. Wo vorhanden, kann
              ein europäisches Zertifizierungsschema ersetzen.
            </p>
          ),
        },
        {
          heading: "Notifizierte Stellen & Überwachung",
          body: (
            <p>
              Ist eine notifizierte Stelle beteiligt, bewahren Sie ihren Namen und
              ihre Nummer, das ausgestellte Zertifikat und die Notizen ihrer{" "}
              <strong>Überwachungsaudits</strong> auf — der regelmäßigen Prüfungen,
              dass Ihr Qualitätssystem (Modul H) oder die Produktion (Modul C)
              weiterhin konform ist. In Seentrix stehen Modul + notifizierte Stelle
              im Konformitätsreiter und die Überwachungsnotizen im Reiter
              Lebenszyklus & Lieferkette.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Welches Modul ist die interne Kontrolle (Selbstbewertung)?",
          options: ["Modul A", "Modul B+C", "Modul H", "Modul Z"],
          correctIndex: 0,
          explanation:
            "Modul A ist die interne Kontrolle: der Hersteller bewertet sich selbst und stellt die Erklärung aus, ohne notifizierte Stelle.",
        },
        {
          question: "Wann ist eine notifizierte Stelle erforderlich?",
          options: [
            "Für jedes Produkt",
            "Für wichtige und kritische Produkte (Module B+C oder H)",
            "Nur für freie Software",
            "Nie unter dem CRA",
          ],
          correctIndex: 1,
          explanation:
            "Standardprodukte bewerten sich selbst (Modul A); wichtige/kritische Produkte ziehen über Modul B+C oder H eine notifizierte Stelle hinzu.",
        },
        {
          question: "Was umfasst Modul H?",
          options: [
            "Ein einzelnes Produktfoto",
            "Umfassende Qualitätssicherung — die notifizierte Stelle genehmigt und auditiert das Qualitätssystem",
            "Nur die Verpackung",
            "Einen 24-Stunden-Vorfallbericht",
          ],
          correctIndex: 1,
          explanation:
            "Modul H ist die umfassende Qualitätssicherung über Design und Produktion, genehmigt und auditiert von einer notifizierten Stelle.",
        },
        {
          question: "Was ist Modul B+C?",
          options: [
            "Zwei unzusammenhängende Dokumente",
            "EU-Baumusterprüfung plus Konformität mit der Bauart in der Produktion",
            "Eine Marketingprüfung",
            "Ein Penetrationstest",
          ],
          correctIndex: 1,
          explanation:
            "Modul B ist die EU-Baumusterprüfung; Modul C ist die Konformität mit der geprüften Bauart in der Produktion.",
        },
        {
          question: "Welche fortlaufende Pflicht folgt unter Modul H?",
          options: [
            "Nach der Zertifizierung nichts",
            "Regelmäßige Überwachungsaudits des Qualitätssystems durch die notifizierte Stelle",
            "Tägliche Vorfallberichte",
            "Wöchentliches Neudrucken der CE-Kennzeichnung",
          ],
          correctIndex: 1,
          explanation:
            "Unter Modul H führt die notifizierte Stelle regelmäßige Überwachungsaudits durch; bewahren Sie die Notizen beim Produkt auf.",
        },
      ],
    },
    fr: {
      title: "Modules d'évaluation de la conformité",
      summary:
        "Les modules de l'annexe VIII (A, B+C, H), quand un organisme notifié est requis, et les audits de surveillance qui suivent.",
      sections: [
        {
          heading: "Pourquoi des modules",
          body: (
            <p>
              L'<Term id="conformity_assessment">évaluation de la conformité</Term>{" "}
              à mener dépend de la catégorie CRA du produit. L'annexe VIII définit
              les procédures : un produit par défaut s'auto-évalue, tandis que les
              produits importants et critiques font intervenir un{" "}
              <Term id="notified_body">organisme notifié</Term>. Le module choisi
              est enregistré pour le produit et structure le reste du dossier.
            </p>
          ),
        },
        {
          heading: "Modules A, B+C et H",
          body: (
            <p>
              Le <Term id="module_a">module A</Term> est le contrôle interne — le
              fabricant s'auto-évalue et établit la déclaration. Le{" "}
              <Term id="module_b_c">module B+C</Term> associe un examen UE de type
              (un organisme notifié contrôle un échantillon) à la conformité au
              type en production. Le <Term id="module_h">module H</Term> est
              l'assurance qualité complète — l'organisme notifié approuve et
              audite votre système qualité, de la conception à la production. Un
              schéma de certification européen peut s'y substituer lorsqu'il existe.
            </p>
          ),
        },
        {
          heading: "Organismes notifiés & surveillance",
          body: (
            <p>
              Lorsqu'un organisme notifié intervient, conservez son nom et son
              numéro, le certificat qu'il délivre et les notes de ses{" "}
              <strong>audits de surveillance</strong> — les contrôles périodiques
              que votre système qualité (module H) ou la production (module C)
              reste conforme. Dans Seentrix, le module + l'organisme notifié
              figurent dans l'onglet conformité, et les notes de surveillance dans
              l'onglet Cycle de vie & chaîne d'approvisionnement.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Quel module est le contrôle interne (auto-évaluation) ?",
          options: ["Module A", "Module B+C", "Module H", "Module Z"],
          correctIndex: 0,
          explanation:
            "Le module A est le contrôle interne : le fabricant s'auto-évalue et établit la déclaration, sans organisme notifié.",
        },
        {
          question: "Quand un organisme notifié est-il requis ?",
          options: [
            "Pour chaque produit",
            "Pour les produits importants et critiques (modules B+C ou H)",
            "Uniquement pour les logiciels libres",
            "Jamais sous le CRA",
          ],
          correctIndex: 1,
          explanation:
            "Les produits par défaut s'auto-évaluent (module A) ; les produits importants/critiques font intervenir un organisme notifié via le module B+C ou H.",
        },
        {
          question: "Que couvre le module H ?",
          options: [
            "Une simple photo du produit",
            "L'assurance qualité complète — l'organisme notifié approuve et audite le système qualité",
            "Uniquement l'emballage",
            "Un rapport d'incident à 24 heures",
          ],
          correctIndex: 1,
          explanation:
            "Le module H est l'assurance qualité complète, de la conception à la production, approuvée et auditée par un organisme notifié.",
        },
        {
          question: "Qu'est-ce que le module B+C ?",
          options: [
            "Deux documents sans rapport",
            "L'examen UE de type plus la conformité au type en production",
            "Une revue marketing",
            "Un test d'intrusion",
          ],
          correctIndex: 1,
          explanation:
            "Le module B est l'examen UE de type ; le module C est la conformité au type examiné en production.",
        },
        {
          question: "Quelle obligation continue suit sous le module H ?",
          options: [
            "Rien une fois certifié",
            "Des audits de surveillance périodiques du système qualité par l'organisme notifié",
            "Des rapports d'incident quotidiens",
            "Réimprimer le marquage CE chaque semaine",
          ],
          correctIndex: 1,
          explanation:
            "Sous le module H, l'organisme notifié réalise des audits de surveillance périodiques ; conservez les notes avec le produit.",
        },
      ],
    },
    it: {
      title: "Moduli di valutazione della conformità",
      summary:
        "I moduli dell'allegato VIII (A, B+C, H), quando è richiesto un organismo notificato e gli audit di sorveglianza che ne seguono.",
      sections: [
        {
          heading: "Perché esistono i moduli",
          body: (
            <p>
              La <Term id="conformity_assessment">valutazione della conformità</Term>{" "}
              da svolgere dipende dalla categoria CRA del prodotto. L'allegato VIII
              definisce le procedure: un prodotto predefinito si autovaluta, mentre
              i prodotti importanti e critici coinvolgono un{" "}
              <Term id="notified_body">organismo notificato</Term>. Il modulo
              scelto è registrato per il prodotto e plasma il resto del fascicolo.
            </p>
          ),
        },
        {
          heading: "Moduli A, B+C e H",
          body: (
            <p>
              Il <Term id="module_a">modulo A</Term> è il controllo interno — il
              fabbricante si autovaluta ed emette la dichiarazione. Il{" "}
              <Term id="module_b_c">modulo B+C</Term> abbina un esame UE del tipo
              (un organismo notificato controlla un campione) alla conformità al
              tipo in produzione. Il <Term id="module_h">modulo H</Term> è la
              garanzia qualità totale — l'organismo notificato approva e verifica il
              tuo sistema qualità, dalla progettazione alla produzione. Dove esiste,
              uno schema di certificazione europeo può sostituirlo.
            </p>
          ),
        },
        {
          heading: "Organismi notificati & sorveglianza",
          body: (
            <p>
              Quando interviene un organismo notificato, conserva il suo nome e
              numero, il certificato che rilascia e le note dei suoi{" "}
              <strong>audit di sorveglianza</strong> — i controlli periodici che il
              tuo sistema qualità (modulo H) o la produzione (modulo C) resti
              conforme. In Seentrix il modulo + l'organismo notificato sono nella
              scheda conformità e le note di sorveglianza nella scheda Ciclo di vita
              & catena di fornitura.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Quale modulo è il controllo interno (autovalutazione)?",
          options: ["Modulo A", "Modulo B+C", "Modulo H", "Modulo Z"],
          correctIndex: 0,
          explanation:
            "Il modulo A è il controllo interno: il fabbricante si autovaluta ed emette la dichiarazione, senza organismo notificato.",
        },
        {
          question: "Quando è richiesto un organismo notificato?",
          options: [
            "Per ogni prodotto",
            "Per i prodotti importanti e critici (moduli B+C o H)",
            "Solo per il software libero",
            "Mai sotto il CRA",
          ],
          correctIndex: 1,
          explanation:
            "I prodotti predefiniti si autovalutano (modulo A); i prodotti importanti/critici coinvolgono un organismo notificato tramite il modulo B+C o H.",
        },
        {
          question: "Cosa copre il modulo H?",
          options: [
            "Una singola foto del prodotto",
            "La garanzia qualità totale — l'organismo notificato approva e verifica il sistema qualità",
            "Solo l'imballaggio",
            "Un rapporto d'incidente a 24 ore",
          ],
          correctIndex: 1,
          explanation:
            "Il modulo H è la garanzia qualità totale, dalla progettazione alla produzione, approvata e verificata da un organismo notificato.",
        },
        {
          question: "Cos'è il modulo B+C?",
          options: [
            "Due documenti scollegati",
            "L'esame UE del tipo più la conformità al tipo in produzione",
            "Una revisione di marketing",
            "Un penetration test",
          ],
          correctIndex: 1,
          explanation:
            "Il modulo B è l'esame UE del tipo; il modulo C è la conformità al tipo esaminato in produzione.",
        },
        {
          question: "Quale obbligo continuo segue sotto il modulo H?",
          options: [
            "Nulla una volta certificato",
            "Audit di sorveglianza periodici del sistema qualità da parte dell'organismo notificato",
            "Rapporti d'incidente quotidiani",
            "Ristampare la marcatura CE ogni settimana",
          ],
          correctIndex: 1,
          explanation:
            "Sotto il modulo H l'organismo notificato svolge audit di sorveglianza periodici; conserva le note con il prodotto.",
        },
      ],
    },
  },
};

export default lesson;
