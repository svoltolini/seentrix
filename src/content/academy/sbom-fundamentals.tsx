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
  },
};

export default lesson;
