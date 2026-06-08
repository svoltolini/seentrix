/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "annex-ii-user-information",
  duration: "7 min",
  requiredForRoles: ["admin", "compliance_officer", "cto", "editor"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Annex II user information",
      summary:
        "The cybersecurity information and instructions that must accompany every product, and how Seentrix generates them.",
      sections: [
        {
          heading: "What must ship with the product",
          body: (
            <p>
              <Term id="annex_ii">Annex II</Term> lists the information and
              instructions that must accompany a product with digital elements:
              the manufacturer's name, address and single point of contact;
              where to find the coordinated-vulnerability-disclosure policy; the
              intended use and the known or foreseeable cybersecurity risks; the
              end-date of the <Term id="support_period">support period</Term>;
              where the EU <Term id="doc">Declaration of Conformity</Term> can be
              accessed; and instructions for secure installation, operation and
              decommissioning.
            </p>
          ),
        },
        {
          heading: "The buyer needs to find things",
          body: (
            <p>
              Annex II is buyer-facing: a purchaser should be able to learn, from
              the materials that ship with the product, how long it will receive
              security updates (Art 13(19) makes the support-period end-date a
              published artifact), how to report a vulnerability, what risks to
              be aware of, and where the declaration of conformity lives. Vague
              or missing user information is a common market-surveillance finding.
            </p>
          ),
        },
        {
          heading: "How Seentrix generates it",
          body: (
            <p>
              From the product's <strong>Identity & CE</strong> tab, "Generate
              PDF" produces the end-user cybersecurity information sheet covering
              Annex II items 1–9 — pulling the manufacturer block, support period,
              disclosure URL, intended use, the known-risks you record there, and
              (when published) the public simplified-DoC URL. Generate it in the
              market's language and ship it with the product.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "What is Annex II?",
          options: [
            "The list of essential security requirements",
            "The information and instructions to the user that must accompany the product",
            "The technical documentation kept for 10 years",
            "The incident-reporting deadlines",
          ],
          correctIndex: 1,
          explanation:
            "Annex II is the user-facing information and instructions that must accompany a product with digital elements.",
        },
        {
          question: "Which of these must Annex II information include?",
          options: [
            "The manufacturer's profit margin",
            "The support-period end-date and where to report vulnerabilities",
            "The source code",
            "A list of competitors",
          ],
          correctIndex: 1,
          explanation:
            "Annex II covers the support-period end-date, the disclosure/contact point, intended use, foreseeable risks, and where to access the DoC.",
        },
        {
          question:
            "Why does the support-period end-date appear in the user information?",
          options: [
            "It is optional marketing copy",
            "Art 13(19) makes it a buyer-facing artifact so purchasers know how long they get updates",
            "To start the incident clock",
            "It is only for the notified body",
          ],
          correctIndex: 1,
          explanation:
            "Art 13(19) requires the support-period end-date to be communicated to buyers; it ships in the end-user information.",
        },
        {
          question: "Does Annex II include known and foreseeable risks?",
          options: [
            "No, risks are confidential",
            "Yes — users must be told the risks and how to mitigate them",
            "Only for hardware",
            "Only after an incident",
          ],
          correctIndex: 1,
          explanation:
            "Annex II requires informing users of known/foreseeable cybersecurity risks and mitigations.",
        },
        {
          question: "How does Seentrix produce the Annex II information?",
          options: [
            "It emails it automatically to all customers",
            "A 'Generate PDF' action on the Identity & CE tab builds the end-user information sheet",
            "It is hand-written each time",
            "It is only available to notified bodies",
          ],
          correctIndex: 1,
          explanation:
            "The Identity & CE tab generates the end-user cybersecurity information sheet (Annex II items 1–9) as a localized PDF.",
        },
      ],
    },
    de: {
      title: "Endnutzerinformationen nach Anhang II",
      summary:
        "Die Cybersicherheitsinformationen und -anweisungen, die jedem Produkt beiliegen müssen, und wie Seentrix sie erzeugt.",
      sections: [
        {
          heading: "Was dem Produkt beiliegen muss",
          body: (
            <p>
              <Term id="annex_ii">Anhang II</Term> listet die Informationen und
              Anweisungen auf, die einem Produkt mit digitalen Elementen
              beiliegen müssen: Name, Anschrift und zentrale Anlaufstelle des
              Herstellers; wo die Richtlinie zur koordinierten Offenlegung von
              Schwachstellen zu finden ist; der Verwendungszweck und die bekannten
              oder vorhersehbaren Cybersicherheitsrisiken; das Enddatum des{" "}
              <Term id="support_period">Supportzeitraums</Term>; wo die
              EU-<Term id="doc">Konformitätserklärung</Term> abrufbar ist; sowie
              Anweisungen zur sicheren Installation, zum Betrieb und zur
              Außerbetriebnahme.
            </p>
          ),
        },
        {
          heading: "Der Käufer muss Dinge finden können",
          body: (
            <p>
              Anhang II ist käuferseitig: Ein Käufer sollte aus den dem Produkt
              beiliegenden Materialien erfahren, wie lange es Sicherheitsupdates
              erhält (Art. 13(19) macht das Enddatum des Supportzeitraums zu einer
              veröffentlichten Angabe), wie man eine Schwachstelle meldet, welche
              Risiken zu beachten sind und wo die Konformitätserklärung zu finden
              ist. Unklare oder fehlende Nutzerinformationen sind ein häufiger
              Befund der Marktüberwachung.
            </p>
          ),
        },
        {
          heading: "Wie Seentrix sie erzeugt",
          body: (
            <p>
              Auf dem Reiter <strong>Identität & CE</strong> des Produkts erzeugt
              „PDF erstellen“ das Endnutzer-Cybersicherheitsinformationsblatt zu
              den Anhang-II-Punkten 1–9 — mit Herstellerangaben, Supportzeitraum,
              Melde-URL, Verwendungszweck, den dort erfassten bekannten Risiken
              und (sofern veröffentlicht) der öffentlichen URL der vereinfachten
              Konformitätserklärung. Erstellen Sie es in der Sprache des Marktes
              und legen Sie es dem Produkt bei.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Was ist Anhang II?",
          options: [
            "Die Liste der grundlegenden Sicherheitsanforderungen",
            "Die Informationen und Anweisungen für den Nutzer, die dem Produkt beiliegen müssen",
            "Die 10 Jahre aufzubewahrende technische Dokumentation",
            "Die Fristen für die Vorfallmeldung",
          ],
          correctIndex: 1,
          explanation:
            "Anhang II umfasst die nutzerseitigen Informationen und Anweisungen, die einem Produkt mit digitalen Elementen beiliegen müssen.",
        },
        {
          question: "Welche Angabe muss in den Anhang-II-Informationen enthalten sein?",
          options: [
            "Die Gewinnmarge des Herstellers",
            "Das Enddatum des Supportzeitraums und wo Schwachstellen zu melden sind",
            "Der Quellcode",
            "Eine Liste der Wettbewerber",
          ],
          correctIndex: 1,
          explanation:
            "Anhang II umfasst u. a. das Enddatum des Supportzeitraums, die Melde-/Kontaktstelle, den Verwendungszweck, vorhersehbare Risiken und wo die Konformitätserklärung abrufbar ist.",
        },
        {
          question:
            "Warum erscheint das Enddatum des Supportzeitraums in den Nutzerinformationen?",
          options: [
            "Es ist optionaler Werbetext",
            "Art. 13(19) macht es zu einer käuferseitigen Angabe, damit Käufer wissen, wie lange sie Updates erhalten",
            "Um die Vorfalluhr zu starten",
            "Es ist nur für die notifizierte Stelle bestimmt",
          ],
          correctIndex: 1,
          explanation:
            "Art. 13(19) verlangt, dass das Enddatum des Supportzeitraums den Käufern mitgeteilt wird; es liegt den Endnutzerinformationen bei.",
        },
        {
          question:
            "Umfasst Anhang II bekannte und vorhersehbare Risiken?",
          options: [
            "Nein, Risiken sind vertraulich",
            "Ja — Nutzer müssen über die Risiken und deren Minderung informiert werden",
            "Nur bei Hardware",
            "Nur nach einem Vorfall",
          ],
          correctIndex: 1,
          explanation:
            "Anhang II verlangt, Nutzer über bekannte/vorhersehbare Cybersicherheitsrisiken und Gegenmaßnahmen zu informieren.",
        },
        {
          question: "Wie erzeugt Seentrix die Anhang-II-Informationen?",
          options: [
            "Es mailt sie automatisch an alle Kunden",
            "Eine Aktion „PDF erstellen“ auf dem Reiter Identität & CE erstellt das Endnutzer-Informationsblatt",
            "Es wird jedes Mal handgeschrieben",
            "Es ist nur für notifizierte Stellen verfügbar",
          ],
          correctIndex: 1,
          explanation:
            "Der Reiter Identität & CE erzeugt das Endnutzer-Cybersicherheitsinformationsblatt (Anhang-II-Punkte 1–9) als lokalisiertes PDF.",
        },
      ],
    },
    fr: {
      title: "Informations à l'utilisateur (annexe II)",
      summary:
        "Les informations et instructions de cybersécurité qui doivent accompagner chaque produit, et comment Seentrix les génère.",
      sections: [
        {
          heading: "Ce qui doit accompagner le produit",
          body: (
            <p>
              L'<Term id="annex_ii">annexe II</Term> énumère les informations et
              instructions qui doivent accompagner un produit comportant des
              éléments numériques : le nom, l'adresse et le point de contact
              unique du fabricant ; où trouver la politique de divulgation
              coordonnée des vulnérabilités ; l'utilisation prévue et les risques
              de cybersécurité connus ou prévisibles ; la date de fin de la{" "}
              <Term id="support_period">période de support</Term> ; où la{" "}
              <Term id="doc">déclaration de conformité</Term> UE peut être
              consultée ; et les instructions d'installation, d'exploitation et de
              mise hors service sécurisées.
            </p>
          ),
        },
        {
          heading: "L'acheteur doit pouvoir trouver les informations",
          body: (
            <p>
              L'annexe II est tournée vers l'acheteur : à partir des documents
              accompagnant le produit, un acheteur doit pouvoir savoir combien de
              temps il recevra des mises à jour (l'article 13(19) fait de la date
              de fin de support une donnée publiée), comment signaler une
              vulnérabilité, quels risques connaître et où se trouve la déclaration
              de conformité. Des informations vagues ou manquantes sont un constat
              fréquent de la surveillance du marché.
            </p>
          ),
        },
        {
          heading: "Comment Seentrix les génère",
          body: (
            <p>
              Depuis l'onglet <strong>Identité & CE</strong> du produit,
              « Générer le PDF » produit la fiche d'information de cybersécurité
              pour l'utilisateur final couvrant les points 1 à 9 de l'annexe II —
              en reprenant le bloc fabricant, la période de support, l'URL de
              signalement, l'utilisation prévue, les risques connus que vous y
              saisissez et (si publiée) l'URL publique de la DoC simplifiée.
              Générez-la dans la langue du marché et fournissez-la avec le produit.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Qu'est-ce que l'annexe II ?",
          options: [
            "La liste des exigences essentielles de sécurité",
            "Les informations et instructions à l'utilisateur qui doivent accompagner le produit",
            "La documentation technique conservée 10 ans",
            "Les délais de signalement des incidents",
          ],
          correctIndex: 1,
          explanation:
            "L'annexe II regroupe les informations et instructions destinées à l'utilisateur qui doivent accompagner un produit comportant des éléments numériques.",
        },
        {
          question: "Laquelle de ces informations l'annexe II doit-elle inclure ?",
          options: [
            "La marge bénéficiaire du fabricant",
            "La date de fin de support et où signaler les vulnérabilités",
            "Le code source",
            "Une liste de concurrents",
          ],
          correctIndex: 1,
          explanation:
            "L'annexe II couvre la date de fin de support, le point de signalement/contact, l'utilisation prévue, les risques prévisibles et où accéder à la DoC.",
        },
        {
          question:
            "Pourquoi la date de fin de support figure-t-elle dans les informations utilisateur ?",
          options: [
            "C'est un texte marketing facultatif",
            "L'article 13(19) en fait une donnée destinée à l'acheteur pour qu'il sache combien de temps il aura des mises à jour",
            "Pour démarrer l'horloge des incidents",
            "Elle est réservée à l'organisme notifié",
          ],
          correctIndex: 1,
          explanation:
            "L'article 13(19) exige que la date de fin de support soit communiquée aux acheteurs ; elle figure dans les informations à l'utilisateur final.",
        },
        {
          question: "L'annexe II inclut-elle les risques connus et prévisibles ?",
          options: [
            "Non, les risques sont confidentiels",
            "Oui — les utilisateurs doivent être informés des risques et de leur atténuation",
            "Uniquement pour le matériel",
            "Uniquement après un incident",
          ],
          correctIndex: 1,
          explanation:
            "L'annexe II exige d'informer les utilisateurs des risques de cybersécurité connus/prévisibles et de leur atténuation.",
        },
        {
          question: "Comment Seentrix produit-il les informations de l'annexe II ?",
          options: [
            "Il les envoie automatiquement par e-mail à tous les clients",
            "Une action « Générer le PDF » sur l'onglet Identité & CE construit la fiche d'information",
            "Elles sont rédigées à la main à chaque fois",
            "Elles ne sont accessibles qu'aux organismes notifiés",
          ],
          correctIndex: 1,
          explanation:
            "L'onglet Identité & CE génère la fiche d'information de cybersécurité pour l'utilisateur final (points 1 à 9 de l'annexe II) en PDF localisé.",
        },
      ],
    },
    it: {
      title: "Informazioni per l'utente (allegato II)",
      summary:
        "Le informazioni e istruzioni di cibersicurezza che devono accompagnare ogni prodotto e come Seentrix le genera.",
      sections: [
        {
          heading: "Cosa deve accompagnare il prodotto",
          body: (
            <p>
              L'<Term id="annex_ii">allegato II</Term> elenca le informazioni e
              istruzioni che devono accompagnare un prodotto con elementi
              digitali: nome, indirizzo e punto di contatto unico del fabbricante;
              dove trovare la politica di divulgazione coordinata delle
              vulnerabilità; la destinazione d'uso e i rischi di cibersicurezza
              noti o prevedibili; la data di fine del{" "}
              <Term id="support_period">periodo di supporto</Term>; dove è
              possibile consultare la{" "}
              <Term id="doc">dichiarazione di conformità</Term> UE; e le istruzioni
              per installazione, uso e dismissione sicuri.
            </p>
          ),
        },
        {
          heading: "L'acquirente deve poter trovare le informazioni",
          body: (
            <p>
              L'allegato II è orientato all'acquirente: dai materiali che
              accompagnano il prodotto, un acquirente dovrebbe poter sapere per
              quanto tempo riceverà aggiornamenti di sicurezza (l'articolo 13(19)
              rende la data di fine supporto un dato pubblicato), come segnalare
              una vulnerabilità, quali rischi conoscere e dove si trova la
              dichiarazione di conformità. Informazioni vaghe o mancanti sono un
              rilievo frequente della vigilanza del mercato.
            </p>
          ),
        },
        {
          heading: "Come Seentrix le genera",
          body: (
            <p>
              Dalla scheda <strong>Identità & CE</strong> del prodotto, «Genera
              PDF» produce la scheda informativa di cibersicurezza per l'utente
              finale che copre i punti 1–9 dell'allegato II — riprendendo il
              blocco fabbricante, il periodo di supporto, l'URL di segnalazione,
              la destinazione d'uso, i rischi noti che vi registri e (se
              pubblicato) l'URL pubblico della DoC semplificata. Generala nella
              lingua del mercato e forniscila con il prodotto.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Cos'è l'allegato II?",
          options: [
            "L'elenco dei requisiti essenziali di sicurezza",
            "Le informazioni e istruzioni per l'utente che devono accompagnare il prodotto",
            "La documentazione tecnica conservata per 10 anni",
            "Le scadenze di segnalazione degli incidenti",
          ],
          correctIndex: 1,
          explanation:
            "L'allegato II raccoglie le informazioni e istruzioni per l'utente che devono accompagnare un prodotto con elementi digitali.",
        },
        {
          question: "Quale di queste informazioni deve includere l'allegato II?",
          options: [
            "Il margine di profitto del fabbricante",
            "La data di fine supporto e dove segnalare le vulnerabilità",
            "Il codice sorgente",
            "Un elenco di concorrenti",
          ],
          correctIndex: 1,
          explanation:
            "L'allegato II copre la data di fine supporto, il punto di segnalazione/contatto, la destinazione d'uso, i rischi prevedibili e dove accedere alla DoC.",
        },
        {
          question:
            "Perché la data di fine supporto compare nelle informazioni all'utente?",
          options: [
            "È testo di marketing facoltativo",
            "L'articolo 13(19) la rende un dato per l'acquirente affinché sappia per quanto tempo riceverà aggiornamenti",
            "Per avviare l'orologio degli incidenti",
            "È riservata all'organismo notificato",
          ],
          correctIndex: 1,
          explanation:
            "L'articolo 13(19) richiede che la data di fine supporto sia comunicata agli acquirenti; compare nelle informazioni per l'utente finale.",
        },
        {
          question: "L'allegato II include i rischi noti e prevedibili?",
          options: [
            "No, i rischi sono riservati",
            "Sì — gli utenti devono essere informati dei rischi e della loro mitigazione",
            "Solo per l'hardware",
            "Solo dopo un incidente",
          ],
          correctIndex: 1,
          explanation:
            "L'allegato II richiede di informare gli utenti dei rischi di cibersicurezza noti/prevedibili e delle mitigazioni.",
        },
        {
          question: "Come produce Seentrix le informazioni dell'allegato II?",
          options: [
            "Le invia automaticamente via e-mail a tutti i clienti",
            "Un'azione «Genera PDF» nella scheda Identità & CE crea la scheda informativa",
            "Sono scritte a mano ogni volta",
            "Sono disponibili solo agli organismi notificati",
          ],
          correctIndex: 1,
          explanation:
            "La scheda Identità & CE genera la scheda informativa di cibersicurezza per l'utente finale (punti 1–9 dell'allegato II) in PDF localizzato.",
        },
      ],
    },
  },
};

export default lesson;
