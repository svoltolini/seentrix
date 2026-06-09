/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "cra-readiness-overview",
  duration: "6 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "CRA readiness: bringing it all together",
      summary:
        "How the CRA Readiness view consolidates every obligation — pre-market, ongoing, retention and lifecycle — into one score, and how to read it to decide what to do next.",
      sections: [
        {
          heading: "One score over many obligations",
          body: (
            <>
              <p>
                Each Seentrix tab covers one slice of the{" "}
                <Term id="cra">CRA</Term>: the Annex I checklist, the SBOM, the
                risk assessment, the diagrams, the{" "}
                <Term id="annex_vii">technical file</Term>, the DoC, CE &amp;
                identity, monitoring, advisories, and so on. The Readiness view
                is the bird's-eye layer on top — it reads all of those signals
                and grades each obligation complete, partial, missing or
                not-applicable.
              </p>
              <p className="mt-3">
                The obligations are grouped into four buckets that mirror the
                CRA's own shape: <strong>pre-market</strong> (what must be true
                before you ship), <strong>ongoing</strong> (post-market
                monitoring, advisories, incident readiness),{" "}
                <strong>retention</strong> (documentation kept available), and{" "}
                <strong>lifecycle</strong> (support period, end of support).
              </p>
            </>
          ),
        },
        {
          heading: "How the percentage is built",
          body: (
            <>
              <p>
                The readiness percentage isn't a vibe — it's arithmetic. Each
                applicable item counts: a complete item scores 1, a partial item
                scores 0.5, a missing item scores 0. Not-applicable items drop
                out of the denominator entirely, so marking something N/A
                doesn't inflate or deflate your score unfairly.
              </p>
              <p className="mt-3">
                That means a product sitting at, say, 60% isn't 60% of the way
                through a vague checklist — it's earned 60% of the credit
                available across its applicable obligations. The same engine
                powers the per-product page, the dashboard roll-up, and the
                Copilot's <code>getReadiness</code> answer, so the number is
                consistent wherever you see it.
              </p>
            </>
          ),
        },
        {
          heading: "Reading it to decide what's next",
          body: (
            <>
              <p>
                Readiness is a worklist, not a trophy. Every partial or missing
                item carries a "Fix →" link straight to the tab that closes it,
                so the fastest way to raise the number is to start at the top of
                the missing items and work down. Pre-market gaps usually block
                shipping; <Term id="post_market_monitoring">ongoing</Term> gaps
                accumulate risk over the support period.
              </p>
              <p className="mt-3">
                Treat 100% as "every obligation has evidence behind it", not as
                "done forever" — the ongoing and lifecycle items decay as time
                passes and new vulnerabilities surface. A product that was 100%
                at launch needs its monitoring log and advisories kept current to
                stay there. Readiness is the dashboard you glance at to know
                whether that's happening.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "What does the CRA Readiness view do?",
          options: [
            "It replaces the technical file",
            "It consolidates the signals from every tab into one graded, grouped score",
            "It files your Article 14 reports",
            "It generates your SBOM",
          ],
          correctIndex: 1,
          explanation:
            "Readiness is the bird's-eye layer: it reads the signals from every tab and grades each obligation complete / partial / missing / not-applicable, grouped into pre-market, ongoing, retention and lifecycle.",
        },
        {
          question: "How is a partial item scored in the readiness percentage?",
          options: ["1", "0.5", "0", "It's excluded"],
          correctIndex: 1,
          explanation:
            "Complete scores 1, partial scores 0.5, missing scores 0. Not-applicable items are excluded from the denominator entirely.",
        },
        {
          question: "What happens to a not-applicable item in the score?",
          options: [
            "It counts as missing",
            "It counts as complete",
            "It drops out of the denominator",
            "It halves the total",
          ],
          correctIndex: 2,
          explanation:
            "Not-applicable items are removed from the denominator, so marking something N/A neither inflates nor deflates the percentage — only applicable obligations count.",
        },
        {
          question: "Why does each partial or missing item carry a 'Fix →' link?",
          options: [
            "To delete the item",
            "To take you straight to the tab that closes that gap",
            "To export a PDF",
            "To email the notified body",
          ],
          correctIndex: 1,
          explanation:
            "Readiness is a worklist: the Fix → link deep-links to the exact tab that resolves the gap, so you can work down the missing items efficiently.",
        },
        {
          question: "Why is 100% readiness not 'done forever'?",
          options: [
            "Because the score is random",
            "Because ongoing and lifecycle obligations decay as time passes and new vulnerabilities surface",
            "Because the CRA expires after a year",
            "Because the percentage resets every month",
          ],
          correctIndex: 1,
          explanation:
            "Ongoing and lifecycle items (monitoring, advisories, support period) need to stay current. A product at 100% at launch must keep its monitoring log and advisories up to date to remain there.",
        },
      ],
    },
    de: {
      title: "CRA-Reife: alles zusammenführen",
      summary:
        "Wie die CRA-Reife-Ansicht jede Pflicht — vor dem Inverkehrbringen, laufend, Aufbewahrung und Lebenszyklus — in einen Wert zusammenführt und wie man ihn liest, um den nächsten Schritt zu entscheiden.",
      sections: [
        {
          heading: "Ein Wert über viele Pflichten",
          body: (
            <>
              <p>
                Jeder Seentrix-Tab deckt einen Ausschnitt des{" "}
                <Term id="cra">CRA</Term> ab: die Anhang-I-Checkliste, die SBOM,
                die Risikobewertung, die Diagramme, die{" "}
                <Term id="annex_vii">technische Dokumentation</Term>, die DoC, CE
                &amp; Identität, das Monitoring, die Advisories und so weiter. Die
                Reife-Ansicht ist die Vogelperspektive darüber — sie liest all
                diese Signale und bewertet jede Pflicht als vollständig,
                teilweise, fehlend oder nicht zutreffend.
              </p>
              <p className="mt-3">
                Die Pflichten sind in vier Gruppen geordnet, die die Form des CRA
                widerspiegeln: <strong>vor dem Inverkehrbringen</strong> (was vor
                dem Versand zutreffen muss), <strong>laufend</strong>
                (Marktüberwachung, Advisories, Vorfallbereitschaft),{" "}
                <strong>Aufbewahrung</strong> (verfügbar gehaltene Dokumentation)
                und <strong>Lebenszyklus</strong> (Support-Zeitraum,
                Support-Ende).
              </p>
            </>
          ),
        },
        {
          heading: "Wie der Prozentsatz entsteht",
          body: (
            <>
              <p>
                Der Reife-Prozentsatz ist kein Bauchgefühl — er ist Arithmetik.
                Jedes zutreffende Element zählt: ein vollständiges Element ergibt
                1, ein teilweises 0,5, ein fehlendes 0. Nicht zutreffende Elemente
                fallen ganz aus dem Nenner, sodass ein N/V weder unfair aufbläht
                noch abwertet.
              </p>
              <p className="mt-3">
                Ein Produkt bei etwa 60 % ist also nicht zu 60 % durch eine vage
                Checkliste — es hat 60 % der über seine zutreffenden Pflichten
                verfügbaren Punkte erreicht. Dieselbe Engine treibt die
                Produktseite, den Dashboard-Überblick und die{" "}
                <code>getReadiness</code>-Antwort des Copiloten an, sodass die Zahl
                überall konsistent ist.
              </p>
            </>
          ),
        },
        {
          heading: "Lesen, um den nächsten Schritt zu entscheiden",
          body: (
            <>
              <p>
                Reife ist eine Arbeitsliste, keine Trophäe. Jedes teilweise oder
                fehlende Element trägt einen „Beheben →“-Link direkt zum Tab, der
                es schließt, sodass der schnellste Weg, die Zahl zu erhöhen, oben
                bei den fehlenden Elementen beginnt. Lücken vor dem
                Inverkehrbringen blockieren meist den Versand;{" "}
                <Term id="post_market_monitoring">laufende</Term> Lücken häufen
                über den Support-Zeitraum Risiko an.
              </p>
              <p className="mt-3">
                Behandeln Sie 100 % als „jede Pflicht hat Nachweise“, nicht als
                „für immer erledigt“ — die laufenden und Lebenszyklus-Elemente
                verfallen mit der Zeit und mit neuen Schwachstellen. Ein Produkt,
                das beim Start bei 100 % war, braucht ein aktuelles
                Monitoring-Protokoll und aktuelle Advisories, um dort zu bleiben.
                Die Reife ist das Dashboard, auf das Sie blicken, um zu wissen, ob
                das geschieht.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "Was macht die CRA-Reife-Ansicht?",
          options: [
            "Sie ersetzt die technische Dokumentation",
            "Sie führt die Signale aus jedem Tab in einen bewerteten, gruppierten Wert zusammen",
            "Sie reicht Ihre Artikel-14-Berichte ein",
            "Sie erzeugt Ihre SBOM",
          ],
          correctIndex: 1,
          explanation:
            "Die Reife ist die Vogelperspektive: Sie liest die Signale aus jedem Tab und bewertet jede Pflicht als vollständig / teilweise / fehlend / nicht zutreffend, gruppiert in vor dem Inverkehrbringen, laufend, Aufbewahrung und Lebenszyklus.",
        },
        {
          question: "Wie wird ein teilweises Element im Prozentsatz bewertet?",
          options: ["1", "0,5", "0", "Es wird ausgeschlossen"],
          correctIndex: 1,
          explanation:
            "Vollständig ergibt 1, teilweise 0,5, fehlend 0. Nicht zutreffende Elemente werden ganz aus dem Nenner ausgeschlossen.",
        },
        {
          question: "Was passiert mit einem nicht zutreffenden Element im Wert?",
          options: [
            "Es zählt als fehlend",
            "Es zählt als vollständig",
            "Es fällt aus dem Nenner",
            "Es halbiert das Gesamtergebnis",
          ],
          correctIndex: 2,
          explanation:
            "Nicht zutreffende Elemente werden aus dem Nenner entfernt, sodass ein N/V den Prozentsatz weder aufbläht noch abwertet — nur zutreffende Pflichten zählen.",
        },
        {
          question:
            "Warum trägt jedes teilweise oder fehlende Element einen „Beheben →“-Link?",
          options: [
            "Um das Element zu löschen",
            "Um Sie direkt zum Tab zu bringen, der die Lücke schließt",
            "Um ein PDF zu exportieren",
            "Um die notifizierte Stelle anzumailen",
          ],
          correctIndex: 1,
          explanation:
            "Reife ist eine Arbeitsliste: Der Beheben →-Link verlinkt direkt zum genauen Tab, der die Lücke löst, sodass Sie die fehlenden Elemente effizient abarbeiten.",
        },
        {
          question: "Warum sind 100 % Reife nicht „für immer erledigt“?",
          options: [
            "Weil der Wert zufällig ist",
            "Weil laufende und Lebenszyklus-Pflichten mit der Zeit und neuen Schwachstellen verfallen",
            "Weil der CRA nach einem Jahr abläuft",
            "Weil der Prozentsatz jeden Monat zurückgesetzt wird",
          ],
          correctIndex: 1,
          explanation:
            "Laufende und Lebenszyklus-Elemente (Monitoring, Advisories, Support-Zeitraum) müssen aktuell bleiben. Ein Produkt bei 100 % beim Start muss Monitoring-Protokoll und Advisories aktuell halten, um dort zu bleiben.",
        },
      ],
    },
    fr: {
      title: "Maturité CRA : tout réunir",
      summary:
        "Comment la vue Maturité CRA consolide chaque obligation — avant commercialisation, continue, conservation et cycle de vie — en un seul score, et comment la lire pour décider de la suite.",
      sections: [
        {
          heading: "Un score sur de nombreuses obligations",
          body: (
            <>
              <p>
                Chaque onglet Seentrix couvre une partie du{" "}
                <Term id="cra">CRA</Term> : la liste de l'annexe I, le SBOM,
                l'évaluation des risques, les schémas, le{" "}
                <Term id="annex_vii">dossier technique</Term>, la DoC, Identité
                &amp; CE, la surveillance, les avis, etc. La vue Maturité est la
                couche en vue d'ensemble par-dessus — elle lit tous ces signaux et
                évalue chaque obligation comme complète, partielle, manquante ou
                non applicable.
              </p>
              <p className="mt-3">
                Les obligations sont regroupées en quatre catégories qui reflètent
                la forme du CRA : <strong>avant commercialisation</strong> (ce qui
                doit être vrai avant l'expédition), <strong>continue</strong>
                (surveillance après commercialisation, avis, préparation aux
                incidents), <strong>conservation</strong> (documentation tenue à
                disposition) et <strong>cycle de vie</strong> (période de support,
                fin du support).
              </p>
            </>
          ),
        },
        {
          heading: "Comment le pourcentage est construit",
          body: (
            <>
              <p>
                Le pourcentage de maturité n'est pas une impression — c'est de
                l'arithmétique. Chaque élément applicable compte : un élément
                complet vaut 1, un élément partiel 0,5, un élément manquant 0. Les
                éléments non applicables sortent entièrement du dénominateur, donc
                marquer quelque chose N/A ne gonfle ni ne dégonfle injustement
                votre score.
              </p>
              <p className="mt-3">
                Un produit à, disons, 60 % n'est donc pas à 60 % d'une vague liste
                — il a gagné 60 % du crédit disponible sur ses obligations
                applicables. Le même moteur alimente la page par produit, le
                récapitulatif du tableau de bord et la réponse{" "}
                <code>getReadiness</code> du copilote, de sorte que le nombre est
                cohérent partout où vous le voyez.
              </p>
            </>
          ),
        },
        {
          heading: "La lire pour décider de la suite",
          body: (
            <>
              <p>
                La maturité est une liste de travail, pas un trophée. Chaque
                élément partiel ou manquant porte un lien « Corriger → » droit vers
                l'onglet qui le résout, donc le moyen le plus rapide d'augmenter le
                nombre est de commencer en haut des éléments manquants et de
                descendre. Les lacunes d'avant commercialisation bloquent
                généralement l'expédition ; les lacunes{" "}
                <Term id="post_market_monitoring">continues</Term> accumulent du
                risque sur la période de support.
              </p>
              <p className="mt-3">
                Traitez 100 % comme « chaque obligation a une preuve derrière elle
                », pas comme « terminé pour toujours » — les éléments continus et de
                cycle de vie se dégradent avec le temps et l'apparition de nouvelles
                vulnérabilités. Un produit à 100 % au lancement a besoin que son
                journal de surveillance et ses avis restent à jour pour y rester. La
                maturité est le tableau de bord que vous consultez pour savoir si
                c'est le cas.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "Que fait la vue Maturité CRA ?",
          options: [
            "Elle remplace le dossier technique",
            "Elle consolide les signaux de chaque onglet en un seul score évalué et regroupé",
            "Elle dépose vos rapports de l'article 14",
            "Elle génère votre SBOM",
          ],
          correctIndex: 1,
          explanation:
            "La maturité est la couche en vue d'ensemble : elle lit les signaux de chaque onglet et évalue chaque obligation complète / partielle / manquante / non applicable, regroupée en avant commercialisation, continue, conservation et cycle de vie.",
        },
        {
          question: "Comment un élément partiel est-il noté dans le pourcentage ?",
          options: ["1", "0,5", "0", "Il est exclu"],
          correctIndex: 1,
          explanation:
            "Complet vaut 1, partiel 0,5, manquant 0. Les éléments non applicables sont entièrement exclus du dénominateur.",
        },
        {
          question: "Qu'advient-il d'un élément non applicable dans le score ?",
          options: [
            "Il compte comme manquant",
            "Il compte comme complet",
            "Il sort du dénominateur",
            "Il réduit le total de moitié",
          ],
          correctIndex: 2,
          explanation:
            "Les éléments non applicables sont retirés du dénominateur, donc marquer quelque chose N/A ne gonfle ni ne dégonfle le pourcentage — seules les obligations applicables comptent.",
        },
        {
          question:
            "Pourquoi chaque élément partiel ou manquant porte-t-il un lien « Corriger → » ?",
          options: [
            "Pour supprimer l'élément",
            "Pour vous emmener droit vers l'onglet qui résout cette lacune",
            "Pour exporter un PDF",
            "Pour envoyer un e-mail à l'organisme notifié",
          ],
          correctIndex: 1,
          explanation:
            "La maturité est une liste de travail : le lien Corriger → renvoie directement à l'onglet exact qui résout la lacune, pour traiter efficacement les éléments manquants.",
        },
        {
          question: "Pourquoi 100 % de maturité n'est-il pas « terminé pour toujours » ?",
          options: [
            "Parce que le score est aléatoire",
            "Parce que les obligations continues et de cycle de vie se dégradent avec le temps et l'apparition de nouvelles vulnérabilités",
            "Parce que le CRA expire après un an",
            "Parce que le pourcentage se réinitialise chaque mois",
          ],
          correctIndex: 1,
          explanation:
            "Les éléments continus et de cycle de vie (surveillance, avis, période de support) doivent rester à jour. Un produit à 100 % au lancement doit maintenir son journal de surveillance et ses avis à jour pour y rester.",
        },
      ],
    },
    it: {
      title: "Maturità CRA: mettere tutto insieme",
      summary:
        "Come la vista Maturità CRA consolida ogni obbligo — pre-commercializzazione, continuo, conservazione e ciclo di vita — in un unico punteggio, e come leggerlo per decidere il prossimo passo.",
      sections: [
        {
          heading: "Un punteggio su molti obblighi",
          body: (
            <>
              <p>
                Ogni scheda di Seentrix copre una parte del{" "}
                <Term id="cra">CRA</Term>: la lista dell'allegato I, l'SBOM, la
                valutazione dei rischi, i diagrammi, il{" "}
                <Term id="annex_vii">fascicolo tecnico</Term>, la DoC, Identità
                &amp; CE, il monitoraggio, gli avvisi e così via. La vista
                Maturità è il livello a volo d'uccello sopra di esse — legge tutti
                questi segnali e valuta ogni obbligo come completo, parziale,
                mancante o non applicabile.
              </p>
              <p className="mt-3">
                Gli obblighi sono raggruppati in quattro categorie che rispecchiano
                la forma del CRA: <strong>pre-commercializzazione</strong> (cosa
                deve essere vero prima della spedizione), <strong>continuo</strong>
                (monitoraggio post-commercializzazione, avvisi, prontezza agli
                incidenti), <strong>conservazione</strong> (documentazione tenuta a
                disposizione) e <strong>ciclo di vita</strong> (periodo di
                supporto, fine del supporto).
              </p>
            </>
          ),
        },
        {
          heading: "Come si costruisce la percentuale",
          body: (
            <>
              <p>
                La percentuale di maturità non è una sensazione — è aritmetica.
                Ogni elemento applicabile conta: un elemento completo vale 1, uno
                parziale 0,5, uno mancante 0. Gli elementi non applicabili escono
                del tutto dal denominatore, quindi contrassegnare qualcosa come N/D
                non gonfia né sgonfia ingiustamente il punteggio.
              </p>
              <p className="mt-3">
                Un prodotto, diciamo, al 60 % non è quindi al 60 % di una vaga
                lista — ha guadagnato il 60 % del credito disponibile sui suoi
                obblighi applicabili. Lo stesso motore alimenta la pagina per
                prodotto, il riepilogo della dashboard e la risposta{" "}
                <code>getReadiness</code> del copilota, così il numero è coerente
                ovunque lo veda.
              </p>
            </>
          ),
        },
        {
          heading: "Leggerla per decidere il prossimo passo",
          body: (
            <>
              <p>
                La maturità è una lista di lavoro, non un trofeo. Ogni elemento
                parziale o mancante porta un link «Correggi →» diritto alla scheda
                che lo risolve, quindi il modo più rapido per alzare il numero è
                partire dall'alto degli elementi mancanti e scendere. Le lacune
                pre-commercializzazione di solito bloccano la spedizione; le lacune{" "}
                <Term id="post_market_monitoring">continue</Term> accumulano rischio
                lungo il periodo di supporto.
              </p>
              <p className="mt-3">
                Tratta il 100 % come «ogni obbligo ha una prova alle spalle», non
                come «finito per sempre» — gli elementi continui e di ciclo di vita
                decadono con il tempo e l'emergere di nuove vulnerabilità. Un
                prodotto al 100 % al lancio ha bisogno che il suo registro di
                monitoraggio e i suoi avvisi restino aggiornati per rimanervi. La
                maturità è la dashboard che consulti per sapere se ciò sta
                avvenendo.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "Cosa fa la vista Maturità CRA?",
          options: [
            "Sostituisce il fascicolo tecnico",
            "Consolida i segnali di ogni scheda in un unico punteggio valutato e raggruppato",
            "Presenta i tuoi rapporti dell'articolo 14",
            "Genera il tuo SBOM",
          ],
          correctIndex: 1,
          explanation:
            "La maturità è il livello a volo d'uccello: legge i segnali di ogni scheda e valuta ogni obbligo completo / parziale / mancante / non applicabile, raggruppato in pre-commercializzazione, continuo, conservazione e ciclo di vita.",
        },
        {
          question: "Come viene valutato un elemento parziale nella percentuale?",
          options: ["1", "0,5", "0", "È escluso"],
          correctIndex: 1,
          explanation:
            "Completo vale 1, parziale 0,5, mancante 0. Gli elementi non applicabili sono esclusi del tutto dal denominatore.",
        },
        {
          question: "Cosa succede a un elemento non applicabile nel punteggio?",
          options: [
            "Conta come mancante",
            "Conta come completo",
            "Esce dal denominatore",
            "Dimezza il totale",
          ],
          correctIndex: 2,
          explanation:
            "Gli elementi non applicabili sono rimossi dal denominatore, quindi contrassegnare qualcosa come N/D non gonfia né sgonfia la percentuale — contano solo gli obblighi applicabili.",
        },
        {
          question:
            "Perché ogni elemento parziale o mancante porta un link «Correggi →»?",
          options: [
            "Per eliminare l'elemento",
            "Per portarti diritto alla scheda che risolve quella lacuna",
            "Per esportare un PDF",
            "Per inviare un'e-mail all'organismo notificato",
          ],
          correctIndex: 1,
          explanation:
            "La maturità è una lista di lavoro: il link Correggi → rinvia direttamente alla scheda esatta che risolve la lacuna, per affrontare in modo efficiente gli elementi mancanti.",
        },
        {
          question: "Perché il 100 % di maturità non è «finito per sempre»?",
          options: [
            "Perché il punteggio è casuale",
            "Perché gli obblighi continui e di ciclo di vita decadono con il tempo e l'emergere di nuove vulnerabilità",
            "Perché il CRA scade dopo un anno",
            "Perché la percentuale si azzera ogni mese",
          ],
          correctIndex: 1,
          explanation:
            "Gli elementi continui e di ciclo di vita (monitoraggio, avvisi, periodo di supporto) devono restare aggiornati. Un prodotto al 100 % al lancio deve mantenere aggiornati il registro di monitoraggio e gli avvisi per rimanervi.",
        },
      ],
    },
  },
};

export default lesson;
