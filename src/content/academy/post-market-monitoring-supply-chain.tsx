/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "post-market-monitoring-supply-chain",
  duration: "8 min",
  requiredForRoles: ["admin", "compliance_officer", "cto", "editor"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Post-market monitoring & supply chain",
      summary:
        "The ongoing monitoring duty (Art 13(7)), the 10-year supply-chain register (Art 23), and per-fix public advisories (Annex I II.4).",
      sections: [
        {
          heading: "Monitoring doesn't stop at launch",
          body: (
            <p>
              <Term id="post_market_monitoring">Post-market monitoring</Term>{" "}
              (Article 13(7)) requires the manufacturer to keep watching the
              product and the third-party components it integrates for new
              vulnerabilities throughout the support period, and to keep a
              documented record of the cybersecurity aspects identified over time.
              That running log is exactly what auditors ask to see.
            </p>
          ),
        },
        {
          heading: "The supply chain (Article 23)",
          body: (
            <p>
              Article 23 puts due-diligence and traceability duties on the{" "}
              <Term id="supply_chain">supply chain</Term>: you keep records that
              let a product be traced <em>upstream</em> to your suppliers and{" "}
              <em>downstream</em> to the operators you supplied — names and
              addresses — and retain them for <strong>ten years</strong>. Incomplete
              supplier/operator records are a frequent gap at audit.
            </p>
          ),
        },
        {
          heading: "Advisories close the loop",
          body: (
            <p>
              When you fix a vulnerability, Annex I Part II(4) expects you to{" "}
              <strong>publicly disclose</strong> information about it — an{" "}
              <Term id="advisory">advisory</Term> naming the affected and fixed
              versions and, where useful, mitigation guidance. In Seentrix the
              monitoring log, the supply-chain register and per-fix advisories all
              live on the Lifecycle & Supply Chain tab and export as one register.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "How long must supply-chain records be kept (Art 23)?",
          options: ["1 year", "5 years", "10 years", "Forever"],
          correctIndex: 2,
          explanation:
            "Article 23 traceability records are retained for ten years.",
        },
        {
          question: "What is post-market monitoring?",
          options: [
            "A one-off launch checklist",
            "Ongoing watching of the product + its components for vulnerabilities, with a documented record",
            "A marketing campaign",
            "The 24-hour incident report",
          ],
          correctIndex: 1,
          explanation:
            "Article 13(7) requires continuous monitoring and a documented record of cybersecurity aspects over the support period.",
        },
        {
          question: "Upstream vs downstream in the supply chain?",
          options: [
            "Upstream = customers; downstream = suppliers",
            "Upstream = your suppliers; downstream = operators you supplied",
            "They mean the same thing",
            "Only downstream matters",
          ],
          correctIndex: 1,
          explanation:
            "Upstream points to your suppliers; downstream points to the operators you supplied — both must be traceable.",
        },
        {
          question: "What is a per-fix advisory (Annex I II.4)?",
          options: [
            "An internal note never shared",
            "A public disclosure about a remediated vulnerability (affected + fixed versions)",
            "A price list",
            "A notified-body certificate",
          ],
          correctIndex: 1,
          explanation:
            "Annex I Part II(4) expects public disclosure of information about fixed vulnerabilities.",
        },
        {
          question: "Where does Seentrix keep these lifecycle records?",
          options: [
            "On the SBOM tab",
            "On the Lifecycle & Supply Chain tab, exportable as one register",
            "Only in the Copilot",
            "Nowhere — they're external",
          ],
          correctIndex: 1,
          explanation:
            "The monitoring log, supply-chain register and advisories are on the Lifecycle & Supply Chain tab and export as a single register PDF.",
        },
      ],
    },
    de: {
      title: "Nachmarktüberwachung & Lieferkette",
      summary:
        "Die laufende Überwachungspflicht (Art. 13(7)), das 10-jährige Lieferkettenregister (Art. 23) und Advisories pro Behebung (Anhang I II.4).",
      sections: [
        {
          heading: "Überwachung endet nicht beim Start",
          body: (
            <p>
              Die <Term id="post_market_monitoring">Nachmarktüberwachung</Term>{" "}
              (Artikel 13(7)) verlangt vom Hersteller, das Produkt und die
              integrierten Drittkomponenten während des gesamten Supportzeitraums
              auf neue Schwachstellen zu beobachten und einen dokumentierten
              Nachweis der im Lauf der Zeit festgestellten Cybersicherheitsaspekte
              zu führen. Genau dieses laufende Protokoll wollen Auditoren sehen.
            </p>
          ),
        },
        {
          heading: "Die Lieferkette (Artikel 23)",
          body: (
            <p>
              Artikel 23 erlegt der <Term id="supply_chain">Lieferkette</Term>{" "}
              Sorgfalts- und Rückverfolgbarkeitspflichten auf: Sie führen
              Aufzeichnungen, die ein Produkt <em>vorgelagert</em> zu Ihren
              Zulieferern und <em>nachgelagert</em> zu den belieferten Akteuren
              rückverfolgbar machen — Namen und Anschriften — und bewahren sie{" "}
              <strong>zehn Jahre</strong> auf. Unvollständige Zulieferer-/
              Akteursangaben sind eine häufige Lücke beim Audit.
            </p>
          ),
        },
        {
          heading: "Advisories schließen den Kreis",
          body: (
            <p>
              Wenn Sie eine Schwachstelle beheben, erwartet Anhang I Teil II(4),
              dass Sie Informationen darüber <strong>öffentlich offenlegen</strong>{" "}
              — ein <Term id="advisory">Advisory</Term> mit den betroffenen und
              behobenen Versionen und, wo hilfreich, Minderungshinweisen. In
              Seentrix stehen Überwachungsprotokoll, Lieferkettenregister und
              Advisories im Reiter Lebenszyklus & Lieferkette und werden als ein
              Register exportiert.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Wie lange müssen Lieferkettenaufzeichnungen aufbewahrt werden (Art. 23)?",
          options: ["1 Jahr", "5 Jahre", "10 Jahre", "Für immer"],
          correctIndex: 2,
          explanation:
            "Die Rückverfolgbarkeitsaufzeichnungen nach Artikel 23 werden zehn Jahre aufbewahrt.",
        },
        {
          question: "Was ist Nachmarktüberwachung?",
          options: [
            "Eine einmalige Startcheckliste",
            "Laufende Beobachtung von Produkt + Komponenten auf Schwachstellen mit dokumentiertem Nachweis",
            "Eine Marketingkampagne",
            "Der 24-Stunden-Vorfallbericht",
          ],
          correctIndex: 1,
          explanation:
            "Artikel 13(7) verlangt fortlaufende Überwachung und einen dokumentierten Nachweis der Cybersicherheitsaspekte über den Supportzeitraum.",
        },
        {
          question: "Vorgelagert vs. nachgelagert in der Lieferkette?",
          options: [
            "Vorgelagert = Kunden; nachgelagert = Zulieferer",
            "Vorgelagert = Ihre Zulieferer; nachgelagert = belieferte Akteure",
            "Sie bedeuten dasselbe",
            "Nur nachgelagert zählt",
          ],
          correctIndex: 1,
          explanation:
            "Vorgelagert verweist auf Ihre Zulieferer; nachgelagert auf die belieferten Akteure — beide müssen rückverfolgbar sein.",
        },
        {
          question: "Was ist ein Advisory pro Behebung (Anhang I II.4)?",
          options: [
            "Eine interne, nie geteilte Notiz",
            "Eine öffentliche Offenlegung zu einer behobenen Schwachstelle (betroffene + behobene Versionen)",
            "Eine Preisliste",
            "Ein Zertifikat einer notifizierten Stelle",
          ],
          correctIndex: 1,
          explanation:
            "Anhang I Teil II(4) erwartet die öffentliche Offenlegung von Informationen zu behobenen Schwachstellen.",
        },
        {
          question: "Wo bewahrt Seentrix diese Lebenszyklus-Aufzeichnungen auf?",
          options: [
            "Im SBOM-Reiter",
            "Im Reiter Lebenszyklus & Lieferkette, exportierbar als ein Register",
            "Nur im Copilot",
            "Nirgendwo — sie sind extern",
          ],
          correctIndex: 1,
          explanation:
            "Überwachungsprotokoll, Lieferkettenregister und Advisories stehen im Reiter Lebenszyklus & Lieferkette und werden als ein Register-PDF exportiert.",
        },
      ],
    },
    fr: {
      title: "Surveillance post-commercialisation & chaîne d'approvisionnement",
      summary:
        "L'obligation de surveillance continue (art. 13(7)), le registre de la chaîne d'approvisionnement sur 10 ans (art. 23) et les avis par correctif (annexe I II.4).",
      sections: [
        {
          heading: "La surveillance ne s'arrête pas au lancement",
          body: (
            <p>
              La{" "}
              <Term id="post_market_monitoring">surveillance post-commercialisation</Term>{" "}
              (article 13(7)) impose au fabricant de continuer à surveiller le
              produit et les composants tiers qu'il intègre pour détecter de
              nouvelles vulnérabilités pendant toute la période de support, et de
              tenir un registre documenté des aspects de cybersécurité identifiés
              au fil du temps. C'est précisément ce journal que les auditeurs
              demandent à voir.
            </p>
          ),
        },
        {
          heading: "La chaîne d'approvisionnement (article 23)",
          body: (
            <p>
              L'article 23 impose des obligations de diligence et de traçabilité à
              la <Term id="supply_chain">chaîne d'approvisionnement</Term> : vous
              tenez des registres permettant de tracer un produit <em>en amont</em>{" "}
              vers vos fournisseurs et <em>en aval</em> vers les opérateurs que
              vous avez approvisionnés — noms et adresses — et les conservez{" "}
              <strong>dix ans</strong>. Des registres fournisseurs/opérateurs
              incomplets sont une lacune fréquente lors des audits.
            </p>
          ),
        },
        {
          heading: "Les avis bouclent la boucle",
          body: (
            <p>
              Lorsque vous corrigez une vulnérabilité, l'annexe I partie II(4)
              attend que vous <strong>divulguiez publiquement</strong> des
              informations à son sujet — un <Term id="advisory">avis</Term>{" "}
              nommant les versions affectées et corrigées et, le cas échéant, des
              conseils d'atténuation. Dans Seentrix, le journal de surveillance, le
              registre de la chaîne d'approvisionnement et les avis par correctif
              figurent dans l'onglet Cycle de vie & chaîne d'approvisionnement et
              s'exportent en un seul registre.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Combien de temps conserver les registres de la chaîne d'approvisionnement (art. 23) ?",
          options: ["1 an", "5 ans", "10 ans", "Pour toujours"],
          correctIndex: 2,
          explanation:
            "Les registres de traçabilité de l'article 23 sont conservés dix ans.",
        },
        {
          question: "Qu'est-ce que la surveillance post-commercialisation ?",
          options: [
            "Une liste de contrôle unique au lancement",
            "La surveillance continue du produit + de ses composants pour les vulnérabilités, avec un registre documenté",
            "Une campagne marketing",
            "Le rapport d'incident à 24 heures",
          ],
          correctIndex: 1,
          explanation:
            "L'article 13(7) impose une surveillance continue et un registre documenté des aspects de cybersécurité pendant la période de support.",
        },
        {
          question: "Amont vs aval dans la chaîne d'approvisionnement ?",
          options: [
            "Amont = clients ; aval = fournisseurs",
            "Amont = vos fournisseurs ; aval = opérateurs que vous avez approvisionnés",
            "C'est la même chose",
            "Seul l'aval compte",
          ],
          correctIndex: 1,
          explanation:
            "L'amont désigne vos fournisseurs ; l'aval, les opérateurs approvisionnés — les deux doivent être traçables.",
        },
        {
          question: "Qu'est-ce qu'un avis par correctif (annexe I II.4) ?",
          options: [
            "Une note interne jamais partagée",
            "Une divulgation publique sur une vulnérabilité corrigée (versions affectées + corrigées)",
            "Une liste de prix",
            "Un certificat d'organisme notifié",
          ],
          correctIndex: 1,
          explanation:
            "L'annexe I partie II(4) attend la divulgation publique d'informations sur les vulnérabilités corrigées.",
        },
        {
          question: "Où Seentrix conserve-t-il ces registres de cycle de vie ?",
          options: [
            "Dans l'onglet SBOM",
            "Dans l'onglet Cycle de vie & chaîne d'approvisionnement, exportable en un registre",
            "Uniquement dans le Copilot",
            "Nulle part — ils sont externes",
          ],
          correctIndex: 1,
          explanation:
            "Le journal de surveillance, le registre de la chaîne d'approvisionnement et les avis figurent dans l'onglet Cycle de vie & chaîne d'approvisionnement et s'exportent en un seul PDF.",
        },
      ],
    },
    it: {
      title: "Monitoraggio post-commercializzazione & catena di fornitura",
      summary:
        "L'obbligo di monitoraggio continuo (art. 13(7)), il registro della catena di fornitura decennale (art. 23) e gli advisory per correzione (allegato I II.4).",
      sections: [
        {
          heading: "Il monitoraggio non si ferma al lancio",
          body: (
            <p>
              Il{" "}
              <Term id="post_market_monitoring">monitoraggio post-commercializzazione</Term>{" "}
              (articolo 13(7)) richiede al fabbricante di continuare a sorvegliare
              il prodotto e i componenti di terzi che integra per individuare nuove
              vulnerabilità per tutto il periodo di supporto, e di tenere un
              registro documentato degli aspetti di cibersicurezza individuati nel
              tempo. È proprio questo registro che gli auditor chiedono di vedere.
            </p>
          ),
        },
        {
          heading: "La catena di fornitura (articolo 23)",
          body: (
            <p>
              L'articolo 23 impone obblighi di diligenza e tracciabilità alla{" "}
              <Term id="supply_chain">catena di fornitura</Term>: tieni registri
              che permettano di tracciare un prodotto <em>a monte</em> verso i tuoi
              fornitori e <em>a valle</em> verso gli operatori che hai rifornito —
              nomi e indirizzi — e li conservi per <strong>dieci anni</strong>.
              Registri fornitori/operatori incompleti sono una lacuna frequente
              negli audit.
            </p>
          ),
        },
        {
          heading: "Gli advisory chiudono il cerchio",
          body: (
            <p>
              Quando correggi una vulnerabilità, l'allegato I parte II(4) si aspetta
              che tu <strong>divulghi pubblicamente</strong> informazioni in merito
              — un <Term id="advisory">advisory</Term> che nomina le versioni
              interessate e corrette e, dove utile, indicazioni di mitigazione. In
              Seentrix il log di monitoraggio, il registro della catena di
              fornitura e gli advisory per correzione si trovano nella scheda Ciclo
              di vita & catena di fornitura e si esportano in un unico registro.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Per quanto tempo vanno conservati i registri della catena di fornitura (art. 23)?",
          options: ["1 anno", "5 anni", "10 anni", "Per sempre"],
          correctIndex: 2,
          explanation:
            "I registri di tracciabilità dell'articolo 23 sono conservati per dieci anni.",
        },
        {
          question: "Cos'è il monitoraggio post-commercializzazione?",
          options: [
            "Una checklist una tantum al lancio",
            "La sorveglianza continua del prodotto + dei componenti per le vulnerabilità, con un registro documentato",
            "Una campagna di marketing",
            "Il rapporto d'incidente a 24 ore",
          ],
          correctIndex: 1,
          explanation:
            "L'articolo 13(7) richiede sorveglianza continua e un registro documentato degli aspetti di cibersicurezza durante il periodo di supporto.",
        },
        {
          question: "A monte vs a valle nella catena di fornitura?",
          options: [
            "A monte = clienti; a valle = fornitori",
            "A monte = i tuoi fornitori; a valle = operatori che hai rifornito",
            "Significano la stessa cosa",
            "Conta solo a valle",
          ],
          correctIndex: 1,
          explanation:
            "A monte indica i tuoi fornitori; a valle gli operatori riforniti — entrambi devono essere tracciabili.",
        },
        {
          question: "Cos'è un advisory per correzione (allegato I II.4)?",
          options: [
            "Una nota interna mai condivisa",
            "Una divulgazione pubblica su una vulnerabilità risolta (versioni interessate + corrette)",
            "Un listino prezzi",
            "Un certificato di organismo notificato",
          ],
          correctIndex: 1,
          explanation:
            "L'allegato I parte II(4) si aspetta la divulgazione pubblica di informazioni sulle vulnerabilità risolte.",
        },
        {
          question: "Dove conserva Seentrix questi registri del ciclo di vita?",
          options: [
            "Nella scheda SBOM",
            "Nella scheda Ciclo di vita & catena di fornitura, esportabile come un unico registro",
            "Solo nel Copilot",
            "Da nessuna parte — sono esterni",
          ],
          correctIndex: 1,
          explanation:
            "Il log di monitoraggio, il registro della catena di fornitura e gli advisory sono nella scheda Ciclo di vita & catena di fornitura e si esportano in un unico PDF.",
        },
      ],
    },
  },
};

export default lesson;
