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
    fr: {
      title: "La déclaration de conformité",
      summary:
        "Le document juridique signé qui nous permet de mettre un produit marqué CE sur le marché de l'UE. Ce qu'il doit contenir, qui le signe et comment Seentrix le pré-remplit à partir de nos données.",
      sections: [
        {
          heading: "Ce qu'est et n'est pas la DoC",
          body: (
            <>
              <p>
                La <Term id="doc">déclaration de conformité</Term> est notre
                affirmation juridique signée que le produit satisfait à toutes
                les réglementations UE applicables — le CRA et tout ce qui
                concerne le produit (RED, CEM, Machines, etc.). Ce n'est pas
                un certificat et aucune autorité ne nous le délivre. C'est
                nous qui l'émettons. C'est nous qui le signons. Nous le
                conservons pendant 10 ans. Nous le produisons sur demande à
                l'autorité de surveillance du marché.
              </p>
              <p className="mt-3">
                La DoC doit exister <em>avant</em> que le produit soit{" "}
                <Term id="placing_on_market">mis sur le marché</Term>.
                Livrer une seule unité sans DoC valide constitue une
                infraction, même si les documents sont fournis ultérieurement.
              </p>
            </>
          ),
        },
        {
          heading: "Les sept champs obligatoires",
          body: (
            <>
              <p>
                <Term id="annex_v">L'Annexe V</Term> énumère le contenu
                obligatoire. L'omission d'un seul de ces éléments rend la
                DoC invalide :
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Nom + adresse + numéro d'enregistrement du fabricant
                  (Paramètres → Organisation).
                </li>
                <li>
                  Nom du produit, type, identifiant de lot/numéro de série
                  (onglet Produits).
                </li>
                <li>
                  Une déclaration indiquant que le fabricant émet la DoC sous
                  sa seule responsabilité (Seentrix le rédige pour nous).
                </li>
                <li>Normes harmonisées appliquées (série EN 18031).</li>
                <li>
                  Procédure d'évaluation de la conformité (Module A, B+C ou H)
                  et détails de l'organisme notifié le cas échéant (onglet
                  Conformité).
                </li>
                <li>
                  Signataire — personne physique légalement habilitée à signer
                  (Paramètres → Organisation).
                </li>
                <li>Lieu et date de signature.</li>
              </ul>
              <p className="mt-3">
                Seentrix génère le PDF de la DoC à partir de ces champs. Si
                l'un d'eux est manquant, le bouton{" "}
                <strong>Émettre la déclaration</strong> reste désactivé
                et une bannière orange indique ce qu'il reste à renseigner.
              </p>
            </>
          ),
        },
        {
          heading: "Réémettre et maintenir à jour",
          body: (
            <>
              <p>
                Une DoC est liée à une version de produit et à une procédure
                de conformité spécifiques. Des modifications significatives
                nécessitent une nouvelle DoC :
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>Une nouvelle révision matérielle.</li>
                <li>
                  Une mise à jour firmware/logicielle qui modifie
                  substantiellement la posture de cybersécurité.
                </li>
                <li>
                  Un changement de procédure de conformité (ex. Module A → B+C).
                </li>
                <li>Un changement d'organisme notifié.</li>
              </ul>
              <p className="mt-3">
                Les mises à jour de sécurité pures qui ne modifient pas le
                fonctionnement du produit ne nécessitent pas de nouvelle
                DoC — sinon nous en émettrions une chaque semaine. Conserver
                chaque DoC historique ; la période de conservation de 10 ans
                commence à compter de la dernière unité mise sur le marché,
                et non à compter de la date d'émission de la DoC.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Qui émet la déclaration de conformité pour notre produit ?",
          options: [
            "L'organisme notifié",
            "La Commission européenne",
            "Nous — en tant que fabricant, sous notre seule responsabilité",
            "Notre autorité de surveillance du marché",
          ],
          correctIndex: 2,
          explanation:
            "La DoC est émise par le fabricant lui-même sous sa seule responsabilité. Aucune autorité ne nous la délivre. Les organismes notifiés délivrent leurs propres certificats, qui alimentent notre DoC mais ne constituent pas la DoC elle-même.",
        },
        {
          question:
            "Combien de temps devons-nous conserver chaque déclaration de conformité ?",
          options: [
            "2 ans à compter de l'émission",
            "5 ans à compter de l'émission",
            "10 ans à compter de la dernière unité de ce produit mise sur le marché",
            "Pendant toute la période de support",
          ],
          correctIndex: 2,
          explanation:
            "La période de conservation de 10 ans court à compter de la dernière unité mise sur le marché, et non à compter de la date d'émission. Un produit vendu pendant 5 ans puis retiré implique une conservation de 10 ans APRÈS la dernière vente, soit 15 ans à compter de la première émission dans ce scénario.",
        },
        {
          question:
            "Laquelle de ces modifications nécessite une nouvelle DoC ?",
          options: [
            "Un correctif de sécurité de routine qui résout une CVE sans modifier le comportement du produit",
            "Une nouvelle révision matérielle",
            "Une mise à jour cosmétique de l'interface dans l'application mobile",
            "L'ajout d'une nouvelle langue dans le manuel d'utilisation",
          ],
          correctIndex: 1,
          explanation:
            "Une nouvelle révision matérielle constitue un nouveau produit et nécessite une nouvelle DoC. Les correctifs de sécurité purs et les modifications cosmétiques ne modifient pas substantiellement la conformité et ne nécessitent pas de réémission.",
        },
        {
          question:
            "Notre champ d'adresse e-mail de contact public sous Paramètres → Organisation est vide. Que se passe-t-il lorsque nous tentons d'émettre la DoC ?",
          options: [
            "Seentrix émet la DoC avec le champ de contact vide",
            "Le bouton Émettre reste désactivé jusqu'à ce que le champ soit renseigné",
            "La DoC est émise mais signalée comme incomplète",
            "Un e-mail de substitution est généré automatiquement",
          ],
          correctIndex: 1,
          explanation:
            "Le bouton est conditionné par DOC_REQUIRED_ORG_FIELDS — chaque élément obligatoire de l'Annexe V doit être renseigné au préalable. La bannière orange indique ce qui manque.",
        },
        {
          question:
            "Qu'est-ce qui est imprimé comme « lieu » sur la DoC signée ?",
          options: [
            "La ville de notre adresse enregistrée (Paramètres → Organisation → Ville)",
            "Le pays dans lequel le produit est vendu",
            "L'entrepôt du fabricant",
            "Le bureau de l'organisme notifié",
          ],
          correctIndex: 0,
          explanation:
            "Le champ lieu sur la DoC indique l'endroit où le signataire l'a signée. Seentrix utilise notre ville enregistrée dans Paramètres → Organisation.",
        },
      ],
    },
    it: {
      title: "La dichiarazione di conformità",
      summary:
        "Il documento giuridico firmato che ci consente di immettere sul mercato UE un prodotto con marcatura CE. Cosa deve contenere, chi lo firma e come Seentrix lo compila automaticamente dai nostri dati.",
      sections: [
        {
          heading: "Cosa è e cosa non è la DoC",
          body: (
            <>
              <p>
                La <Term id="doc">dichiarazione di conformità</Term> è la
                nostra affermazione giuridica firmata che il prodotto soddisfa
                tutti i regolamenti UE applicabili — il CRA e tutto ciò che
                riguarda il prodotto (RED, CEM, Macchine, ecc.). Non è un
                certificato e nessuna autorità ce lo rilascia. Siamo noi a
                emetterla. Siamo noi a firmarla. La conserviamo per 10 anni.
                La produciamo su richiesta all'autorità di vigilanza del
                mercato.
              </p>
              <p className="mt-3">
                La DoC deve esistere <em>prima</em> che il prodotto sia{" "}
                <Term id="placing_on_market">immesso sul mercato</Term>.
                Spedire anche una sola unità senza una DoC valida costituisce
                un'infrazione, anche se la documentazione viene completata
                successivamente.
              </p>
            </>
          ),
        },
        {
          heading: "I sette campi obbligatori",
          body: (
            <>
              <p>
                <Term id="annex_v">L'Allegato V</Term> elenca il contenuto
                obbligatorio. L'omissione di uno qualsiasi di questi elementi
                rende la DoC invalida:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Nome + indirizzo + numero di registrazione del fabbricante
                  (Impostazioni → Organizzazione).
                </li>
                <li>
                  Nome del prodotto, tipo, identificativo del lotto/numero di
                  serie (scheda Prodotti).
                </li>
                <li>
                  Una dichiarazione che il fabbricante emette la DoC sotto la
                  propria esclusiva responsabilità (Seentrix la redige per noi).
                </li>
                <li>Norme armonizzate applicate (serie EN 18031).</li>
                <li>
                  Procedura di valutazione della conformità (Modulo A, B+C o H)
                  e dettagli dell'organismo notificato ove pertinente (scheda
                  Conformità).
                </li>
                <li>
                  Firmatario — persona fisica legalmente autorizzata a firmare
                  (Impostazioni → Organizzazione).
                </li>
                <li>Luogo e data della firma.</li>
              </ul>
              <p className="mt-3">
                Seentrix genera il PDF della DoC da questi campi. Se uno di
                essi è mancante, il pulsante{" "}
                <strong>Emetti dichiarazione</strong> rimane disabilitato
                e un banner arancione indica cosa manca da compilare.
              </p>
            </>
          ),
        },
        {
          heading: "Riemettere e mantenere aggiornata",
          body: (
            <>
              <p>
                Una DoC è legata a una specifica versione del prodotto e a
                una procedura di conformità. Modifiche significative richiedono
                una nuova DoC:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>Una nuova revisione hardware.</li>
                <li>
                  Un aggiornamento firmware/software che modifica
                  sostanzialmente la postura di cibersicurezza.
                </li>
                <li>
                  Un cambio di procedura di conformità (es. Modulo A → B+C).
                </li>
                <li>Un cambio di organismo notificato.</li>
              </ul>
              <p className="mt-3">
                Gli aggiornamenti di sicurezza puri che non modificano il
                funzionamento del prodotto non richiedono una nuova DoC —
                altrimenti la riemetteremmo ogni settimana. Conservare ogni
                DoC storica; i 10 anni di conservazione decorrono dall'ultima
                unità immessa sul mercato, non dalla data di emissione della
                DoC.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Chi emette la dichiarazione di conformità per il nostro prodotto?",
          options: [
            "L'organismo notificato",
            "La Commissione europea",
            "Noi — in quanto fabbricante, sotto la nostra esclusiva responsabilità",
            "La nostra autorità di vigilanza del mercato",
          ],
          correctIndex: 2,
          explanation:
            "La DoC è emessa dal fabbricante stesso sotto la propria esclusiva responsabilità. Nessuna autorità ce la rilascia. Gli organismi notificati rilasciano i propri certificati, che confluiscono nella nostra DoC ma non costituiscono la DoC stessa.",
        },
        {
          question:
            "Per quanto tempo dobbiamo conservare ogni dichiarazione di conformità?",
          options: [
            "2 anni dall'emissione",
            "5 anni dall'emissione",
            "10 anni dall'ultima unità di quel prodotto immessa sul mercato",
            "Per l'intero periodo di supporto",
          ],
          correctIndex: 2,
          explanation:
            "I 10 anni di conservazione decorrono dall'ultima unità immessa sul mercato, non dalla data di emissione. Un prodotto venduto per 5 anni e poi ritirato implica una conservazione di 10 anni DOPO l'ultima vendita, ovvero 15 anni dalla prima emissione in tale scenario.",
        },
        {
          question:
            "Quale di queste modifiche richiede una nuova DoC?",
          options: [
            "Una patch di sicurezza ordinaria che corregge una CVE senza modificare il comportamento del prodotto",
            "Una nuova revisione hardware",
            "Un aggiornamento cosmetico dell'interfaccia nell'app mobile",
            "L'aggiunta di una nuova lingua nel manuale utente",
          ],
          correctIndex: 1,
          explanation:
            "Una nuova revisione hardware costituisce un nuovo prodotto e richiede una nuova DoC. Le patch di sicurezza pure e le modifiche cosmetiche non alterano sostanzialmente la conformità e non richiedono la riemissione.",
        },
        {
          question:
            "Il campo dell'indirizzo e-mail di contatto pubblico in Impostazioni → Organizzazione è vuoto. Cosa accade quando proviamo a emettere la DoC?",
          options: [
            "Seentrix emette la DoC con il campo contatto vuoto",
            "Il pulsante Emetti rimane disabilitato finché il campo non viene compilato",
            "La DoC viene emessa ma contrassegnata come incompleta",
            "Viene generato automaticamente un indirizzo e-mail alternativo",
          ],
          correctIndex: 1,
          explanation:
            "Il pulsante è condizionato da DOC_REQUIRED_ORG_FIELDS — ogni campo obbligatorio dell'Allegato V deve essere compilato prima. Il banner arancione indica cosa manca.",
        },
        {
          question:
            "Cosa viene stampato come «luogo» sulla DoC firmata?",
          options: [
            "La città del nostro indirizzo registrato (Impostazioni → Organizzazione → Città)",
            "Il paese in cui il prodotto viene venduto",
            "Il magazzino del fabbricante",
            "La sede dell'organismo notificato",
          ],
          correctIndex: 0,
          explanation:
            "Il campo luogo sulla DoC indica il luogo in cui il firmatario l'ha firmata. Seentrix utilizza la nostra città registrata in Impostazioni → Organizzazione.",
        },
      ],
    },
  },
};

export default lesson;
