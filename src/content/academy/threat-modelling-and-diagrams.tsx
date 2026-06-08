/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "threat-modelling-and-diagrams",
  duration: "8 min",
  requiredForRoles: ["admin", "compliance_officer", "cto", "editor"],
  prerequisites: ["annex-i-essential-requirements"],
  i18n: {
    en: {
      title: "Threat modelling, diagrams and Annex VII evidence",
      summary:
        "Why architecture and data-flow diagrams are a CRA artifact, how to threat-model on them, and what counts as test-report evidence in the technical file.",
      sections: [
        {
          heading: "Diagrams are a technical-file requirement, not a nicety",
          body: (
            <p>
              <Term id="annex_vii">Annex VII</Term> 2(a) requires the technical
              file to describe the product's design and development —
              explicitly including the system architecture and a{" "}
              <Term id="data_flow_diagram">data-flow diagram</Term>. Point 1.3
              expects photos or illustrations of hardware. These are not
              decorative: a market-surveillance authority reads them to
              understand what they're assessing. In Seentrix you draw them on
              the product's <strong>Diagrams &amp; Evidence</strong> tab; each
              saved diagram is versioned and exported as a PNG that the Phase-3
              technical-file assembler can embed.
            </p>
          ),
        },
        {
          heading: "Threat modelling turns a diagram into security reasoning",
          body: (
            <p>
              A diagram becomes a <Term id="threat_model">threat model</Term>{" "}
              when you mark the <em>trust boundaries</em> data crosses, list the
              assets each component protects, and reason — entry point by entry
              point — about what could go wrong and how you mitigate it (STRIDE
              is a common checklist: spoofing, tampering, repudiation,
              information disclosure, denial of service, elevation of
              privilege). This is the secure-by-design practice behind{" "}
              <Term id="annex_i">Annex I</Term> Part I and a credible Article 13
              risk assessment. The mitigations you identify feed directly into
              the risk-assessment mapping you'll build in Phase 2.
            </p>
          ),
        },
        {
          heading: "Evidence: test reports and retention",
          body: (
            <p>
              Annex VII point 6 requires <strong>reports of the security tests
              carried out</strong> — penetration tests, fuzzing runs, static
              code analysis, third-party assessments. Upload each as evidence,
              give it a category, and tag it with the Annex VII point it
              supports so the technical-file assembler slots it correctly.
              Together with your <Term id="sbom">SBOM</Term>, these turn claims
              into proof. Remember the file must be retained for{" "}
              <strong>10 years</strong> (or the support period, if longer), so
              treat every upload as part of the durable audit record.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Which Annex VII point requires architecture and data-flow diagrams?",
          options: ["Point 1.3", "Point 2(a)", "Point 6", "Annex V"],
          correctIndex: 1,
          explanation:
            "Annex VII 2(a) covers the description of design and development, including the system architecture and data-flow diagrams. Point 1.3 is hardware photos; point 6 is test reports.",
        },
        {
          question: "What makes a diagram a threat model?",
          options: [
            "Exporting it as a high-resolution PNG",
            "Marking trust boundaries and reasoning about threats and mitigations",
            "Having it reviewed by a notified body",
            "Storing it for 10 years",
          ],
          correctIndex: 1,
          explanation:
            "A threat model adds security reasoning to a diagram: trust boundaries, assets, the threats at each entry point, and how each is mitigated (e.g. via STRIDE).",
        },
        {
          question: "What does Annex VII point 6 cover?",
          options: [
            "The Declaration of Conformity",
            "The intended purpose",
            "Reports of the security tests carried out",
            "Hardware photos",
          ],
          correctIndex: 2,
          explanation:
            "Point 6 is the test-report evidence — penetration tests, fuzzing, code analysis and third-party assessments demonstrating the product was tested.",
        },
        {
          question:
            "Threat modelling most directly supports which other CRA artifact?",
          options: [
            "The CE marking",
            "The Article 13 cybersecurity risk assessment",
            "The simplified Declaration of Conformity",
            "The importer's contact details",
          ],
          correctIndex: 1,
          explanation:
            "The mitigations identified during threat modelling feed the risk assessment's mapping of Annex I requirements to how they're implemented.",
        },
        {
          question: "How long must the technical file be retained?",
          options: [
            "2 years",
            "5 years",
            "10 years, or the support period if longer",
            "Only until the product is withdrawn",
          ],
          correctIndex: 2,
          explanation:
            "Article 13(13) requires the technical documentation and Declaration of Conformity to be kept for 10 years after the product is placed on the market, or the support period if that is longer.",
        },
      ],
    },
    de: {
      title: "Bedrohungsmodellierung, Diagramme und Nachweise nach Anhang VII",
      summary:
        "Warum Architektur- und Datenflussdiagramme ein CRA-Artefakt sind, wie man darauf eine Bedrohungsmodellierung durchführt und was als Testbericht-Nachweis in der technischen Dokumentation gilt.",
      sections: [
        {
          heading: "Diagramme sind eine Pflicht der technischen Dokumentation",
          body: (
            <p>
              <Term id="annex_vii">Anhang VII</Term> 2(a) verlangt, dass die
              technische Dokumentation das Design und die Entwicklung des
              Produkts beschreibt – ausdrücklich einschließlich der
              Systemarchitektur und eines{" "}
              <Term id="data_flow_diagram">Datenflussdiagramms</Term>. Punkt 1.3
              erwartet Fotos oder Abbildungen der Hardware. Diese sind nicht
              dekorativ: Eine Marktüberwachungsbehörde liest sie, um zu
              verstehen, was sie bewertet. In Seentrix zeichnen Sie sie im Tab{" "}
              <strong>Diagramme &amp; Nachweise</strong> des Produkts; jedes
              gespeicherte Diagramm wird versioniert und als PNG exportiert.
            </p>
          ),
        },
        {
          heading:
            "Bedrohungsmodellierung macht aus einem Diagramm Sicherheitsanalyse",
          body: (
            <p>
              Ein Diagramm wird zu einem{" "}
              <Term id="threat_model">Bedrohungsmodell</Term>, wenn Sie die{" "}
              <em>Vertrauensgrenzen</em> markieren, die Daten überschreiten, die
              von jeder Komponente geschützten Werte auflisten und – Eintrittspunkt
              für Eintrittspunkt – überlegen, was schiefgehen könnte und wie Sie
              es abmildern (STRIDE ist eine gängige Checkliste). Dies ist die
              Security-by-Design-Praxis hinter <Term id="annex_i">Anhang I</Term>{" "}
              Teil I und einer glaubwürdigen Risikobewertung nach Artikel 13.
            </p>
          ),
        },
        {
          heading: "Nachweise: Testberichte und Aufbewahrung",
          body: (
            <p>
              Anhang VII Punkt 6 verlangt <strong>Berichte über die
              durchgeführten Sicherheitstests</strong> – Penetrationstests,
              Fuzzing, statische Code-Analyse, Bewertungen durch Dritte. Laden
              Sie jeden als Nachweis hoch, geben Sie ihm eine Kategorie und
              kennzeichnen Sie ihn mit dem Anhang-VII-Punkt, den er belegt.
              Zusammen mit Ihrer <Term id="sbom">SBOM</Term> werden so Behauptungen
              zu Belegen. Die Dokumentation muss <strong>10 Jahre</strong> (oder
              den Supportzeitraum, falls länger) aufbewahrt werden.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Welcher Punkt von Anhang VII verlangt Architektur- und Datenflussdiagramme?",
          options: ["Punkt 1.3", "Punkt 2(a)", "Punkt 6", "Anhang V"],
          correctIndex: 1,
          explanation:
            "Anhang VII 2(a) umfasst die Beschreibung von Design und Entwicklung, einschließlich Systemarchitektur und Datenflussdiagrammen. Punkt 1.3 sind Hardware-Fotos; Punkt 6 sind Testberichte.",
        },
        {
          question: "Was macht aus einem Diagramm ein Bedrohungsmodell?",
          options: [
            "Es als hochauflösendes PNG zu exportieren",
            "Vertrauensgrenzen markieren und Bedrohungen und Gegenmaßnahmen analysieren",
            "Es von einer benannten Stelle prüfen lassen",
            "Es 10 Jahre aufbewahren",
          ],
          correctIndex: 1,
          explanation:
            "Ein Bedrohungsmodell fügt einem Diagramm Sicherheitsanalyse hinzu: Vertrauensgrenzen, Werte, die Bedrohungen an jedem Eintrittspunkt und ihre Abmilderung (z. B. via STRIDE).",
        },
        {
          question: "Was deckt Anhang VII Punkt 6 ab?",
          options: [
            "Die Konformitätserklärung",
            "Den Verwendungszweck",
            "Berichte über die durchgeführten Sicherheitstests",
            "Hardware-Fotos",
          ],
          correctIndex: 2,
          explanation:
            "Punkt 6 ist der Testbericht-Nachweis – Penetrationstests, Fuzzing, Code-Analyse und Bewertungen durch Dritte, die belegen, dass das Produkt getestet wurde.",
        },
        {
          question:
            "Welches andere CRA-Artefakt unterstützt die Bedrohungsmodellierung am unmittelbarsten?",
          options: [
            "Die CE-Kennzeichnung",
            "Die Cybersicherheits-Risikobewertung nach Artikel 13",
            "Die vereinfachte Konformitätserklärung",
            "Die Kontaktdaten des Einführers",
          ],
          correctIndex: 1,
          explanation:
            "Die bei der Bedrohungsmodellierung ermittelten Gegenmaßnahmen fließen in die Zuordnung der Anhang-I-Anforderungen in der Risikobewertung ein.",
        },
        {
          question: "Wie lange muss die technische Dokumentation aufbewahrt werden?",
          options: [
            "2 Jahre",
            "5 Jahre",
            "10 Jahre, oder den Supportzeitraum, falls länger",
            "Nur bis das Produkt zurückgezogen wird",
          ],
          correctIndex: 2,
          explanation:
            "Artikel 13(13) verlangt, die technische Dokumentation und die Konformitätserklärung 10 Jahre nach Inverkehrbringen aufzubewahren, oder den Supportzeitraum, falls dieser länger ist.",
        },
      ],
    },
    fr: {
      title: "Modélisation des menaces, schémas et preuves de l'annexe VII",
      summary:
        "Pourquoi les schémas d'architecture et de flux de données sont un artefact du CRA, comment y modéliser les menaces et ce qui constitue une preuve de rapport de test dans le dossier technique.",
      sections: [
        {
          heading: "Les schémas sont une exigence du dossier technique",
          body: (
            <p>
              L'<Term id="annex_vii">annexe VII</Term> 2(a) exige que le dossier
              technique décrive la conception et le développement du produit —
              y compris explicitement l'architecture du système et un{" "}
              <Term id="data_flow_diagram">diagramme de flux de données</Term>.
              Le point 1.3 attend des photos ou illustrations du matériel. Ils
              ne sont pas décoratifs : une autorité de surveillance du marché les
              lit pour comprendre ce qu'elle évalue. Dans Seentrix, vous les
              dessinez dans l'onglet <strong>Schémas &amp; preuves</strong> du
              produit ; chaque schéma enregistré est versionné et exporté en PNG.
            </p>
          ),
        },
        {
          heading:
            "La modélisation des menaces transforme un schéma en raisonnement de sécurité",
          body: (
            <p>
              Un schéma devient un{" "}
              <Term id="threat_model">modèle de menaces</Term> lorsque vous
              marquez les <em>frontières de confiance</em> que les données
              franchissent, listez les actifs que protège chaque composant et
              raisonnez — point d'entrée par point d'entrée — sur ce qui pourrait
              mal tourner et comment l'atténuer (STRIDE est une liste courante).
              C'est la pratique de sécurité dès la conception qui sous-tend
              l'<Term id="annex_i">annexe I</Term> partie I et une évaluation des
              risques crédible au titre de l'article 13.
            </p>
          ),
        },
        {
          heading: "Preuves : rapports de test et conservation",
          body: (
            <p>
              Le point 6 de l'annexe VII exige des <strong>rapports sur les
              tests de sécurité réalisés</strong> — tests d'intrusion, fuzzing,
              analyse statique du code, évaluations par des tiers. Téléversez
              chacun comme preuve, donnez-lui une catégorie et associez-le au
              point de l'annexe VII qu'il étaye. Avec votre{" "}
              <Term id="sbom">SBOM</Term>, ils transforment les affirmations en
              preuves. Le dossier doit être conservé <strong>10 ans</strong> (ou
              la période de support, si elle est plus longue).
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quel point de l'annexe VII exige des schémas d'architecture et de flux de données ?",
          options: ["Point 1.3", "Point 2(a)", "Point 6", "Annexe V"],
          correctIndex: 1,
          explanation:
            "L'annexe VII 2(a) couvre la description de la conception et du développement, y compris l'architecture système et les diagrammes de flux de données. Le point 1.3 concerne les photos du matériel ; le point 6, les rapports de test.",
        },
        {
          question: "Qu'est-ce qui fait d'un schéma un modèle de menaces ?",
          options: [
            "L'exporter en PNG haute résolution",
            "Marquer les frontières de confiance et raisonner sur les menaces et atténuations",
            "Le faire examiner par un organisme notifié",
            "Le conserver 10 ans",
          ],
          correctIndex: 1,
          explanation:
            "Un modèle de menaces ajoute un raisonnement de sécurité à un schéma : frontières de confiance, actifs, menaces à chaque point d'entrée et atténuation de chacune (p. ex. via STRIDE).",
        },
        {
          question: "Que couvre le point 6 de l'annexe VII ?",
          options: [
            "La déclaration de conformité",
            "La destination prévue",
            "Les rapports sur les tests de sécurité réalisés",
            "Les photos du matériel",
          ],
          correctIndex: 2,
          explanation:
            "Le point 6 est la preuve par rapport de test — tests d'intrusion, fuzzing, analyse de code et évaluations par des tiers démontrant que le produit a été testé.",
        },
        {
          question:
            "La modélisation des menaces soutient le plus directement quel autre artefact du CRA ?",
          options: [
            "Le marquage CE",
            "L'évaluation des risques de cybersécurité de l'article 13",
            "La déclaration de conformité simplifiée",
            "Les coordonnées de l'importateur",
          ],
          correctIndex: 1,
          explanation:
            "Les atténuations identifiées lors de la modélisation des menaces alimentent la mise en correspondance des exigences de l'annexe I dans l'évaluation des risques.",
        },
        {
          question: "Combien de temps le dossier technique doit-il être conservé ?",
          options: [
            "2 ans",
            "5 ans",
            "10 ans, ou la période de support si elle est plus longue",
            "Seulement jusqu'au retrait du produit",
          ],
          correctIndex: 2,
          explanation:
            "L'article 13(13) exige de conserver la documentation technique et la déclaration de conformité pendant 10 ans après la mise sur le marché, ou la période de support si elle est plus longue.",
        },
      ],
    },
    it: {
      title: "Modellazione delle minacce, diagrammi e prove dell'allegato VII",
      summary:
        "Perché i diagrammi di architettura e flusso di dati sono un artefatto del CRA, come modellare le minacce su di essi e cosa vale come prova del rapporto di test nel fascicolo tecnico.",
      sections: [
        {
          heading: "I diagrammi sono un requisito del fascicolo tecnico",
          body: (
            <p>
              L'<Term id="annex_vii">allegato VII</Term> 2(a) richiede che il
              fascicolo tecnico descriva la progettazione e lo sviluppo del
              prodotto — inclusi esplicitamente l'architettura del sistema e un{" "}
              <Term id="data_flow_diagram">diagramma di flusso di dati</Term>. Il
              punto 1.3 richiede foto o illustrazioni dell'hardware. Non sono
              decorativi: un'autorità di vigilanza del mercato li legge per
              capire cosa sta valutando. In Seentrix li disegni nella scheda{" "}
              <strong>Diagrammi e prove</strong> del prodotto; ogni diagramma
              salvato è versionato ed esportato come PNG.
            </p>
          ),
        },
        {
          heading:
            "La modellazione delle minacce trasforma un diagramma in ragionamento di sicurezza",
          body: (
            <p>
              Un diagramma diventa un{" "}
              <Term id="threat_model">modello di minaccia</Term> quando segni i{" "}
              <em>confini di fiducia</em> che i dati attraversano, elenchi gli
              asset che ogni componente protegge e ragioni — punto di ingresso
              per punto di ingresso — su cosa potrebbe andare storto e come
              mitigarlo (STRIDE è una checklist comune). È la pratica di
              security-by-design dietro l'<Term id="annex_i">allegato I</Term>{" "}
              Parte I e una valutazione dei rischi credibile ai sensi
              dell'articolo 13.
            </p>
          ),
        },
        {
          heading: "Prove: rapporti di test e conservazione",
          body: (
            <p>
              Il punto 6 dell'allegato VII richiede <strong>rapporti sui test di
              sicurezza effettuati</strong> — test di penetrazione, fuzzing,
              analisi statica del codice, valutazioni di terze parti. Carica
              ciascuno come prova, assegnagli una categoria e associalo al punto
              dell'allegato VII che supporta. Insieme alla tua{" "}
              <Term id="sbom">SBOM</Term>, trasformano le affermazioni in prove.
              Il fascicolo deve essere conservato per <strong>10 anni</strong> (o
              il periodo di supporto, se più lungo).
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quale punto dell'allegato VII richiede diagrammi di architettura e flusso di dati?",
          options: ["Punto 1.3", "Punto 2(a)", "Punto 6", "Allegato V"],
          correctIndex: 1,
          explanation:
            "L'allegato VII 2(a) copre la descrizione di progettazione e sviluppo, inclusi architettura di sistema e diagrammi di flusso di dati. Il punto 1.3 riguarda le foto hardware; il punto 6 i rapporti di test.",
        },
        {
          question: "Cosa rende un diagramma un modello di minaccia?",
          options: [
            "Esportarlo come PNG ad alta risoluzione",
            "Segnare i confini di fiducia e ragionare su minacce e mitigazioni",
            "Farlo esaminare da un organismo notificato",
            "Conservarlo per 10 anni",
          ],
          correctIndex: 1,
          explanation:
            "Un modello di minaccia aggiunge ragionamento di sicurezza a un diagramma: confini di fiducia, asset, le minacce a ogni punto di ingresso e la loro mitigazione (es. tramite STRIDE).",
        },
        {
          question: "Cosa copre il punto 6 dell'allegato VII?",
          options: [
            "La dichiarazione di conformità",
            "La destinazione d'uso",
            "I rapporti sui test di sicurezza effettuati",
            "Le foto dell'hardware",
          ],
          correctIndex: 2,
          explanation:
            "Il punto 6 è la prova dei rapporti di test — test di penetrazione, fuzzing, analisi del codice e valutazioni di terze parti che dimostrano che il prodotto è stato testato.",
        },
        {
          question:
            "La modellazione delle minacce supporta più direttamente quale altro artefatto del CRA?",
          options: [
            "La marcatura CE",
            "La valutazione dei rischi di cibersicurezza dell'articolo 13",
            "La dichiarazione di conformità semplificata",
            "I recapiti dell'importatore",
          ],
          correctIndex: 1,
          explanation:
            "Le mitigazioni individuate durante la modellazione delle minacce alimentano la mappatura dei requisiti dell'allegato I nella valutazione dei rischi.",
        },
        {
          question: "Per quanto tempo deve essere conservato il fascicolo tecnico?",
          options: [
            "2 anni",
            "5 anni",
            "10 anni, o il periodo di supporto se più lungo",
            "Solo finché il prodotto non viene ritirato",
          ],
          correctIndex: 2,
          explanation:
            "L'articolo 13(13) richiede di conservare la documentazione tecnica e la dichiarazione di conformità per 10 anni dopo l'immissione sul mercato, o il periodo di supporto se più lungo.",
        },
      ],
    },
  },
};

export default lesson;
