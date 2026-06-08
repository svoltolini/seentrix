/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "end-of-support-corrective-action",
  duration: "7 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["support-period-obligations"],
  i18n: {
    en: {
      title: "End-of-support & corrective action",
      summary:
        "Telling users when support ends (Art 13(19)), the corrective-action/recall duty (Art 13(21)), and keeping security tests running (Annex I II.3).",
      sections: [
        {
          heading: "Tell users when support ends",
          body: (
            <p>
              The <Term id="support_period">support period</Term> has an end-date,
              and Article 13(19) makes it a user-facing fact: buyers must be able
              to learn when security updates will stop. Plan and record an
              end-of-support notice so the message that goes out is consistent and
              timely, not a surprise.
            </p>
          ),
        },
        {
          heading: "Corrective action & recall (Article 13(21))",
          body: (
            <p>
              If a product presents a <strong>significant cybersecurity risk</strong>,
              the manufacturer must take{" "}
              <Term id="corrective_action">corrective action</Term> — bring it into
              conformity, withdraw it, or recall it — and keep a documented
              procedure for doing so. Authorities can require it; having the
              procedure ready (who decides, how customers are reached, how the fix
              is distributed) turns a crisis into a process.
            </p>
          ),
        },
        {
          heading: "Keep testing while supported",
          body: (
            <p>
              Security testing isn't a launch gate you pass once. Annex I Part
              II(3) expects <strong>regular, effective</strong> tests and reviews —
              penetration tests, fuzzing, code analysis — across the support
              period. In Seentrix you schedule them and log results on the
              Lifecycle & Supply Chain tab, alongside the end-of-support notice and
              the corrective-action procedure.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "What must users be told about support (Art 13(19))?",
          options: [
            "The product's price history",
            "The end-date of the support period",
            "The source code",
            "The manufacturer's revenue",
          ],
          correctIndex: 1,
          explanation:
            "Article 13(19) makes the support-period end-date a user-facing fact.",
        },
        {
          question: "What is a corrective action (Art 13(21))?",
          options: [
            "A marketing promotion",
            "Bringing a risky product into conformity, withdrawing it, or recalling it",
            "A notified-body audit",
            "An incident early-warning",
          ],
          correctIndex: 1,
          explanation:
            "Corrective action means restoring conformity, withdrawing, or recalling a product that presents a significant cybersecurity risk.",
        },
        {
          question: "When must corrective action be taken?",
          options: [
            "Every quarter regardless",
            "When the product presents a significant cybersecurity risk",
            "Only after support ends",
            "Never — it's optional",
          ],
          correctIndex: 1,
          explanation:
            "It is triggered when a product presents a significant cybersecurity risk (and authorities may require it).",
        },
        {
          question: "Do security tests stop after launch?",
          options: [
            "Yes, one test is enough",
            "No — regular, effective tests continue across the support period (Annex I II.3)",
            "Only if a customer complains",
            "Only for hardware",
          ],
          correctIndex: 1,
          explanation:
            "Annex I Part II(3) expects regular, effective security testing throughout the support period.",
        },
        {
          question: "Where does Seentrix record these?",
          options: [
            "On the Diagrams tab",
            "On the Lifecycle & Supply Chain tab (EoS notice, corrective-action procedure, test schedule)",
            "Only in email",
            "Nowhere",
          ],
          correctIndex: 1,
          explanation:
            "The end-of-support notice, corrective-action procedure and recurring test schedule live on the Lifecycle & Supply Chain tab.",
        },
      ],
    },
    de: {
      title: "Support-Ende & Korrekturmaßnahmen",
      summary:
        "Nutzer über das Support-Ende informieren (Art. 13(19)), die Pflicht zu Korrekturmaßnahmen/Rückruf (Art. 13(21)) und Sicherheitstests fortführen (Anhang I II.3).",
      sections: [
        {
          heading: "Nutzer über das Support-Ende informieren",
          body: (
            <p>
              Der <Term id="support_period">Supportzeitraum</Term> hat ein
              Enddatum, und Artikel 13(19) macht es zu einer nutzerseitigen
              Tatsache: Käufer müssen erfahren können, wann Sicherheitsupdates
              enden. Planen und erfassen Sie eine Support-Ende-Mitteilung, damit die
              Nachricht konsistent und rechtzeitig kommt — keine Überraschung.
            </p>
          ),
        },
        {
          heading: "Korrekturmaßnahmen & Rückruf (Artikel 13(21))",
          body: (
            <p>
              Stellt ein Produkt ein{" "}
              <strong>erhebliches Cybersicherheitsrisiko</strong> dar, muss der
              Hersteller <Term id="corrective_action">Korrekturmaßnahmen</Term>{" "}
              ergreifen — es in Konformität bringen, zurückziehen oder zurückrufen —
              und ein dokumentiertes Verfahren dafür führen. Behörden können es
              verlangen; ein bereitstehendes Verfahren (wer entscheidet, wie Kunden
              erreicht werden, wie die Behebung verteilt wird) macht aus einer Krise
              einen Prozess.
            </p>
          ),
        },
        {
          heading: "Während des Supports weiter testen",
          body: (
            <p>
              Sicherheitstests sind kein einmaliges Start-Gate. Anhang I Teil II(3)
              erwartet <strong>regelmäßige, wirksame</strong> Tests und Prüfungen —
              Penetrationstests, Fuzzing, Code-Analyse — über den Supportzeitraum.
              In Seentrix planen Sie sie und protokollieren Ergebnisse im Reiter
              Lebenszyklus & Lieferkette, neben der Support-Ende-Mitteilung und dem
              Korrekturmaßnahmen-Verfahren.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Was müssen Nutzer zum Support erfahren (Art. 13(19))?",
          options: [
            "Die Preishistorie des Produkts",
            "Das Enddatum des Supportzeitraums",
            "Den Quellcode",
            "Den Umsatz des Herstellers",
          ],
          correctIndex: 1,
          explanation:
            "Artikel 13(19) macht das Enddatum des Supportzeitraums zu einer nutzerseitigen Tatsache.",
        },
        {
          question: "Was ist eine Korrekturmaßnahme (Art. 13(21))?",
          options: [
            "Eine Marketingaktion",
            "Ein riskantes Produkt in Konformität bringen, zurückziehen oder zurückrufen",
            "Ein Audit der notifizierten Stelle",
            "Eine Vorfall-Frühwarnung",
          ],
          correctIndex: 1,
          explanation:
            "Korrekturmaßnahme bedeutet, ein Produkt mit erheblichem Cybersicherheitsrisiko in Konformität zu bringen, zurückzuziehen oder zurückzurufen.",
        },
        {
          question: "Wann müssen Korrekturmaßnahmen ergriffen werden?",
          options: [
            "Jedes Quartal unabhängig davon",
            "Wenn das Produkt ein erhebliches Cybersicherheitsrisiko darstellt",
            "Erst nach Support-Ende",
            "Nie — es ist optional",
          ],
          correctIndex: 1,
          explanation:
            "Sie wird ausgelöst, wenn ein Produkt ein erhebliches Cybersicherheitsrisiko darstellt (Behörden können sie verlangen).",
        },
        {
          question: "Enden Sicherheitstests nach dem Start?",
          options: [
            "Ja, ein Test reicht",
            "Nein — regelmäßige, wirksame Tests laufen über den Supportzeitraum (Anhang I II.3)",
            "Nur bei Kundenbeschwerde",
            "Nur bei Hardware",
          ],
          correctIndex: 1,
          explanation:
            "Anhang I Teil II(3) erwartet regelmäßige, wirksame Sicherheitstests über den gesamten Supportzeitraum.",
        },
        {
          question: "Wo erfasst Seentrix dies?",
          options: [
            "Im Diagramm-Reiter",
            "Im Reiter Lebenszyklus & Lieferkette (Support-Ende-Mitteilung, Korrekturverfahren, Testplan)",
            "Nur per E-Mail",
            "Nirgendwo",
          ],
          correctIndex: 1,
          explanation:
            "Support-Ende-Mitteilung, Korrekturmaßnahmen-Verfahren und wiederkehrender Testplan stehen im Reiter Lebenszyklus & Lieferkette.",
        },
      ],
    },
    fr: {
      title: "Fin de support & action corrective",
      summary:
        "Informer les utilisateurs de la fin du support (art. 13(19)), l'obligation d'action corrective/de rappel (art. 13(21)) et le maintien des tests de sécurité (annexe I II.3).",
      sections: [
        {
          heading: "Informer les utilisateurs de la fin du support",
          body: (
            <p>
              La <Term id="support_period">période de support</Term> a une date de
              fin, et l'article 13(19) en fait un fait destiné à l'utilisateur : les
              acheteurs doivent pouvoir savoir quand les mises à jour de sécurité
              s'arrêteront. Planifiez et enregistrez un avis de fin de support afin
              que le message diffusé soit cohérent et opportun, sans surprise.
            </p>
          ),
        },
        {
          heading: "Action corrective & rappel (article 13(21))",
          body: (
            <p>
              Si un produit présente un{" "}
              <strong>risque de cybersécurité important</strong>, le fabricant doit
              prendre une{" "}
              <Term id="corrective_action">action corrective</Term> — le mettre en
              conformité, le retirer ou le rappeler — et conserver une procédure
              documentée à cet effet. Les autorités peuvent l'exiger ; disposer de
              la procédure (qui décide, comment joindre les clients, comment
              distribuer le correctif) transforme une crise en processus.
            </p>
          ),
        },
        {
          heading: "Continuer à tester pendant le support",
          body: (
            <p>
              Les tests de sécurité ne sont pas un portail de lancement passé une
              seule fois. L'annexe I partie II(3) attend des tests et revues{" "}
              <strong>réguliers et efficaces</strong> — tests d'intrusion, fuzzing,
              analyse de code — sur toute la période de support. Dans Seentrix, vous
              les programmez et consignez les résultats dans l'onglet Cycle de vie &
              chaîne d'approvisionnement, aux côtés de l'avis de fin de support et de
              la procédure d'action corrective.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Que doit-on dire aux utilisateurs sur le support (art. 13(19)) ?",
          options: [
            "L'historique des prix du produit",
            "La date de fin de la période de support",
            "Le code source",
            "Le chiffre d'affaires du fabricant",
          ],
          correctIndex: 1,
          explanation:
            "L'article 13(19) fait de la date de fin de support un fait destiné à l'utilisateur.",
        },
        {
          question: "Qu'est-ce qu'une action corrective (art. 13(21)) ?",
          options: [
            "Une promotion marketing",
            "Mettre en conformité, retirer ou rappeler un produit à risque",
            "Un audit d'organisme notifié",
            "Une alerte précoce d'incident",
          ],
          correctIndex: 1,
          explanation:
            "L'action corrective consiste à rétablir la conformité, retirer ou rappeler un produit présentant un risque de cybersécurité important.",
        },
        {
          question: "Quand l'action corrective doit-elle être prise ?",
          options: [
            "Chaque trimestre quoi qu'il arrive",
            "Lorsque le produit présente un risque de cybersécurité important",
            "Seulement après la fin du support",
            "Jamais — c'est facultatif",
          ],
          correctIndex: 1,
          explanation:
            "Elle est déclenchée lorsqu'un produit présente un risque de cybersécurité important (et les autorités peuvent l'exiger).",
        },
        {
          question: "Les tests de sécurité s'arrêtent-ils après le lancement ?",
          options: [
            "Oui, un test suffit",
            "Non — des tests réguliers et efficaces se poursuivent pendant la période de support (annexe I II.3)",
            "Seulement si un client se plaint",
            "Seulement pour le matériel",
          ],
          correctIndex: 1,
          explanation:
            "L'annexe I partie II(3) attend des tests de sécurité réguliers et efficaces tout au long de la période de support.",
        },
        {
          question: "Où Seentrix enregistre-t-il cela ?",
          options: [
            "Dans l'onglet Schémas",
            "Dans l'onglet Cycle de vie & chaîne d'approvisionnement (avis de fin de support, procédure corrective, calendrier des tests)",
            "Uniquement par e-mail",
            "Nulle part",
          ],
          correctIndex: 1,
          explanation:
            "L'avis de fin de support, la procédure d'action corrective et le calendrier des tests figurent dans l'onglet Cycle de vie & chaîne d'approvisionnement.",
        },
      ],
    },
    it: {
      title: "Fine supporto & azione correttiva",
      summary:
        "Informare gli utenti della fine del supporto (art. 13(19)), l'obbligo di azione correttiva/richiamo (art. 13(21)) e il mantenimento dei test di sicurezza (allegato I II.3).",
      sections: [
        {
          heading: "Informare gli utenti della fine del supporto",
          body: (
            <p>
              Il <Term id="support_period">periodo di supporto</Term> ha una data
              di fine, e l'articolo 13(19) ne fa un fatto destinato all'utente: gli
              acquirenti devono poter sapere quando termineranno gli aggiornamenti
              di sicurezza. Pianifica e registra un avviso di fine supporto affinché
              il messaggio diffuso sia coerente e tempestivo, non una sorpresa.
            </p>
          ),
        },
        {
          heading: "Azione correttiva & richiamo (articolo 13(21))",
          body: (
            <p>
              Se un prodotto presenta un{" "}
              <strong>rischio di cibersicurezza significativo</strong>, il
              fabbricante deve adottare un'{" "}
              <Term id="corrective_action">azione correttiva</Term> — riportarlo a
              conformità, ritirarlo o richiamarlo — e conservare una procedura
              documentata per farlo. Le autorità possono richiederlo; avere la
              procedura pronta (chi decide, come raggiungere i clienti, come
              distribuire la correzione) trasforma una crisi in un processo.
            </p>
          ),
        },
        {
          heading: "Continuare a testare durante il supporto",
          body: (
            <p>
              I test di sicurezza non sono un cancello di lancio superato una sola
              volta. L'allegato I parte II(3) si aspetta test e revisioni{" "}
              <strong>regolari ed efficaci</strong> — penetration test, fuzzing,
              analisi del codice — per tutto il periodo di supporto. In Seentrix li
              pianifichi e registri i risultati nella scheda Ciclo di vita & catena
              di fornitura, accanto all'avviso di fine supporto e alla procedura di
              azione correttiva.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Cosa va comunicato agli utenti sul supporto (art. 13(19))?",
          options: [
            "Lo storico dei prezzi del prodotto",
            "La data di fine del periodo di supporto",
            "Il codice sorgente",
            "Il fatturato del fabbricante",
          ],
          correctIndex: 1,
          explanation:
            "L'articolo 13(19) rende la data di fine supporto un fatto destinato all'utente.",
        },
        {
          question: "Cos'è un'azione correttiva (art. 13(21))?",
          options: [
            "Una promozione di marketing",
            "Riportare a conformità, ritirare o richiamare un prodotto a rischio",
            "Un audit di organismo notificato",
            "Un'allerta precoce di incidente",
          ],
          correctIndex: 1,
          explanation:
            "L'azione correttiva significa ripristinare la conformità, ritirare o richiamare un prodotto che presenta un rischio di cibersicurezza significativo.",
        },
        {
          question: "Quando va adottata l'azione correttiva?",
          options: [
            "Ogni trimestre comunque",
            "Quando il prodotto presenta un rischio di cibersicurezza significativo",
            "Solo dopo la fine del supporto",
            "Mai — è facoltativa",
          ],
          correctIndex: 1,
          explanation:
            "Si attiva quando un prodotto presenta un rischio di cibersicurezza significativo (e le autorità possono richiederla).",
        },
        {
          question: "I test di sicurezza si fermano dopo il lancio?",
          options: [
            "Sì, un test basta",
            "No — test regolari ed efficaci proseguono per tutto il periodo di supporto (allegato I II.3)",
            "Solo se un cliente si lamenta",
            "Solo per l'hardware",
          ],
          correctIndex: 1,
          explanation:
            "L'allegato I parte II(3) si aspetta test di sicurezza regolari ed efficaci per tutto il periodo di supporto.",
        },
        {
          question: "Dove registra Seentrix tutto questo?",
          options: [
            "Nella scheda Diagrammi",
            "Nella scheda Ciclo di vita & catena di fornitura (avviso di fine supporto, procedura correttiva, calendario test)",
            "Solo via e-mail",
            "Da nessuna parte",
          ],
          correctIndex: 1,
          explanation:
            "L'avviso di fine supporto, la procedura di azione correttiva e il calendario dei test ricorrenti sono nella scheda Ciclo di vita & catena di fornitura.",
        },
      ],
    },
  },
};

export default lesson;
