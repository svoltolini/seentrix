/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "ce-marking-and-simplified-doc",
  duration: "7 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["declaration-of-conformity"],
  i18n: {
    en: {
      title: "CE marking & the simplified Declaration of Conformity",
      summary:
        "Where and when the CE marking is affixed, what it signifies, and how the Annex VI simplified DoC + its public URL work.",
      sections: [
        {
          heading: "What the CE marking means — and where it goes",
          body: (
            <p>
              The <Term id="ce_marking">CE marking</Term> is the manufacturer's
              declaration that the product conforms with the CRA and any other
              applicable Union legislation. It is affixed{" "}
              <strong>visibly, legibly and indelibly to the product before it is
              placed on the market</strong>; where the product's nature doesn't
              allow that, it goes on the packaging and in the accompanying
              documents. Record where you applied it — product, packaging,
              documentation, or website.
            </p>
          ),
        },
        {
          heading: "The simplified DoC (Annex VI)",
          body: (
            <p>
              You don't always print the full <Term id="doc">Declaration of
              Conformity</Term> on the box. <Term id="annex_vi">Annex VI</Term>{" "}
              lets you provide a <em>simplified</em> declaration — the product,
              the manufacturer, and a statement that the full EU declaration of
              conformity is available at a given internet address. That address
              is what you print; it must resolve to a page where the declaration
              is actually reachable.
            </p>
          ),
        },
        {
          heading: "How Seentrix records it",
          body: (
            <p>
              On the product's <strong>Identity & CE</strong> tab you log the CE
              affixing record (where + when) and toggle a public{" "}
              <strong>simplified DoC URL</strong> (
              <code>/doc/&lt;org-slug&gt;/&lt;product-id&gt;</code>) once your org
              has enabled public pages. That URL is the address you print on the
              product or packaging — it serves the simplified declaration to
              anyone, no login required.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Where is the CE marking affixed?",
          options: [
            "Only in the user manual",
            "Visibly on the product; on the packaging + documents where the product can't carry it",
            "Only on the manufacturer's website",
            "Nowhere — it is purely a database entry",
          ],
          correctIndex: 1,
          explanation:
            "The CE marking goes visibly, legibly and indelibly on the product; where that isn't possible it goes on the packaging and accompanying documents.",
        },
        {
          question: "What does the CE marking signify?",
          options: [
            "That the product passed a speed test",
            "Conformity with the CRA and other applicable Union legislation",
            "That a notified body owns the product",
            "That the product is open-source",
          ],
          correctIndex: 1,
          explanation:
            "The CE marking expresses the manufacturer's declaration of conformity with the CRA and any other applicable Union legislation.",
        },
        {
          question: "What is a simplified Declaration of Conformity (Annex VI)?",
          options: [
            "A DoC with the manufacturer name removed",
            "A short form stating the full DoC is available at a given internet address",
            "A DoC that needs no signature",
            "An internal draft never shown to users",
          ],
          correctIndex: 1,
          explanation:
            "Annex VI's simplified DoC names the product + manufacturer and points to the internet address where the full declaration is available.",
        },
        {
          question: "When must the CE marking be affixed?",
          options: [
            "After the first year on sale",
            "Before the product is placed on the market",
            "Only if a customer asks",
            "When the support period ends",
          ],
          correctIndex: 1,
          explanation:
            "The CE marking is affixed before the product is placed on the market.",
        },
        {
          question: "Where does Seentrix publish the simplified DoC?",
          options: [
            "Nowhere — it only prints a PDF",
            "At a public URL once the org enables public pages",
            "Only inside the authenticated app",
            "On the European Commission's website",
          ],
          correctIndex: 1,
          explanation:
            "Publishing on the Identity & CE tab exposes a public /doc/<org-slug>/<product-id> URL (requires the org to have public pages enabled).",
        },
      ],
    },
    de: {
      title: "CE-Kennzeichnung & die vereinfachte Konformitätserklärung",
      summary:
        "Wo und wann die CE-Kennzeichnung angebracht wird, was sie bedeutet und wie die vereinfachte Erklärung nach Anhang VI samt öffentlicher URL funktioniert.",
      sections: [
        {
          heading: "Was die CE-Kennzeichnung bedeutet — und wohin sie kommt",
          body: (
            <p>
              Die <Term id="ce_marking">CE-Kennzeichnung</Term> ist die Erklärung
              des Herstellers, dass das Produkt dem CRA und sonstigem anwendbaren
              Unionsrecht entspricht. Sie wird{" "}
              <strong>sichtbar, lesbar und dauerhaft vor dem Inverkehrbringen am
              Produkt angebracht</strong>; lässt die Art des Produkts dies nicht
              zu, erfolgt sie auf der Verpackung und in den Begleitunterlagen.
              Halten Sie fest, wo Sie sie angebracht haben — Produkt, Verpackung,
              Dokumentation oder Website.
            </p>
          ),
        },
        {
          heading: "Die vereinfachte Konformitätserklärung (Anhang VI)",
          body: (
            <p>
              Sie drucken nicht immer die vollständige{" "}
              <Term id="doc">Konformitätserklärung</Term> auf die Verpackung.{" "}
              <Term id="annex_vi">Anhang VI</Term> erlaubt eine{" "}
              <em>vereinfachte</em> Erklärung — Produkt, Hersteller und die
              Angabe, dass die vollständige EU-Konformitätserklärung unter einer
              bestimmten Internetadresse verfügbar ist. Diese Adresse drucken Sie
              auf; sie muss zu einer Seite führen, auf der die Erklärung
              tatsächlich erreichbar ist.
            </p>
          ),
        },
        {
          heading: "Wie Seentrix es erfasst",
          body: (
            <p>
              Auf dem Reiter <strong>Identität & CE</strong> erfassen Sie den
              CE-Anbringungsnachweis (wo + wann) und schalten eine öffentliche{" "}
              <strong>URL der vereinfachten Konformitätserklärung</strong> frei (
              <code>/doc/&lt;org-slug&gt;/&lt;product-id&gt;</code>), sobald Ihre
              Organisation öffentliche Seiten aktiviert hat. Diese URL ist die
              Adresse, die Sie auf Produkt oder Verpackung drucken — sie liefert
              die vereinfachte Erklärung an jeden, ohne Anmeldung.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Wo wird die CE-Kennzeichnung angebracht?",
          options: [
            "Nur im Benutzerhandbuch",
            "Sichtbar am Produkt; auf Verpackung + Unterlagen, wenn das Produkt sie nicht tragen kann",
            "Nur auf der Website des Herstellers",
            "Nirgendwo — sie ist nur ein Datenbankeintrag",
          ],
          correctIndex: 1,
          explanation:
            "Die CE-Kennzeichnung wird sichtbar, lesbar und dauerhaft am Produkt angebracht; ist das nicht möglich, auf Verpackung und Begleitunterlagen.",
        },
        {
          question: "Was bedeutet die CE-Kennzeichnung?",
          options: [
            "Dass das Produkt einen Geschwindigkeitstest bestanden hat",
            "Konformität mit dem CRA und sonstigem anwendbaren Unionsrecht",
            "Dass eine notifizierte Stelle das Produkt besitzt",
            "Dass das Produkt Open Source ist",
          ],
          correctIndex: 1,
          explanation:
            "Die CE-Kennzeichnung drückt die Konformitätserklärung des Herstellers mit dem CRA und sonstigem anwendbaren Unionsrecht aus.",
        },
        {
          question:
            "Was ist eine vereinfachte Konformitätserklärung (Anhang VI)?",
          options: [
            "Eine Erklärung ohne Herstellernamen",
            "Eine Kurzform mit dem Hinweis, dass die vollständige Erklärung unter einer Internetadresse verfügbar ist",
            "Eine Erklärung ohne Unterschrift",
            "Ein interner Entwurf, der Nutzern nie gezeigt wird",
          ],
          correctIndex: 1,
          explanation:
            "Die vereinfachte Erklärung nach Anhang VI nennt Produkt + Hersteller und verweist auf die Internetadresse, unter der die vollständige Erklärung verfügbar ist.",
        },
        {
          question: "Wann muss die CE-Kennzeichnung angebracht werden?",
          options: [
            "Nach dem ersten Verkaufsjahr",
            "Vor dem Inverkehrbringen des Produkts",
            "Nur auf Kundenwunsch",
            "Wenn der Supportzeitraum endet",
          ],
          correctIndex: 1,
          explanation:
            "Die CE-Kennzeichnung wird vor dem Inverkehrbringen angebracht.",
        },
        {
          question: "Wo veröffentlicht Seentrix die vereinfachte Erklärung?",
          options: [
            "Nirgendwo — es erzeugt nur ein PDF",
            "Unter einer öffentlichen URL, sobald die Organisation öffentliche Seiten aktiviert",
            "Nur innerhalb der angemeldeten App",
            "Auf der Website der Europäischen Kommission",
          ],
          correctIndex: 1,
          explanation:
            "Das Veröffentlichen auf dem Reiter Identität & CE gibt eine öffentliche /doc/<org-slug>/<product-id>-URL frei (erfordert aktivierte öffentliche Seiten).",
        },
      ],
    },
    fr: {
      title: "Marquage CE & déclaration de conformité simplifiée",
      summary:
        "Où et quand le marquage CE est apposé, ce qu'il signifie, et comment fonctionne la DoC simplifiée de l'annexe VI avec son URL publique.",
      sections: [
        {
          heading: "Ce que signifie le marquage CE — et où il va",
          body: (
            <p>
              Le <Term id="ce_marking">marquage CE</Term> est la déclaration du
              fabricant attestant que le produit est conforme au CRA et à toute
              autre législation de l'Union applicable. Il est apposé{" "}
              <strong>de façon visible, lisible et indélébile sur le produit
              avant sa mise sur le marché</strong> ; lorsque la nature du produit
              ne le permet pas, il figure sur l'emballage et dans les documents
              d'accompagnement. Notez où vous l'avez apposé — produit, emballage,
              documentation ou site web.
            </p>
          ),
        },
        {
          heading: "La DoC simplifiée (annexe VI)",
          body: (
            <p>
              Vous n'imprimez pas toujours la{" "}
              <Term id="doc">déclaration de conformité</Term> complète sur la
              boîte. L'<Term id="annex_vi">annexe VI</Term> permet une déclaration{" "}
              <em>simplifiée</em> — le produit, le fabricant et une mention
              indiquant que la déclaration UE de conformité complète est
              disponible à une adresse internet donnée. C'est cette adresse que
              vous imprimez ; elle doit mener à une page où la déclaration est
              réellement accessible.
            </p>
          ),
        },
        {
          heading: "Comment Seentrix l'enregistre",
          body: (
            <p>
              Sur l'onglet <strong>Identité & CE</strong> du produit, vous
              enregistrez l'apposition CE (où + quand) et activez une{" "}
              <strong>URL publique de DoC simplifiée</strong> (
              <code>/doc/&lt;org-slug&gt;/&lt;product-id&gt;</code>) dès que votre
              organisation a activé les pages publiques. Cette URL est l'adresse
              que vous imprimez sur le produit ou l'emballage — elle sert la
              déclaration simplifiée à tous, sans connexion.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Où le marquage CE est-il apposé ?",
          options: [
            "Uniquement dans le manuel d'utilisation",
            "Visiblement sur le produit ; sur l'emballage + documents si le produit ne peut le porter",
            "Uniquement sur le site web du fabricant",
            "Nulle part — c'est une simple entrée de base de données",
          ],
          correctIndex: 1,
          explanation:
            "Le marquage CE est apposé de façon visible, lisible et indélébile sur le produit ; sinon sur l'emballage et les documents d'accompagnement.",
        },
        {
          question: "Que signifie le marquage CE ?",
          options: [
            "Que le produit a réussi un test de vitesse",
            "La conformité au CRA et à toute autre législation de l'Union applicable",
            "Qu'un organisme notifié possède le produit",
            "Que le produit est open source",
          ],
          correctIndex: 1,
          explanation:
            "Le marquage CE exprime la déclaration de conformité du fabricant au CRA et à toute autre législation de l'Union applicable.",
        },
        {
          question: "Qu'est-ce qu'une déclaration de conformité simplifiée (annexe VI) ?",
          options: [
            "Une DoC sans le nom du fabricant",
            "Une version courte indiquant que la DoC complète est disponible à une adresse internet",
            "Une DoC sans signature",
            "Un brouillon interne jamais montré aux utilisateurs",
          ],
          correctIndex: 1,
          explanation:
            "La DoC simplifiée de l'annexe VI nomme le produit + le fabricant et renvoie à l'adresse internet où la déclaration complète est disponible.",
        },
        {
          question: "Quand le marquage CE doit-il être apposé ?",
          options: [
            "Après la première année de vente",
            "Avant la mise sur le marché du produit",
            "Seulement si un client le demande",
            "Quand la période de support se termine",
          ],
          correctIndex: 1,
          explanation:
            "Le marquage CE est apposé avant la mise sur le marché du produit.",
        },
        {
          question: "Où Seentrix publie-t-il la DoC simplifiée ?",
          options: [
            "Nulle part — il génère seulement un PDF",
            "À une URL publique dès que l'organisation active les pages publiques",
            "Uniquement dans l'application authentifiée",
            "Sur le site de la Commission européenne",
          ],
          correctIndex: 1,
          explanation:
            "La publication sur l'onglet Identité & CE expose une URL publique /doc/<org-slug>/<product-id> (nécessite des pages publiques activées).",
        },
      ],
    },
    it: {
      title: "Marcatura CE & dichiarazione di conformità semplificata",
      summary:
        "Dove e quando si appone la marcatura CE, cosa significa e come funziona la DoC semplificata dell'allegato VI con il suo URL pubblico.",
      sections: [
        {
          heading: "Cosa significa la marcatura CE — e dove va",
          body: (
            <p>
              La <Term id="ce_marking">marcatura CE</Term> è la dichiarazione del
              fabbricante che il prodotto è conforme al CRA e ad altra
              legislazione dell'Unione applicabile. È apposta{" "}
              <strong>in modo visibile, leggibile e indelebile sul prodotto prima
              dell'immissione sul mercato</strong>; quando la natura del prodotto
              non lo consente, è apposta sull'imballaggio e nei documenti di
              accompagnamento. Registra dove l'hai apposta — prodotto,
              imballaggio, documentazione o sito web.
            </p>
          ),
        },
        {
          heading: "La DoC semplificata (allegato VI)",
          body: (
            <p>
              Non sempre stampi la{" "}
              <Term id="doc">dichiarazione di conformità</Term> completa sulla
              confezione. L'<Term id="annex_vi">allegato VI</Term> consente una
              dichiarazione <em>semplificata</em> — il prodotto, il fabbricante e
              una dichiarazione che la dichiarazione di conformità UE completa è
              disponibile a un determinato indirizzo internet. È quell'indirizzo
              che stampi; deve portare a una pagina in cui la dichiarazione è
              effettivamente raggiungibile.
            </p>
          ),
        },
        {
          heading: "Come Seentrix la registra",
          body: (
            <p>
              Nella scheda <strong>Identità & CE</strong> del prodotto registri
              l'apposizione CE (dove + quando) e attivi un{" "}
              <strong>URL pubblico della DoC semplificata</strong> (
              <code>/doc/&lt;org-slug&gt;/&lt;product-id&gt;</code>) una volta che
              la tua organizzazione ha abilitato le pagine pubbliche. Quell'URL è
              l'indirizzo che stampi sul prodotto o sull'imballaggio — serve la
              dichiarazione semplificata a chiunque, senza login.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Dove è apposta la marcatura CE?",
          options: [
            "Solo nel manuale d'uso",
            "Visibilmente sul prodotto; su imballaggio + documenti se il prodotto non può recarla",
            "Solo sul sito web del fabbricante",
            "Da nessuna parte — è solo una voce di database",
          ],
          correctIndex: 1,
          explanation:
            "La marcatura CE è apposta in modo visibile, leggibile e indelebile sul prodotto; altrimenti su imballaggio e documenti di accompagnamento.",
        },
        {
          question: "Cosa significa la marcatura CE?",
          options: [
            "Che il prodotto ha superato un test di velocità",
            "La conformità al CRA e ad altra legislazione dell'Unione applicabile",
            "Che un organismo notificato possiede il prodotto",
            "Che il prodotto è open source",
          ],
          correctIndex: 1,
          explanation:
            "La marcatura CE esprime la dichiarazione di conformità del fabbricante al CRA e ad altra legislazione dell'Unione applicabile.",
        },
        {
          question:
            "Cos'è una dichiarazione di conformità semplificata (allegato VI)?",
          options: [
            "Una DoC senza il nome del fabbricante",
            "Una forma breve che indica che la DoC completa è disponibile a un indirizzo internet",
            "Una DoC senza firma",
            "Una bozza interna mai mostrata agli utenti",
          ],
          correctIndex: 1,
          explanation:
            "La DoC semplificata dell'allegato VI nomina il prodotto + il fabbricante e rimanda all'indirizzo internet dove la dichiarazione completa è disponibile.",
        },
        {
          question: "Quando deve essere apposta la marcatura CE?",
          options: [
            "Dopo il primo anno di vendita",
            "Prima dell'immissione sul mercato del prodotto",
            "Solo se un cliente lo richiede",
            "Quando termina il periodo di supporto",
          ],
          correctIndex: 1,
          explanation:
            "La marcatura CE è apposta prima dell'immissione sul mercato del prodotto.",
        },
        {
          question: "Dove pubblica Seentrix la DoC semplificata?",
          options: [
            "Da nessuna parte — genera solo un PDF",
            "A un URL pubblico una volta che l'organizzazione abilita le pagine pubbliche",
            "Solo all'interno dell'app autenticata",
            "Sul sito della Commissione europea",
          ],
          correctIndex: 1,
          explanation:
            "La pubblicazione nella scheda Identità & CE espone un URL pubblico /doc/<org-slug>/<product-id> (richiede pagine pubbliche abilitate).",
        },
      ],
    },
  },
};

export default lesson;
