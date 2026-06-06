/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "sbom-fundamentals",
  duration: "5 min",
  requiredForRoles: ["admin", "cto", "editor"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "SBOM fundamentals (CycloneDX, SPDX, Annex I)",
      summary:
        "What an SBOM is, why CRA Annex I needs one, how to generate one for typical stacks, and how Seentrix turns it into vulnerability intelligence.",
      sections: [
        {
          heading: "Why the SBOM matters",
          body: (
            <p>
              Annex I Part I(2)(a)(v) requires us to “identify and
              document relevant components.” A{" "}
              <Term id="sbom">Software Bill of Materials</Term> is the
              machine-readable way to meet that requirement: a complete
              inventory of every dependency (direct and transitive) with
              versions and licences. Without an SBOM, vulnerability
              scanning is impossible — we literally don't know what's in
              our product. With one, every CVE published against any of
              our components surfaces automatically.
            </p>
          ),
        },
        {
          heading: "Pick a format",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="cyclonedx">CycloneDX</Term>.
                  </strong>{" "}
                  OWASP format, JSON or XML. Strong at representing
                  dependency relationships and security findings inline.
                  Common in security tooling.
                </li>
                <li>
                  <strong>
                    <Term id="spdx">SPDX</Term>.
                  </strong>{" "}
                  Linux Foundation, ISO/IEC 5962 standardised. Strongest
                  licence-representation. Required by US federal
                  procurement; good default for enterprise.
                </li>
              </ul>
              <p className="mt-3">
                Seentrix accepts both natively. Pick one and stick with it
                per product — mixing complicates diffing across releases.
              </p>
            </>
          ),
        },
        {
          heading: "Where SBOMs come from",
          body: (
            <>
              <p>
                Generate, don't hand-write. Popular tools:
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Syft</strong> (Anchore) — container / filesystem,
                  outputs both CycloneDX and SPDX.
                </li>
                <li>
                  <strong>cdxgen</strong> — polyglot build-system aware,
                  CycloneDX.
                </li>
                <li>
                  <strong>npm / pnpm / yarn</strong> — npm has{" "}
                  <code>npm sbom --sbom-format cyclonedx</code> built in
                  since v10.
                </li>
                <li>
                  <strong>Docker</strong> — <code>docker sbom</code>{" "}
                  (or <code>docker buildx build --sbom</code>).
                </li>
              </ul>
              <p className="mt-3">
                Upload the generated file in the SBOM tab. Seentrix parses
                it, scans components against the vulnerability databases,
                and marks the SBOM as <em>active</em>. Only one SBOM per
                product is active at a time — that's the one the scanner
                uses and the one the DoC's technical documentation cites.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "Why does the CRA effectively require an SBOM?",
          options: [
            "Annex I Part I(2)(a)(v) requires identifying and documenting relevant components — an SBOM is the practical way",
            "Annex II lists SBOM as a mandatory word-for-word deliverable",
            "Because ENISA operates an SBOM registry",
            "It doesn't — SBOMs are nice-to-have, not required",
          ],
          correctIndex: 0,
          explanation:
            "The CRA doesn't use the word “SBOM” but Annex I Part I(2)(a)(v) requires identifying and documenting components. An SBOM is how this is done in practice; without one, vulnerability monitoring (Part II) is not operable.",
        },
        {
          question:
            "Which SBOM format has the strongest licence-representation and is an ISO/IEC standard?",
          options: ["CycloneDX", "SPDX", "SWID tags", "Open API"],
          correctIndex: 1,
          explanation:
            "SPDX is ISO/IEC 5962 and has the richest licence-expression system of any SBOM format. CycloneDX is strong but not an ISO standard and is oriented more toward security-intelligence.",
        },
        {
          question: "How many SBOMs can a product have active at once?",
          options: [
            "One per dependency",
            "One per release",
            "Exactly one — the active SBOM is the scanner and DoC source of truth",
            "Unlimited",
          ],
          correctIndex: 2,
          explanation:
            "Only one SBOM per product is active at a time. Multiple can be uploaded as history, but exactly one is active for scanning and for technical-documentation purposes.",
        },
        {
          question:
            "Which tool would you use to generate a CycloneDX SBOM from a running Docker image?",
          options: [
            "Syft or `docker sbom`",
            "cdxgen (it only builds SPDX)",
            "npm sbom (not applicable to containers)",
            "Market surveillance will provide one",
          ],
          correctIndex: 0,
          explanation:
            "Syft is the go-to for container / filesystem scanning; `docker sbom` wraps Syft under the hood. cdxgen is polyglot but targets source builds rather than container images.",
        },
        {
          question:
            "A CVE is published against a component in our SBOM that was removed in our current build. What's the correct handling?",
          options: [
            "Score at CVSS and patch ASAP",
            "Re-upload an SBOM that reflects the current build; the stale SBOM is misleading the scanner",
            "Ignore — the scanner is wrong",
            "Mark the CVE as false positive globally",
          ],
          correctIndex: 1,
          explanation:
            "The SBOM must reflect reality. If the component was removed, the active SBOM is stale — regenerate and re-upload. The scanner is doing its job; the input data is wrong.",
        },
      ],
    },
    de: {
      title: "SBOM-Grundlagen (CycloneDX, SPDX, Anhang I)",
      summary:
        "Was eine SBOM ist, warum der CRA eine verlangt, wie man sie für typische Stacks erzeugt und wie Seentrix daraus Schwachstellen-Intelligenz macht.",
      sections: [
        {
          heading: "Warum die SBOM zählt",
          body: (
            <p>
              Anhang I Teil I(2)(a)(v) verlangt, „relevante Komponenten
              zu identifizieren und zu dokumentieren“. Eine{" "}
              <Term id="sbom">Software Bill of Materials</Term> ist der
              maschinenlesbare Weg dazu: vollständiges Inventar aller
              Abhängigkeiten (direkt und transitiv) mit Versionen und
              Lizenzen. Ohne SBOM ist Schwachstellen-Scanning unmöglich —
              wir wissen wörtlich nicht, was drin ist. Mit SBOM erscheint
              jede neu veröffentlichte CVE automatisch.
            </p>
          ),
        },
        {
          heading: "Format wählen",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="cyclonedx">CycloneDX</Term>.
                  </strong>{" "}
                  OWASP-Format, JSON oder XML. Stark bei
                  Abhängigkeitsbeziehungen und Security-Findings. Verbreitet
                  in Security-Tools.
                </li>
                <li>
                  <strong>
                    <Term id="spdx">SPDX</Term>.
                  </strong>{" "}
                  Linux Foundation, ISO/IEC 5962. Beste
                  Lizenzdarstellung; Pflicht bei US-Behörden-Beschaffung;
                  guter Enterprise-Default.
                </li>
              </ul>
              <p className="mt-3">
                Seentrix versteht beide nativ. Eines pro Produkt wählen und
                dabei bleiben — Mischen erschwert den Vergleich zwischen
                Releases.
              </p>
            </>
          ),
        },
        {
          heading: "Woher SBOMs kommen",
          body: (
            <>
              <p>Generieren, nicht von Hand schreiben. Tools:</p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Syft</strong> (Anchore) — Container /
                  Dateisystem, erzeugt CycloneDX und SPDX.
                </li>
                <li>
                  <strong>cdxgen</strong> — polyglotter
                  Build-System-Support, CycloneDX.
                </li>
                <li>
                  <strong>npm / pnpm / yarn</strong> — npm unterstützt{" "}
                  <code>npm sbom --sbom-format cyclonedx</code> seit v10.
                </li>
                <li>
                  <strong>Docker</strong> — <code>docker sbom</code>{" "}
                  (oder <code>docker buildx build --sbom</code>).
                </li>
              </ul>
              <p className="mt-3">
                Die generierte Datei im SBOM-Tab hochladen. Seentrix parst,
                scannt gegen Schwachstellen-DBs und markiert die SBOM als{" "}
                <em>aktiv</em>. Nur eine SBOM pro Produkt ist gleichzeitig
                aktiv — sie ist die Quelle für Scanner und für die
                technische Dokumentation der DoC.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "Warum verlangt der CRA faktisch eine SBOM?",
          options: [
            "Anhang I Teil I(2)(a)(v) verlangt das Identifizieren und Dokumentieren relevanter Komponenten — eine SBOM ist der praktische Weg",
            "Anhang II führt SBOM wörtlich als Pflichtlieferung",
            "Weil die ENISA ein SBOM-Register betreibt",
            "Tut er nicht — SBOMs sind nice-to-have",
          ],
          correctIndex: 0,
          explanation:
            "Der CRA nennt „SBOM“ nicht explizit, Anhang I Teil I(2)(a)(v) verlangt aber das Identifizieren und Dokumentieren relevanter Komponenten. Eine SBOM ist der praktische Weg; ohne sie funktioniert Teil II (Schwachstellen) nicht.",
        },
        {
          question:
            "Welches SBOM-Format hat die stärkste Lizenz-Repräsentation und ist ein ISO/IEC-Standard?",
          options: ["CycloneDX", "SPDX", "SWID-Tags", "Open API"],
          correctIndex: 1,
          explanation:
            "SPDX ist ISO/IEC 5962 und hat das reichhaltigste Lizenzausdruckssystem. CycloneDX ist stark, aber kein ISO-Standard und stärker security-orientiert.",
        },
        {
          question: "Wie viele SBOMs können pro Produkt gleichzeitig aktiv sein?",
          options: [
            "Eine pro Abhängigkeit",
            "Eine pro Release",
            "Genau eine — die aktive SBOM ist Quelle der Wahrheit für Scanner und DoC",
            "Beliebig viele",
          ],
          correctIndex: 2,
          explanation:
            "Pro Produkt ist genau eine SBOM gleichzeitig aktiv. Weitere können als Historie hochgeladen werden, aktiv ist eine einzige für Scanning und technische Dokumentation.",
        },
        {
          question:
            "Welches Tool eignet sich, um eine CycloneDX-SBOM aus einem laufenden Docker-Image zu erzeugen?",
          options: [
            "Syft oder `docker sbom`",
            "cdxgen (nur SPDX)",
            "npm sbom (nicht für Container)",
            "Die Marktüberwachung liefert eine",
          ],
          correctIndex: 0,
          explanation:
            "Syft ist das Standardwerkzeug für Container/Dateisystem-Scans; `docker sbom` nutzt Syft. cdxgen ist polyglott, zielt aber auf Source-Builds.",
        },
        {
          question:
            "Eine neue CVE trifft eine Komponente in unserer SBOM, die im aktuellen Build entfernt wurde. Richtige Behandlung?",
          options: [
            "CVSS bewerten und schnellstmöglich patchen",
            "Eine SBOM hochladen, die dem aktuellen Build entspricht; die veraltete SBOM führt den Scanner in die Irre",
            "Ignorieren — Scanner ist falsch",
            "CVE global als False Positive markieren",
          ],
          correctIndex: 1,
          explanation:
            "Die SBOM muss der Realität entsprechen. Ist die Komponente entfernt, ist die aktive SBOM veraltet — neu erzeugen und hochladen. Der Scanner arbeitet korrekt; die Eingabedaten sind falsch.",
        },
      ],
    },
    fr: {
      title: "Fondamentaux de la SBOM (CycloneDX, SPDX, Annexe I)",
      summary:
        "Ce qu'est une SBOM, pourquoi l'Annexe I du CRA en exige une, comment en générer une pour des stacks classiques et comment Seentrix la transforme en renseignement sur les vulnérabilités.",
      sections: [
        {
          heading: "Pourquoi la SBOM est importante",
          body: (
            <p>
              L'Annexe I Partie I(2)(a)(v) nous impose d'« identifier et
              documenter les composants pertinents. » Une{" "}
              <Term id="sbom">nomenclature logicielle</Term> est la
              façon lisible par les machines de satisfaire à cette exigence :
              un inventaire complet de chaque dépendance (directe et
              transitive) avec les versions et les licences. Sans SBOM, le
              balayage des vulnérabilités est impossible — nous ne savons
              littéralement pas ce que contient notre produit. Avec une SBOM,
              chaque CVE publiée contre l'un de nos composants remonte
              automatiquement.
            </p>
          ),
        },
        {
          heading: "Choisir un format",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="cyclonedx">CycloneDX</Term>.
                  </strong>{" "}
                  Format OWASP, JSON ou XML. Performant pour représenter les
                  relations de dépendances et les résultats de sécurité en
                  ligne. Très répandu dans les outils de sécurité.
                </li>
                <li>
                  <strong>
                    <Term id="spdx">SPDX</Term>.
                  </strong>{" "}
                  Linux Foundation, standardisé ISO/IEC 5962. Représentation
                  des licences la plus complète. Exigé par les marchés publics
                  américains ; bon choix par défaut pour les entreprises.
                </li>
              </ul>
              <p className="mt-3">
                Seentrix accepte les deux nativement. Choisir un format et
                s'y tenir par produit — mélanger les formats complique la
                comparaison entre les versions.
              </p>
            </>
          ),
        },
        {
          heading: "D'où viennent les SBOM",
          body: (
            <>
              <p>
                Générer, ne pas rédiger manuellement. Outils courants :
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Syft</strong> (Anchore) — conteneur / système de
                  fichiers, génère CycloneDX et SPDX.
                </li>
                <li>
                  <strong>cdxgen</strong> — polyglotte et compatible avec les
                  systèmes de build, CycloneDX.
                </li>
                <li>
                  <strong>npm / pnpm / yarn</strong> — npm dispose de{" "}
                  <code>npm sbom --sbom-format cyclonedx</code> en natif
                  depuis la v10.
                </li>
                <li>
                  <strong>Docker</strong> — <code>docker sbom</code>{" "}
                  (ou <code>docker buildx build --sbom</code>).
                </li>
              </ul>
              <p className="mt-3">
                Déposer le fichier généré dans l'onglet SBOM. Seentrix
                l'analyse, scanne les composants dans les bases de données de
                vulnérabilités et marque la SBOM comme <em>active</em>. Une
                seule SBOM par produit est active à la fois — c'est celle
                qu'utilise le scanner et celle que cite la documentation
                technique de la DoC.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "Pourquoi le CRA exige-t-il de fait une SBOM ?",
          options: [
            "L'Annexe I Partie I(2)(a)(v) impose d'identifier et de documenter les composants pertinents — une SBOM est la voie pratique",
            "L'Annexe II liste la SBOM comme livrable obligatoire mot pour mot",
            "Parce que l'ENISA gère un registre de SBOM",
            "Ce n'est pas le cas — les SBOM sont souhaitables mais non obligatoires",
          ],
          correctIndex: 0,
          explanation:
            "Le CRA n'utilise pas le mot « SBOM », mais l'Annexe I Partie I(2)(a)(v) exige l'identification et la documentation des composants. Une SBOM est la façon dont cela se fait en pratique ; sans elle, la surveillance des vulnérabilités (Partie II) ne peut pas fonctionner.",
        },
        {
          question:
            "Quel format de SBOM offre la représentation des licences la plus complète et constitue une norme ISO/IEC ?",
          options: ["CycloneDX", "SPDX", "Étiquettes SWID", "Open API"],
          correctIndex: 1,
          explanation:
            "SPDX est ISO/IEC 5962 et dispose du système d'expression de licences le plus riche de tous les formats de SBOM. CycloneDX est performant mais n'est pas une norme ISO et est davantage orienté vers le renseignement sur la sécurité.",
        },
        {
          question: "Combien de SBOM peuvent être actives à la fois pour un produit ?",
          options: [
            "Une par dépendance",
            "Une par version",
            "Exactement une — la SBOM active est la source de vérité pour le scanner et la DoC",
            "Illimité",
          ],
          correctIndex: 2,
          explanation:
            "Une seule SBOM par produit est active à la fois. Plusieurs peuvent être téléversées comme historique, mais exactement une est active pour le balayage et les besoins de documentation technique.",
        },
        {
          question:
            "Quel outil utiliseriez-vous pour générer une SBOM CycloneDX à partir d'une image Docker en cours d'exécution ?",
          options: [
            "Syft ou `docker sbom`",
            "cdxgen (génère uniquement SPDX)",
            "npm sbom (non applicable aux conteneurs)",
            "L'autorité de surveillance du marché en fournira une",
          ],
          correctIndex: 0,
          explanation:
            "Syft est l'outil de référence pour le balayage des conteneurs / systèmes de fichiers ; `docker sbom` encapsule Syft. cdxgen est polyglotte mais cible les builds à partir du code source plutôt que les images de conteneurs.",
        },
        {
          question:
            "Une CVE est publiée contre un composant présent dans notre SBOM qui a été supprimé de notre build actuel. Quelle est la bonne procédure ?",
          options: [
            "Évaluer selon CVSS et corriger dès que possible",
            "Re-téléverser une SBOM qui reflète le build actuel ; la SBOM obsolète induit le scanner en erreur",
            "Ignorer — le scanner se trompe",
            "Marquer la CVE comme faux positif au niveau global",
          ],
          correctIndex: 1,
          explanation:
            "La SBOM doit refléter la réalité. Si le composant a été supprimé, la SBOM active est obsolète — régénérer et re-téléverser. Le scanner fait son travail ; ce sont les données d'entrée qui sont incorrectes.",
        },
      ],
    },
    it: {
      title: "Fondamenti di SBOM (CycloneDX, SPDX, Allegato I)",
      summary:
        "Cos'è una SBOM, perché l'Allegato I del CRA ne richiede una, come generarne una per stack tipici e come Seentrix la trasforma in informazioni sulle vulnerabilità.",
      sections: [
        {
          heading: "Perché la SBOM è importante",
          body: (
            <p>
              L'Allegato I Parte I(2)(a)(v) ci impone di «identificare e
              documentare i componenti pertinenti». Una{" "}
              <Term id="sbom">distinta base del software</Term> è il
              modo leggibile dalle macchine per soddisfare tale requisito:
              un inventario completo di ogni dipendenza (diretta e transitiva)
              con versioni e licenze. Senza una SBOM, la scansione delle
              vulnerabilità è impossibile — non sappiamo letteralmente cosa
              contiene il nostro prodotto. Con una SBOM, ogni CVE pubblicata
              contro uno qualsiasi dei nostri componenti emerge
              automaticamente.
            </p>
          ),
        },
        {
          heading: "Scegliere un formato",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="cyclonedx">CycloneDX</Term>.
                  </strong>{" "}
                  Formato OWASP, JSON o XML. Eccellente per rappresentare le
                  relazioni di dipendenza e i risultati di sicurezza inline.
                  Molto diffuso negli strumenti di sicurezza.
                </li>
                <li>
                  <strong>
                    <Term id="spdx">SPDX</Term>.
                  </strong>{" "}
                  Linux Foundation, standardizzato ISO/IEC 5962. Rappresentazione
                  delle licenze più completa. Richiesto dagli appalti federali
                  statunitensi; buona scelta predefinita per le imprese.
                </li>
              </ul>
              <p className="mt-3">
                Seentrix accetta entrambi nativamente. Scegliere un formato
                e mantenerlo per prodotto — mescolare i formati complica il
                confronto tra le versioni.
              </p>
            </>
          ),
        },
        {
          heading: "Da dove vengono le SBOM",
          body: (
            <>
              <p>
                Generare, non scrivere a mano. Strumenti più diffusi:
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Syft</strong> (Anchore) — contenitore / file system,
                  genera CycloneDX e SPDX.
                </li>
                <li>
                  <strong>cdxgen</strong> — poliglotta e compatibile con i
                  sistemi di build, CycloneDX.
                </li>
                <li>
                  <strong>npm / pnpm / yarn</strong> — npm dispone di{" "}
                  <code>npm sbom --sbom-format cyclonedx</code> integrato
                  dalla v10.
                </li>
                <li>
                  <strong>Docker</strong> — <code>docker sbom</code>{" "}
                  (o <code>docker buildx build --sbom</code>).
                </li>
              </ul>
              <p className="mt-3">
                Caricare il file generato nella scheda SBOM. Seentrix lo
                analizza, scansiona i componenti nei database delle
                vulnerabilità e contrassegna la SBOM come <em>attiva</em>.
                Solo una SBOM per prodotto è attiva alla volta — è quella
                usata dallo scanner e quella citata dalla documentazione
                tecnica della DoC.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question: "Perché il CRA richiede di fatto una SBOM?",
          options: [
            "L'Allegato I Parte I(2)(a)(v) richiede di identificare e documentare i componenti pertinenti — una SBOM è il modo pratico",
            "L'Allegato II elenca la SBOM come deliverable obbligatorio parola per parola",
            "Perché l'ENISA gestisce un registro di SBOM",
            "Non è così — le SBOM sono auspicabili ma non obbligatorie",
          ],
          correctIndex: 0,
          explanation:
            "Il CRA non usa la parola «SBOM», ma l'Allegato I Parte I(2)(a)(v) richiede l'identificazione e la documentazione dei componenti. Una SBOM è il modo in cui ciò viene fatto nella pratica; senza di essa, il monitoraggio delle vulnerabilità (Parte II) non è operativo.",
        },
        {
          question:
            "Quale formato di SBOM ha la rappresentazione delle licenze più completa ed è uno standard ISO/IEC?",
          options: ["CycloneDX", "SPDX", "Etichette SWID", "Open API"],
          correctIndex: 1,
          explanation:
            "SPDX è ISO/IEC 5962 e dispone del sistema di espressione delle licenze più ricco tra tutti i formati di SBOM. CycloneDX è eccellente ma non è uno standard ISO ed è maggiormente orientato verso l'intelligence di sicurezza.",
        },
        {
          question: "Quante SBOM possono essere attive contemporaneamente per un prodotto?",
          options: [
            "Una per dipendenza",
            "Una per versione",
            "Esattamente una — la SBOM attiva è la fonte di verità per lo scanner e la DoC",
            "Illimitate",
          ],
          correctIndex: 2,
          explanation:
            "Solo una SBOM per prodotto è attiva alla volta. È possibile caricare più SBOM come cronologia, ma esattamente una è attiva per la scansione e per la documentazione tecnica.",
        },
        {
          question:
            "Quale strumento utilizzereste per generare una SBOM CycloneDX da un'immagine Docker in esecuzione?",
          options: [
            "Syft o `docker sbom`",
            "cdxgen (genera solo SPDX)",
            "npm sbom (non applicabile ai contenitori)",
            "L'autorità di vigilanza del mercato ne fornirà una",
          ],
          correctIndex: 0,
          explanation:
            "Syft è lo strumento di riferimento per la scansione di contenitori / file system; `docker sbom` usa Syft internamente. cdxgen è poliglotta ma è orientato verso le build dal codice sorgente piuttosto che verso le immagini di contenitori.",
        },
        {
          question:
            "Una CVE viene pubblicata contro un componente nella nostra SBOM che è stato rimosso dalla build corrente. Qual è la gestione corretta?",
          options: [
            "Valutare con CVSS e applicare la patch il prima possibile",
            "Ricaricare una SBOM che rifletta la build corrente; la SBOM obsoleta sta fuorviando lo scanner",
            "Ignorare — lo scanner è in errore",
            "Contrassegnare la CVE come falso positivo a livello globale",
          ],
          correctIndex: 1,
          explanation:
            "La SBOM deve riflettere la realtà. Se il componente è stato rimosso, la SBOM attiva è obsoleta — rigenerate e ricaricate. Lo scanner sta facendo il suo lavoro; sono i dati di input ad essere errati.",
        },
      ],
    },
  },
};

export default lesson;
