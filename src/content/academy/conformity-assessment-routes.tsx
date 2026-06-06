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
            "What’s the main operational difference between Module B+C and Module H?",
          options: [
            "Module H doesn’t require a notified body",
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
            "We classified a product as Critical but picked Module A. What’s the consequence?",
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
            "Where do we look up a notified body’s four-digit ID and scope?",
          options: [
            "The ENISA single reporting platform",
            "The NANDO database (ec.europa.eu/growth/tools-databases/nando)",
            "Our national trade register",
            "The EUDAMED database",
          ],
          correctIndex: 1,
          explanation:
            "NANDO (New Approach Notified and Designated Organisations) is the Commission’s authoritative database of notified bodies, including their IDs, addresses, and scopes of competence.",
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
    fr: {
      title: "Procédures d’évaluation de la conformité (Module A, B+C, H)",
      summary:
        "Comment nous prouvons que notre produit satisfait à l’Annexe I. La procédure dépend de la classification CRA — auto-évaluation, examen de type ou audit qualité complet.",
      sections: [
        {
          heading: "Pourquoi quatre procédures existent",
          body: (
            <p>
              Le CRA répartit les produits en niveaux de risque — par défaut,{" "}
              <em>Important Class I</em>, <em>Important Class II</em> et{" "}
              <em>Critical</em>. Un risque plus élevé implique un contrôle
              tiers plus poussé. La{" "}
              <Term id="conformity_assessment">procédure d’évaluation de la conformité</Term>{" "}
              est la manière dont nous démontrons la conformité au niveau
              correspondant. Choisir la mauvaise procédure pour notre classe
              rend le marquage CE invalide — l’autorité de surveillance du
              marché peut retirer le produit de la vente.
            </p>
          ),
        },
        {
          heading: "Les quatre procédures",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="module_a">Module A</Term> — Contrôle interne de
                    la production.
                  </strong>{" "}
                  Auto-évaluation. Nous préparons la documentation technique,
                  déclarons la conformité et apposons le marquage CE. Aucun
                  organisme notifié. Réservé aux produits de classe par défaut.
                </li>
                <li>
                  <strong>
                    <Term id="module_b_c">Module B+C</Term> — Examen UE de
                    type + conformité au type.
                  </strong>{" "}
                  Un organisme notifié examine un échantillon représentatif et
                  délivre un certificat d’examen de type ; nous déclarons
                  ensuite la conformité de chaque unité produite à ce type.
                  Obligatoire pour Important Class II.
                </li>
                <li>
                  <strong>
                    <Term id="module_h">Module H</Term> — Assurance qualité
                    complète.
                  </strong>{" "}
                  Un organisme notifié audite l’intégralité de notre système
                  qualité (conception → fabrication → tests) et délivre une
                  approbation. Audits de surveillance annuels. Obligatoire pour
                  Critical ; disponible pour Important Class II.
                </li>
                <li>
                  <strong>Certification européenne de cybersécurité.</strong>{" "}
                  Conformité via un schéma de certification de cybersécurité
                  de l’UE au titre du règlement sur la cybersécurité (CSA).
                  En cours d’émergence.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Choisir la bonne procédure dans Seentrix",
          body: (
            <p>
              Lorsque nous exécutons l’assistant d’évaluation CRA sur un
              produit, Seentrix le classifie (par défaut / Important I /
              Important II / Critical) et propose une procédure appropriée.
              Nous pouvons passer outre, mais uniquement dans le sens d’un
              contrôle <em>plus</em> poussé, jamais moins — choisir le
              Module A pour un produit Critical constitue un manquement de
              conformité. La base de données{" "}
              <Term id="nando">NANDO</Term> est l’endroit où nous
              sélectionnons un organisme notifié pour le Module B+C ou H.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quelle procédure de conformité est obligatoire pour les produits Important Class II ?",
          options: [
            "Module A",
            "Module B+C ou Module H",
            "Certification européenne de cybersécurité uniquement",
            "N’importe laquelle des options ci-dessus",
          ],
          correctIndex: 1,
          explanation:
            "Les produits Important Class II ne peuvent pas utiliser le Module A (auto-évaluation). Ils doivent passer par un organisme notifié, soit via le Module B+C (examen de type), soit via le Module H (audit complet du système qualité).",
        },
        {
          question:
            "Quelle est la principale différence opérationnelle entre le Module B+C et le Module H ?",
          options: [
            "Le Module H ne nécessite pas d’organisme notifié",
            "Le Module B+C examine un échantillon ; le Module H audite l’intégralité du système qualité avec une surveillance annuelle",
            "Le Module H est moins coûteux",
            "Seul le Module B+C est autorisé pour le matériel",
          ],
          correctIndex: 1,
          explanation:
            "Le Module B+C est un examen de type d’un échantillon représentatif ; le Module H audite l’ensemble du système qualité (conception/fabrication/tests) avec des audits de surveillance annuels.",
        },
        {
          question:
            "Notre produit est classifié dans le niveau par défaut. Pouvons-nous procéder à une auto-évaluation selon le Module A ?",
          options: [
            "Non, un organisme notifié est toujours requis",
            "Oui — le Module A (contrôle interne) est disponible pour les produits de classe par défaut",
            "Uniquement si notre société mère est établie dans l’UE",
            "Uniquement avec une dérogation accordée par un organisme notifié",
          ],
          correctIndex: 1,
          explanation:
            "Le Module A est une auto-évaluation et est disponible pour les produits de classe par défaut. Aucun organisme notifié n’est impliqué. L’important est de tenir à jour une documentation technique précise.",
        },
        {
          question:
            "Nous avons classifié un produit comme Critical mais avons choisi le Module A. Quelle en est la conséquence ?",
          options: [
            "Le Module A est invalide pour les produits Critical ; le marquage CE est illicite",
            "Aucun problème — le Module A est une procédure de repli",
            "Nous recevons un avertissement de la surveillance du marché mais pouvons continuer à vendre",
            "Le Module H est appliqué automatiquement de manière rétroactive",
          ],
          correctIndex: 0,
          explanation:
            "Les produits Critical doivent passer par le Module H (ou une certification de cybersécurité UE équivalente). L’utilisation du Module A pour un produit Critical rend le marquage CE illicite et nous expose à des amendes CRA pouvant atteindre 15 M€ / 2,5 % du chiffre d’affaires mondial.",
        },
        {
          question:
            "Où consultons-nous l’identifiant à quatre chiffres et le domaine de compétence d’un organisme notifié ?",
          options: [
            "La plateforme de notification unique de l’ENISA",
            "La base de données NANDO (ec.europa.eu/growth/tools-databases/nando)",
            "Notre registre national du commerce",
            "La base de données EUDAMED",
          ],
          correctIndex: 1,
          explanation:
            "NANDO (New Approach Notified and Designated Organisations) est la base de données officielle de la Commission européenne répertoriant les organismes notifiés, avec leurs identifiants, adresses et domaines de compétence.",
        },
      ],
    },
    it: {
      title: "Procedure di valutazione della conformità (Modulo A, B+C, H)",
      summary:
        "Come dimostriamo che il nostro prodotto soddisfa l’Allegato I. La procedura dipende dalla classificazione CRA — autovalutazione, esame del tipo o audit completo del sistema qualità.",
      sections: [
        {
          heading: "Perché esistono quattro procedure",
          body: (
            <p>
              Il CRA suddivide i prodotti in livelli di rischio — standard,{" "}
              <em>Important Class I</em>, <em>Important Class II</em> e{" "}
              <em>Critical</em>. Un rischio più elevato implica un controllo
              di terze parti più rigoroso. La{" "}
              <Term id="conformity_assessment">procedura di valutazione della conformità</Term>{" "}
              è il modo in cui dimostriamo la conformità al livello
              corrispondente. Scegliere la procedura sbagliata per la nostra
              classe rende invalida la marcatura CE — l’autorità di vigilanza
              del mercato può ritirare il prodotto dagli scaffali.
            </p>
          ),
        },
        {
          heading: "Le quattro procedure",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="module_a">Modulo A</Term> — Controllo interno
                    della produzione.
                  </strong>{" "}
                  Autovalutazione. Predisponiamo la documentazione tecnica,
                  dichiariamo la conformità e apponiamo la marcatura CE.
                  Nessun organismo notificato. Disponibile solo per i prodotti
                  di classe standard.
                </li>
                <li>
                  <strong>
                    <Term id="module_b_c">Modulo B+C</Term> — Esame UE del
                    tipo + conformità al tipo.
                  </strong>{" "}
                  Un organismo notificato esamina un campione rappresentativo
                  e rilascia un certificato di esame del tipo; dichiariamo
                  quindi la conformità di ogni unità prodotta a quel tipo.
                  Obbligatorio per Important Class II.
                </li>
                <li>
                  <strong>
                    <Term id="module_h">Modulo H</Term> — Garanzia qualità
                    completa.
                  </strong>{" "}
                  Un organismo notificato sottopone a audit l’intero sistema
                  qualità (progettazione → produzione → collaudo) e rilascia
                  un’approvazione. Audit di sorveglianza annuali. Obbligatorio
                  per Critical; disponibile per Important Class II.
                </li>
                <li>
                  <strong>Certificazione europea di cibersicurezza.</strong>{" "}
                  Conformità tramite un sistema di certificazione della
                  cibersicurezza dell’UE ai sensi del regolamento sulla
                  cibersicurezza (CSA). Attualmente in fase di sviluppo.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Scegliere la procedura corretta in Seentrix",
          body: (
            <p>
              Quando eseguiamo la procedura guidata di valutazione CRA su un
              prodotto, Seentrix lo classifica (standard / Important I /
              Important II / Critical) e propone una procedura appropriata.
              Possiamo ignorare la proposta, ma solo nella direzione di un
              controllo <em>più</em> rigoroso, mai meno — scegliere il
              Modulo A per un prodotto Critical costituisce un inadempimento
              della conformità. Il database{" "}
              <Term id="nando">NANDO</Term> è il luogo in cui scegliamo
              un organismo notificato per il Modulo B+C o H.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quale procedura di conformità è obbligatoria per i prodotti Important Class II?",
          options: [
            "Modulo A",
            "Modulo B+C o Modulo H",
            "Solo Certificazione europea di cibersicurezza",
            "Una qualsiasi delle opzioni precedenti",
          ],
          correctIndex: 1,
          explanation:
            "I prodotti Important Class II non possono utilizzare il Modulo A (autovalutazione). Devono essere sottoposti a un organismo notificato, tramite il Modulo B+C (esame del tipo) o il Modulo H (audit completo del sistema qualità).",
        },
        {
          question:
            "Qual è la principale differenza operativa tra il Modulo B+C e il Modulo H?",
          options: [
            "Il Modulo H non richiede un organismo notificato",
            "Il Modulo B+C esamina un campione; il Modulo H sottopone a audit l’intero sistema qualità con sorveglianza annuale",
            "Il Modulo H è meno costoso",
            "Solo il Modulo B+C è consentito per l’hardware",
          ],
          correctIndex: 1,
          explanation:
            "Il Modulo B+C è un esame del tipo su un campione rappresentativo; il Modulo H sottopone a audit l’intero sistema qualità (progettazione/produzione/collaudo) con audit di sorveglianza annuali.",
        },
        {
          question:
            "Il nostro prodotto è classificato nel livello standard. Possiamo procedere all’autovalutazione ai sensi del Modulo A?",
          options: [
            "No, un organismo notificato è sempre richiesto",
            "Sì — il Modulo A (controllo interno) è disponibile per i prodotti di classe standard",
            "Solo se la nostra società madre ha sede nell’UE",
            "Solo con una deroga valida rilasciata da un organismo notificato",
          ],
          correctIndex: 1,
          explanation:
            "Il Modulo A è un’autovalutazione ed è disponibile per i prodotti di classe standard. Non è coinvolto alcun organismo notificato. È importante mantenere una documentazione tecnica accurata.",
        },
        {
          question:
            "Abbiamo classificato un prodotto come Critical ma abbiamo scelto il Modulo A. Qual è la conseguenza?",
          options: [
            "Il Modulo A non è valido per i prodotti Critical; la marcatura CE è illegittima",
            "Non ci sono problemi — il Modulo A è una procedura alternativa",
            "Riceviamo un avvertimento dalla vigilanza del mercato ma possiamo continuare a vendere",
            "Il Modulo H viene applicato automaticamente con effetto retroattivo",
          ],
          correctIndex: 0,
          explanation:
            "I prodotti Critical devono essere sottoposti al Modulo H (o a una certificazione di cibersicurezza UE equivalente). L’utilizzo del Modulo A per un prodotto Critical rende illegittima la marcatura CE ed espone a sanzioni CRA fino a 15 M€ / 2,5% del fatturato mondiale.",
        },
        {
          question:
            "Dove consultiamo il codice a quattro cifre e l’ambito di competenza di un organismo notificato?",
          options: [
            "La piattaforma di notifica unica dell’ENISA",
            "Il database NANDO (ec.europa.eu/growth/tools-databases/nando)",
            "Il nostro registro nazionale del commercio",
            "Il database EUDAMED",
          ],
          correctIndex: 1,
          explanation:
            "NANDO (New Approach Notified and Designated Organisations) è il database ufficiale della Commissione europea degli organismi notificati, con i loro codici, indirizzi e ambiti di competenza.",
        },
      ],
    },
  },
};

export default lesson;
