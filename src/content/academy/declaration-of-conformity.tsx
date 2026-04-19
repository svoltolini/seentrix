/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "declaration-of-conformity",
  duration: "6 min",
  requiredForRoles: ["admin", "compliance_officer"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "The Declaration of Conformity",
      summary:
        "The signed legal document that lets us place a CE-marked product on the EU market. What must be on it, who signs it, and how Seentrix auto-fills it from our data.",
      sections: [
        {
          heading: "What the DoC is and isn't",
          body: (
            <>
              <p>
                The <Term id="doc">Declaration of Conformity</Term> is our
                signed legal claim that the product meets every applicable
                EU regulation — the CRA and anything else the product
                touches (RED, EMC, Machinery, etc.). It is not a certificate
                and no authority issues it to us. We issue it. We sign it.
                We keep it for 10 years. We produce it on demand to market
                surveillance.
              </p>
              <p className="mt-3">
                The DoC must exist <em>before</em> the product is{" "}
                <Term id="placing_on_market">placed on the market</Term>.
                One unit shipped without a valid DoC is an infringement,
                even if we later back-fill the paperwork.
              </p>
            </>
          ),
        },
        {
          heading: "The seven mandatory fields",
          body: (
            <>
              <p>
                <Term id="annex_v">Annex V</Term> lists the mandatory
                content. Miss any of these and the DoC is invalid:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Manufacturer name + address + registration number
                  (Settings → Organization).
                </li>
                <li>
                  Product name, type, batch/serial identifier (Products
                  tab).
                </li>
                <li>
                  A statement that the manufacturer issues the DoC under
                  their sole responsibility (Seentrix writes this for us).
                </li>
                <li>Applied harmonised standards (EN 18031 series).</li>
                <li>
                  Conformity-assessment route (Module A, B+C, or H) and
                  notified-body details when relevant (Conformity tab).
                </li>
                <li>
                  Signatory — natural person legally authorised to sign
                  (Settings → Organization).
                </li>
                <li>Place and date of signature.</li>
              </ul>
              <p className="mt-3">
                Seentrix generates the DoC PDF from these fields. If any
                are missing the{" "}
                <strong>Issue declaration</strong> button stays disabled
                and an amber banner tells us what to fill in.
              </p>
            </>
          ),
        },
        {
          heading: "Re-issuing and keeping it current",
          body: (
            <>
              <p>
                A DoC is tied to a specific product version + conformity
                route. Significant changes require a new DoC:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>A new hardware revision.</li>
                <li>
                  A firmware/software update that materially changes
                  cybersecurity posture.
                </li>
                <li>A change in conformity route (e.g. Module A → B+C).</li>
                <li>A change in the notified body.</li>
              </ul>
              <p className="mt-3">
                Pure security updates that don't change how the product
                works don't need a new DoC — otherwise we'd be re-issuing
                weekly. Keep every historical DoC on file; the 10-year
                retention starts from the last unit placed on the market,
                not from the DoC's issue date.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Who issues the Declaration of Conformity for our product?",
          options: [
            "The notified body",
            "The European Commission",
            "We do — as manufacturer, under our sole responsibility",
            "Our market surveillance authority",
          ],
          correctIndex: 2,
          explanation:
            "The DoC is self-issued by the manufacturer under their sole responsibility. No authority issues it to us. Notified bodies issue their own certificates, which feed into our DoC but aren't the DoC itself.",
        },
        {
          question:
            "How long must we keep each Declaration of Conformity on file?",
          options: [
            "2 years from issue",
            "5 years from issue",
            "10 years from the last unit of that product being placed on the market",
            "For the entire support period",
          ],
          correctIndex: 2,
          explanation:
            "The 10-year retention runs from the last unit placed on the market, not from issue date. A product sold for 5 years and then discontinued means DoC retention runs 10 years AFTER the final sale = 15 years from first issue in that scenario.",
        },
        {
          question:
            "Which of these changes requires a new DoC?",
          options: [
            "A routine security patch that fixes a CVE without changing product behaviour",
            "A new hardware revision",
            "A UI cosmetic update in the mobile app",
            "Adding a new language to the user manual",
          ],
          correctIndex: 1,
          explanation:
            "A new hardware revision is a new product and needs a new DoC. Pure security patches and cosmetic changes don't materially alter conformity and don't require re-issuance.",
        },
        {
          question:
            "Our public contact email field on Settings → Organization is blank. What happens when we try to issue the DoC?",
          options: [
            "Seentrix issues the DoC with a blank contact field",
            "The Issue button stays disabled until the field is filled",
            "The DoC is issued but flagged as incomplete",
            "A fallback email is auto-generated",
          ],
          correctIndex: 1,
          explanation:
            "The Issue button is gated by DOC_REQUIRED_ORG_FIELDS — every mandatory Annex V item must be filled in first. The amber banner tells us what's missing.",
        },
        {
          question:
            "What's printed as “place” on the signed DoC?",
          options: [
            "The city of our registered address (Settings → Organization → City)",
            "The country the product is being sold in",
            "The manufacturer's warehouse",
            "The notified body's office",
          ],
          correctIndex: 0,
          explanation:
            "The place field on the DoC is where the signatory signed it. Seentrix uses our registered city from Settings → Organization.",
        },
      ],
    },
    de: {
      title: "Die Konformitätserklärung",
      summary:
        "Das unterzeichnete Rechtsdokument, mit dem wir ein CE-gekennzeichnetes Produkt auf den EU-Markt bringen. Was drin stehen muss, wer unterschreibt und wie Seentrix alles automatisch befüllt.",
      sections: [
        {
          heading: "Was die DoC ist und nicht ist",
          body: (
            <>
              <p>
                Die <Term id="doc">Konformitätserklärung</Term> ist unsere
                unterzeichnete Rechtsaussage, dass das Produkt alle
                einschlägigen EU-Verordnungen erfüllt — den CRA und alles
                andere, was zutrifft (RED, EMV, Maschinen usw.). Sie ist
                kein Zertifikat und keine Behörde stellt sie uns aus. Wir
                stellen sie aus. Wir unterschreiben sie. Wir bewahren sie
                10 Jahre auf. Wir legen sie der Marktüberwachung auf
                Anfrage vor.
              </p>
              <p className="mt-3">
                Die DoC muss <em>vor</em> dem{" "}
                <Term id="placing_on_market">Inverkehrbringen</Term>{" "}
                existieren. Ein Gerät ohne gültige DoC auszuliefern ist ein
                Verstoß, auch wenn die Unterlagen später nachgereicht
                werden.
              </p>
            </>
          ),
        },
        {
          heading: "Die sieben Pflichtfelder",
          body: (
            <>
              <p>
                <Term id="annex_v">Anhang V</Term> listet den Pflichtinhalt.
                Fehlt eines, ist die DoC ungültig:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Herstellername + Adresse + Registrierungsnummer
                  (Einstellungen → Organisation).
                </li>
                <li>
                  Produktname, Typ, Chargen-/Seriennummer (Tab Produkte).
                </li>
                <li>
                  Erklärung, dass der Hersteller die DoC in alleiniger
                  Verantwortung ausstellt (Seentrix formuliert das für
                  uns).
                </li>
                <li>
                  Angewandte harmonisierte Normen (EN-18031-Serie).
                </li>
                <li>
                  Konformitätsbewertungs-Route (Modul A, B+C oder H) und
                  Angaben zur notifizierten Stelle (Tab Konformität).
                </li>
                <li>
                  Unterzeichner — natürliche Person mit Zeichnungsbefugnis
                  (Einstellungen → Organisation).
                </li>
                <li>Ort und Datum der Unterschrift.</li>
              </ul>
              <p className="mt-3">
                Seentrix erzeugt die DoC-PDF aus diesen Feldern. Fehlt
                eines, bleibt der Button <strong>Erklärung ausstellen</strong>{" "}
                deaktiviert und ein amberfarbener Banner zeigt, was noch
                auszufüllen ist.
              </p>
            </>
          ),
        },
        {
          heading: "Neu ausstellen und aktuell halten",
          body: (
            <>
              <p>
                Eine DoC ist an eine bestimmte Produktversion und
                Konformitätsroute gebunden. Wesentliche Änderungen
                erfordern eine neue DoC:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>Neue Hardware-Revision.</li>
                <li>
                  Firmware-/Software-Update mit wesentlicher Auswirkung auf
                  die Cybersicherheit.
                </li>
                <li>
                  Wechsel der Konformitätsroute (z. B. Modul A → B+C).
                </li>
                <li>Wechsel der notifizierten Stelle.</li>
              </ul>
              <p className="mt-3">
                Reine Sicherheitsupdates, die die Funktionsweise nicht
                ändern, erfordern keine neue DoC — sonst müssten wir
                wöchentlich neu ausstellen. Jede historische DoC
                aufbewahren; die 10-Jahres-Frist beginnt ab dem letzten
                verkauften Gerät dieses Produkts, nicht ab dem
                Ausstellungsdatum.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Wer stellt die Konformitätserklärung für unser Produkt aus?",
          options: [
            "Die notifizierte Stelle",
            "Die Europäische Kommission",
            "Wir — als Hersteller, in alleiniger Verantwortung",
            "Unsere Marktüberwachungsbehörde",
          ],
          correctIndex: 2,
          explanation:
            "Die DoC wird vom Hersteller selbst in alleiniger Verantwortung ausgestellt. Keine Behörde stellt sie uns aus. Notifizierte Stellen stellen eigene Zertifikate aus, die in unsere DoC einfließen, aber nicht die DoC selbst sind.",
        },
        {
          question:
            "Wie lange müssen wir jede Konformitätserklärung aufbewahren?",
          options: [
            "2 Jahre ab Ausstellung",
            "5 Jahre ab Ausstellung",
            "10 Jahre ab dem letzten in Verkehr gebrachten Gerät dieses Produkts",
            "Für den gesamten Support-Zeitraum",
          ],
          correctIndex: 2,
          explanation:
            "Die 10-Jahres-Frist beginnt mit dem letzten in Verkehr gebrachten Gerät, nicht mit dem Ausstellungsdatum. Ein 5 Jahre lang verkauftes, dann eingestelltes Produkt bedeutet 10 Jahre Aufbewahrung NACH dem letzten Verkauf = 15 Jahre ab erster Ausstellung.",
        },
        {
          question: "Welche dieser Änderungen erfordert eine neue DoC?",
          options: [
            "Ein Routine-Sicherheitspatch, der eine CVE behebt, ohne das Produktverhalten zu ändern",
            "Eine neue Hardware-Revision",
            "Ein kosmetisches UI-Update in der Mobile-App",
            "Eine zusätzliche Sprache im Benutzerhandbuch",
          ],
          correctIndex: 1,
          explanation:
            "Eine neue Hardware-Revision ist ein neues Produkt und benötigt eine neue DoC. Reine Sicherheitspatches und kosmetische Änderungen ändern die Konformität nicht wesentlich.",
        },
        {
          question:
            "Unser Feld „Öffentliche Kontakt-E-Mail“ unter Einstellungen → Organisation ist leer. Was passiert beim Ausstellen der DoC?",
          options: [
            "Seentrix stellt die DoC mit leerem Kontaktfeld aus",
            "Der Button bleibt deaktiviert, bis das Feld ausgefüllt ist",
            "Die DoC wird ausgestellt, aber als unvollständig markiert",
            "Eine Fallback-E-Mail wird automatisch erzeugt",
          ],
          correctIndex: 1,
          explanation:
            "Der Button ist durch DOC_REQUIRED_ORG_FIELDS gegatet — jedes Pflichtfeld nach Anhang V muss ausgefüllt sein. Der amberfarbene Banner zeigt, was fehlt.",
        },
        {
          question:
            "Was wird als „Ort“ auf der unterzeichneten DoC gedruckt?",
          options: [
            "Die Stadt unserer eingetragenen Adresse (Einstellungen → Organisation → Stadt)",
            "Das Land, in dem das Produkt verkauft wird",
            "Das Lager des Herstellers",
            "Der Standort der notifizierten Stelle",
          ],
          correctIndex: 0,
          explanation:
            "Das Ort-Feld benennt den Ort der Unterschrift. Seentrix nutzt unsere eingetragene Stadt aus Einstellungen → Organisation.",
        },
      ],
    },
  },
};

export default lesson;
