/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "annex-vii-technical-file",
  duration: "8 min",
  requiredForRoles: ["admin", "compliance_officer", "cto", "editor"],
  prerequisites: ["sbom-fundamentals"],
  i18n: {
    en: {
      title: "The Annex VII technical file & retention",
      summary:
        "What the eight points of Annex VII contain, how Seentrix assembles them into one file, and the Article 13(13) duty to retain it for ten years.",
      sections: [
        {
          heading: "What Annex VII actually contains",
          body: (
            <p>
              The <Term id="technical_documentation">technical documentation</Term>{" "}
              required by <Term id="annex_vii">Annex VII</Term> has eight points:
              (1) a general description (intended purpose, versions, and — for
              hardware — photos); (2) the design, development and production,
              split into (2a) system architecture and data-flow diagrams, (2b)
              the vulnerability-handling processes (<Term id="sbom">SBOM</Term>,
              disclosure policy, security contact, secure updates) and (2c)
              production & monitoring; (3) the risk assessment; (4) the support
              period; (5) the standards applied; (6) the test reports; and (7) a
              copy of the <Term id="doc">Declaration of Conformity</Term>. It
              must exist <em>before</em> the product is placed on the market and
              be kept up to date.
            </p>
          ),
        },
        {
          heading: "It's a compilation, not fresh writing",
          body: (
            <p>
              The <strong>Technical File</strong> tab does not ask you to
              re-type anything. It gathers what the other tabs already hold — the
              product description and versions, the diagrams and evidence, the
              SBOM and disclosure policy, the released risk assessment, the
              support period, the standards from your Declaration of Conformity,
              and the DoC itself — and assembles them in Annex VII order into one
              branded PDF. A coverage panel grades each of the nine sections{" "}
              <em>Present</em>, <em>Partial</em> or <em>Missing</em> and links
              you straight to the tab where a gap is fixed.
            </p>
          ),
        },
        {
          heading: "Retention: ten years, or the support period",
          body: (
            <p>
              Article 13(13) requires you to keep the technical documentation and
              the Declaration of Conformity available to market-surveillance
              authorities for at least <strong>ten years</strong> after the
              product is placed on the market — or for the{" "}
              <Term id="retention_period">support period</Term>, whichever is
              longer. When you release a technical-file version Seentrix stamps
              that retention deadline and keeps the released file
              (soft-archived), so it is never lost before the obligation ends.
            </p>
          ),
        },
        {
          heading: "Release it, date it, keep it current",
          body: (
            <p>
              An authority assessing your product reads the technical file to
              understand what they're looking at, so it must reflect the product
              as placed on the market and be re-issued when the product changes.
              Releasing a version locks and dates it; when something material
              changes — a new risk assessment, a new SBOM, a design change — you
              assemble and release a fresh version. The coverage percentage is
              your at-a-glance readiness signal.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "How long must the technical documentation and DoC be retained (Article 13(13))?",
          options: [
            "1 year after the last sale",
            "At least 10 years after placing on the market, or the support period if longer",
            "Until the next product version ships",
            "5 years, then it can be deleted",
          ],
          correctIndex: 1,
          explanation:
            "Article 13(13) requires retention for at least 10 years after the product is placed on the market, or the support period if that is longer.",
        },
        {
          question: "Which of these is part of the Annex VII technical file?",
          options: [
            "A marketing brochure",
            "The system architecture and data-flow diagrams",
            "The company's annual financial report",
            "Customer testimonials",
          ],
          correctIndex: 1,
          explanation:
            "Annex VII point 2(a) requires a description of the design including system architecture and data-flow diagrams.",
        },
        {
          question: "Does the Technical File tab create new content?",
          options: [
            "Yes, you re-type everything there",
            "No — it compiles the artifacts the other tabs already hold",
            "It only stores a single uploaded PDF",
            "It replaces the SBOM and risk assessment",
          ],
          correctIndex: 1,
          explanation:
            "The assembler gathers existing data (description, diagrams, SBOM, risk assessment, standards, evidence, DoC) into one Annex VII document; you fix gaps on the relevant tab.",
        },
        {
          question: "When must the technical documentation be drawn up?",
          options: [
            "After the first incident is reported",
            "Within 10 years of launch",
            "Before the product is placed on the market, and kept up to date",
            "Only if a notified body requests it",
          ],
          correctIndex: 2,
          explanation:
            "The documentation must exist before the product is placed on the market and be kept current throughout its life.",
        },
        {
          question:
            "What does a 'Partial' coverage badge on an Annex VII point mean?",
          options: [
            "The point is fully satisfied",
            "Some but not all of the expected content is present — more is needed",
            "The point does not apply to your product",
            "The file has been archived",
          ],
          correctIndex: 1,
          explanation:
            "Partial means the section has some content but is incomplete (e.g. a draft DoC, or diagrams without an architecture/data-flow view); the panel links to where to finish it.",
        },
      ],
    },
    de: {
      title: "Die technische Dokumentation nach Anhang VII & Aufbewahrung",
      summary:
        "Was die acht Punkte des Anhangs VII enthalten, wie Seentrix sie zu einer Datei zusammenstellt und die Pflicht aus Artikel 13(13), sie zehn Jahre aufzubewahren.",
      sections: [
        {
          heading: "Was Anhang VII tatsächlich enthält",
          body: (
            <p>
              Die von <Term id="annex_vii">Anhang VII</Term> geforderte{" "}
              <Term id="technical_documentation">technische Dokumentation</Term>{" "}
              hat acht Punkte: (1) eine allgemeine Beschreibung
              (Verwendungszweck, Versionen und — bei Hardware — Fotos); (2)
              Design, Entwicklung und Produktion, unterteilt in (2a)
              Systemarchitektur und Datenflussdiagramme, (2b) die Prozesse zur
              Schwachstellenbehandlung (<Term id="sbom">SBOM</Term>,
              Offenlegungsrichtlinie, Sicherheitskontakt, sichere Updates) und
              (2c) Produktion & Überwachung; (3) die Risikobewertung; (4) den
              Supportzeitraum; (5) die angewandten Normen; (6) die Testberichte;
              und (7) eine Kopie der{" "}
              <Term id="doc">Konformitätserklärung</Term>. Sie muss{" "}
              <em>vor</em> dem Inverkehrbringen vorliegen und aktuell gehalten
              werden.
            </p>
          ),
        },
        {
          heading: "Eine Zusammenstellung, kein Neuschreiben",
          body: (
            <p>
              Der Reiter <strong>Technische Dokumentation</strong> verlangt kein
              erneutes Eintippen. Er sammelt, was die anderen Reiter bereits
              enthalten — Produktbeschreibung und Versionen, Diagramme und
              Nachweise, SBOM und Offenlegungsrichtlinie, die freigegebene
              Risikobewertung, den Supportzeitraum, die Normen aus Ihrer
              Konformitätserklärung und die Erklärung selbst — und stellt sie in
              der Reihenfolge des Anhangs VII zu einem PDF zusammen. Ein
              Abdeckungspanel bewertet jeden der neun Abschnitte als{" "}
              <em>vorhanden</em>, <em>teilweise</em> oder <em>fehlend</em> und
              verlinkt direkt zum richtigen Reiter.
            </p>
          ),
        },
        {
          heading: "Aufbewahrung: zehn Jahre oder der Supportzeitraum",
          body: (
            <p>
              Artikel 13(13) verlangt, die technische Dokumentation und die
              Konformitätserklärung mindestens <strong>zehn Jahre</strong> nach
              dem Inverkehrbringen für die Marktüberwachungsbehörden
              bereitzuhalten — oder für den{" "}
              <Term id="retention_period">Supportzeitraum</Term>, je nachdem,
              was länger ist. Beim Freigeben einer Version stempelt Seentrix
              diese Frist und bewahrt die freigegebene Datei (archiviert) auf, so
              dass sie vor Ablauf der Pflicht nie verloren geht.
            </p>
          ),
        },
        {
          heading: "Freigeben, datieren, aktuell halten",
          body: (
            <p>
              Eine Behörde liest die technische Dokumentation, um zu verstehen,
              was sie vor sich hat; sie muss das Produkt wie in Verkehr gebracht
              widerspiegeln und bei Änderungen neu erstellt werden. Das Freigeben
              einer Version sperrt und datiert sie; ändert sich etwas Wesentliches
              — eine neue Risikobewertung, eine neue SBOM, eine Designänderung —,
              stellen Sie eine neue Version zusammen und geben sie frei. Der
              Abdeckungsgrad ist Ihr schneller Reifegrad-Indikator.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Wie lange müssen die technische Dokumentation und die Konformitätserklärung aufbewahrt werden (Artikel 13(13))?",
          options: [
            "1 Jahr nach dem letzten Verkauf",
            "Mindestens 10 Jahre nach dem Inverkehrbringen, oder der Supportzeitraum, falls länger",
            "Bis die nächste Produktversion erscheint",
            "5 Jahre, dann kann sie gelöscht werden",
          ],
          correctIndex: 1,
          explanation:
            "Artikel 13(13) verlangt eine Aufbewahrung von mindestens 10 Jahren nach dem Inverkehrbringen, oder dem Supportzeitraum, falls dieser länger ist.",
        },
        {
          question: "Was gehört zur technischen Dokumentation nach Anhang VII?",
          options: [
            "Eine Marketingbroschüre",
            "Die Systemarchitektur und Datenflussdiagramme",
            "Der Jahresabschluss des Unternehmens",
            "Kundenstimmen",
          ],
          correctIndex: 1,
          explanation:
            "Anhang VII Punkt 2(a) verlangt eine Beschreibung des Designs einschließlich Systemarchitektur und Datenflussdiagrammen.",
        },
        {
          question: "Erstellt der Reiter „Technische Dokumentation“ neue Inhalte?",
          options: [
            "Ja, man tippt dort alles neu ein",
            "Nein — er stellt die bereits vorhandenen Artefakte der anderen Reiter zusammen",
            "Er speichert nur ein einzelnes hochgeladenes PDF",
            "Er ersetzt die SBOM und die Risikobewertung",
          ],
          correctIndex: 1,
          explanation:
            "Der Assembler sammelt vorhandene Daten in ein Anhang-VII-Dokument; Lücken schließen Sie auf dem jeweiligen Reiter.",
        },
        {
          question: "Wann muss die technische Dokumentation erstellt werden?",
          options: [
            "Nach der ersten Vorfallmeldung",
            "Innerhalb von 10 Jahren nach dem Start",
            "Vor dem Inverkehrbringen, und sie ist aktuell zu halten",
            "Nur wenn eine notifizierte Stelle es verlangt",
          ],
          correctIndex: 2,
          explanation:
            "Die Dokumentation muss vor dem Inverkehrbringen vorliegen und über die gesamte Lebensdauer aktuell gehalten werden.",
        },
        {
          question:
            "Was bedeutet ein „Teilweise“-Abdeckungszeichen bei einem Anhang-VII-Punkt?",
          options: [
            "Der Punkt ist vollständig erfüllt",
            "Es ist etwas, aber nicht alles vorhanden — es fehlt noch etwas",
            "Der Punkt trifft auf Ihr Produkt nicht zu",
            "Die Datei wurde archiviert",
          ],
          correctIndex: 1,
          explanation:
            "„Teilweise“ heißt, der Abschnitt hat Inhalt, ist aber unvollständig (z. B. eine Entwurfs-Konformitätserklärung); das Panel verlinkt zur Fertigstellung.",
        },
      ],
    },
    fr: {
      title: "Le dossier technique (annexe VII) & la conservation",
      summary:
        "Ce que contiennent les huit points de l'annexe VII, comment Seentrix les assemble en un dossier, et l'obligation de l'Article 13(13) de le conserver dix ans.",
      sections: [
        {
          heading: "Ce que contient réellement l'annexe VII",
          body: (
            <p>
              La{" "}
              <Term id="technical_documentation">documentation technique</Term>{" "}
              exigée par l'<Term id="annex_vii">annexe VII</Term> comporte huit
              points : (1) une description générale (destination, versions et —
              pour le matériel — des photos) ; (2) la conception, le
              développement et la production, répartis en (2a) architecture du
              système et schémas de flux de données, (2b) les processus de
              gestion des vulnérabilités (<Term id="sbom">SBOM</Term>, politique
              de divulgation, contact sécurité, mises à jour sécurisées) et (2c)
              production & surveillance ; (3) l'évaluation des risques ; (4) la
              période de support ; (5) les normes appliquées ; (6) les rapports
              d'essais ; et (7) une copie de la{" "}
              <Term id="doc">déclaration de conformité</Term>. Elle doit exister{" "}
              <em>avant</em> la mise sur le marché et être tenue à jour.
            </p>
          ),
        },
        {
          heading: "Une compilation, pas une nouvelle rédaction",
          body: (
            <p>
              L'onglet <strong>Dossier technique</strong> ne vous demande rien de
              re-saisir. Il rassemble ce que les autres onglets contiennent déjà
              — la description et les versions du produit, les schémas et preuves,
              le SBOM et la politique de divulgation, l'évaluation des risques
              publiée, la période de support, les normes de votre déclaration de
              conformité et la déclaration elle-même — et les assemble dans
              l'ordre de l'annexe VII en un PDF. Un panneau de couverture note
              chacune des neuf sections <em>Présente</em>, <em>Partielle</em> ou{" "}
              <em>Manquante</em> et renvoie directement à l'onglet à corriger.
            </p>
          ),
        },
        {
          heading: "Conservation : dix ans, ou la période de support",
          body: (
            <p>
              L'Article 13(13) impose de tenir la documentation technique et la
              déclaration de conformité à la disposition des autorités de
              surveillance du marché pendant au moins <strong>dix ans</strong>{" "}
              après la mise sur le marché — ou pendant la{" "}
              <Term id="retention_period">période de support</Term> si elle est
              plus longue. À la publication d'une version, Seentrix horodate
              cette échéance et conserve le fichier publié (archivé), pour qu'il
              ne soit jamais perdu avant la fin de l'obligation.
            </p>
          ),
        },
        {
          heading: "Publier, dater, tenir à jour",
          body: (
            <p>
              Une autorité lit le dossier technique pour comprendre ce qu'elle
              examine ; il doit refléter le produit tel que mis sur le marché et
              être réémis quand le produit change. Publier une version la
              verrouille et la date ; lorsqu'un élément important change — une
              nouvelle évaluation des risques, un nouveau SBOM, une modification
              de conception — vous assemblez et publiez une nouvelle version. Le
              pourcentage de couverture est votre indicateur d'état de préparation.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Combien de temps faut-il conserver la documentation technique et la DoC (Article 13(13)) ?",
          options: [
            "1 an après la dernière vente",
            "Au moins 10 ans après la mise sur le marché, ou la période de support si elle est plus longue",
            "Jusqu'à la prochaine version du produit",
            "5 ans, puis on peut la supprimer",
          ],
          correctIndex: 1,
          explanation:
            "L'Article 13(13) impose une conservation d'au moins 10 ans après la mise sur le marché, ou la période de support si elle est plus longue.",
        },
        {
          question: "Lequel fait partie du dossier technique de l'annexe VII ?",
          options: [
            "Une brochure marketing",
            "L'architecture du système et les schémas de flux de données",
            "Le rapport financier annuel de l'entreprise",
            "Des témoignages clients",
          ],
          correctIndex: 1,
          explanation:
            "Le point 2(a) de l'annexe VII exige une description de la conception, y compris l'architecture du système et les schémas de flux de données.",
        },
        {
          question: "L'onglet Dossier technique crée-t-il du nouveau contenu ?",
          options: [
            "Oui, on y re-saisit tout",
            "Non — il compile les éléments que les autres onglets contiennent déjà",
            "Il ne stocke qu'un seul PDF téléversé",
            "Il remplace le SBOM et l'évaluation des risques",
          ],
          correctIndex: 1,
          explanation:
            "L'assembleur rassemble les données existantes en un document annexe VII ; les lacunes se corrigent dans l'onglet concerné.",
        },
        {
          question: "Quand la documentation technique doit-elle être établie ?",
          options: [
            "Après le premier incident signalé",
            "Dans les 10 ans suivant le lancement",
            "Avant la mise sur le marché, et tenue à jour",
            "Uniquement si un organisme notifié le demande",
          ],
          correctIndex: 2,
          explanation:
            "La documentation doit exister avant la mise sur le marché et être tenue à jour pendant toute la vie du produit.",
        },
        {
          question:
            "Que signifie un badge de couverture « Partielle » sur un point de l'annexe VII ?",
          options: [
            "Le point est entièrement satisfait",
            "Une partie seulement du contenu attendu est présente — il en faut plus",
            "Le point ne s'applique pas à votre produit",
            "Le fichier a été archivé",
          ],
          correctIndex: 1,
          explanation:
            "« Partielle » signifie que la section a du contenu mais est incomplète (ex. une DoC en brouillon) ; le panneau renvoie à l'endroit où la finir.",
        },
      ],
    },
    it: {
      title: "Il fascicolo tecnico (allegato VII) & la conservazione",
      summary:
        "Cosa contengono gli otto punti dell'allegato VII, come Seentrix li assembla in un unico fascicolo e l'obbligo dell'Articolo 13(13) di conservarlo dieci anni.",
      sections: [
        {
          heading: "Cosa contiene davvero l'allegato VII",
          body: (
            <p>
              La{" "}
              <Term id="technical_documentation">documentazione tecnica</Term>{" "}
              richiesta dall'<Term id="annex_vii">allegato VII</Term> ha otto
              punti: (1) una descrizione generale (destinazione d'uso, versioni
              e — per l'hardware — foto); (2) progettazione, sviluppo e
              produzione, suddivisi in (2a) architettura di sistema e diagrammi
              di flusso dei dati, (2b) i processi di gestione delle vulnerabilità
              (<Term id="sbom">SBOM</Term>, politica di divulgazione, contatto di
              sicurezza, aggiornamenti sicuri) e (2c) produzione & monitoraggio;
              (3) la valutazione dei rischi; (4) il periodo di supporto; (5) le
              norme applicate; (6) i rapporti di prova; e (7) una copia della{" "}
              <Term id="doc">dichiarazione di conformità</Term>. Deve esistere{" "}
              <em>prima</em> dell'immissione sul mercato ed essere tenuta
              aggiornata.
            </p>
          ),
        },
        {
          heading: "Una compilazione, non una nuova stesura",
          body: (
            <p>
              La scheda <strong>Fascicolo tecnico</strong> non chiede di
              ridigitare nulla. Raccoglie ciò che le altre schede già contengono
              — descrizione e versioni del prodotto, diagrammi e prove, SBOM e
              politica di divulgazione, la valutazione dei rischi rilasciata, il
              periodo di supporto, le norme dalla dichiarazione di conformità e
              la dichiarazione stessa — e le assembla nell'ordine dell'allegato
              VII in un PDF. Un pannello di copertura valuta ciascuna delle nove
              sezioni come <em>presente</em>, <em>parziale</em> o{" "}
              <em>mancante</em> e rimanda direttamente alla scheda da correggere.
            </p>
          ),
        },
        {
          heading: "Conservazione: dieci anni, o il periodo di supporto",
          body: (
            <p>
              L'Articolo 13(13) impone di tenere la documentazione tecnica e la
              dichiarazione di conformità a disposizione delle autorità di
              vigilanza del mercato per almeno <strong>dieci anni</strong> dopo
              l'immissione sul mercato — o per il{" "}
              <Term id="retention_period">periodo di supporto</Term>, se più
              lungo. Quando rilasci una versione, Seentrix marca tale scadenza e
              conserva il file rilasciato (archiviato), così non va mai perso
              prima della fine dell'obbligo.
            </p>
          ),
        },
        {
          heading: "Rilasciare, datare, mantenere aggiornato",
          body: (
            <p>
              Un'autorità legge il fascicolo tecnico per capire cosa sta
              esaminando; deve riflettere il prodotto come immesso sul mercato ed
              essere riemesso quando il prodotto cambia. Rilasciare una versione
              la blocca e la data; quando cambia qualcosa di sostanziale — una
              nuova valutazione dei rischi, un nuovo SBOM, una modifica di
              progettazione — assembli e rilasci una nuova versione. La
              percentuale di copertura è il tuo indicatore immediato di
              preparazione.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Per quanto tempo vanno conservate la documentazione tecnica e la DoC (Articolo 13(13))?",
          options: [
            "1 anno dopo l'ultima vendita",
            "Almeno 10 anni dopo l'immissione sul mercato, o il periodo di supporto se più lungo",
            "Fino alla prossima versione del prodotto",
            "5 anni, poi può essere eliminata",
          ],
          correctIndex: 1,
          explanation:
            "L'Articolo 13(13) richiede la conservazione per almeno 10 anni dall'immissione sul mercato, o per il periodo di supporto se più lungo.",
        },
        {
          question: "Quale di questi fa parte del fascicolo tecnico dell'allegato VII?",
          options: [
            "Una brochure di marketing",
            "L'architettura di sistema e i diagrammi di flusso dei dati",
            "Il bilancio annuale dell'azienda",
            "Le testimonianze dei clienti",
          ],
          correctIndex: 1,
          explanation:
            "Il punto 2(a) dell'allegato VII richiede una descrizione della progettazione, inclusi architettura di sistema e diagrammi di flusso dei dati.",
        },
        {
          question: "La scheda Fascicolo tecnico crea nuovo contenuto?",
          options: [
            "Sì, vi si ridigita tutto",
            "No — compila gli artefatti che le altre schede già contengono",
            "Memorizza solo un singolo PDF caricato",
            "Sostituisce l'SBOM e la valutazione dei rischi",
          ],
          correctIndex: 1,
          explanation:
            "L'assemblatore raccoglie i dati esistenti in un documento allegato VII; le lacune si colmano nella scheda pertinente.",
        },
        {
          question: "Quando deve essere redatta la documentazione tecnica?",
          options: [
            "Dopo il primo incidente segnalato",
            "Entro 10 anni dal lancio",
            "Prima dell'immissione sul mercato, e tenuta aggiornata",
            "Solo se un organismo notificato lo richiede",
          ],
          correctIndex: 2,
          explanation:
            "La documentazione deve esistere prima dell'immissione sul mercato ed essere tenuta aggiornata per tutta la vita del prodotto.",
        },
        {
          question:
            "Cosa significa un badge di copertura «Parziale» su un punto dell'allegato VII?",
          options: [
            "Il punto è pienamente soddisfatto",
            "È presente solo parte del contenuto previsto — ne serve altro",
            "Il punto non si applica al tuo prodotto",
            "Il file è stato archiviato",
          ],
          correctIndex: 1,
          explanation:
            "«Parziale» significa che la sezione ha contenuto ma è incompleta (es. una DoC in bozza); il pannello rimanda a dove completarla.",
        },
      ],
    },
  },
};

export default lesson;
