/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "economic-operator-roles",
  duration: "5 min",
  requiredForRoles: ["admin", "compliance_officer"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Economic-operator roles",
      summary:
        "Manufacturer, authorised representative, importer, distributor — the four CRA roles and what obligations each one carries.",
      sections: [
        {
          heading: "Why the role matters",
          body: (
            <p>
              The CRA calibrates obligations by role. A manufacturer owns
              the conformity assessment and the DoC. An importer verifies
              the manufacturer's work. A distributor just checks the CE
              marking is there. Picking the right role for our org on{" "}
              <strong>Settings → Entity role</strong> reshapes our
              obligation checklist — wrong role = wrong checklist = wrong
              evidence for an audit.
            </p>
          ),
        },
        {
          heading: "The four roles",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Manufacturer.</strong> We place the product on
                  the EU market under our own name or trademark. We own
                  Annex I, Annex V, Article 13, Article 14 — the full set.
                  Most Seentrix customers are here.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Authorised representative</Term>
                    .
                  </strong>{" "}
                  EU-based, mandated in writing by a non-EU manufacturer.
                  Holds the technical documentation and liaises with market
                  surveillance on the manufacturer's behalf. Required under{" "}
                  <strong>Article 18</strong> whenever the manufacturer
                  sits outside the EU.
                </li>
                <li>
                  <strong>Importer.</strong> Places a non-EU-manufactured
                  product on the EU market. Verifies the DoC exists, the
                  CE marking is present, and the manufacturer has a valid
                  authorised representative. Not responsible for producing
                  the DoC, but <em>is</em> liable if they place a
                  non-compliant product.
                </li>
                <li>
                  <strong>Distributor.</strong> Sells a product without
                  being the manufacturer or the importer. Checks CE marking
                  + DoC availability + user instructions. Lightest
                  obligation set, but still has a duty to refuse to sell
                  products that obviously don't comply.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "The “substantial modification” rule",
          body: (
            <p>
              A distributor or importer who <em>substantially modifies</em>{" "}
              a product — adding new firmware, re-branding it, changing its
              cybersecurity posture — becomes the manufacturer in the eyes
              of the CRA, with the full obligation set. White-labelling an
              OEM product and flashing our own firmware is substantial
              modification; bundling it in a box with a leaflet is not.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "We buy an IoT device from a US manufacturer and sell it in the EU with no changes. What role are we under the CRA?",
          options: [
            "Manufacturer",
            "Authorised representative",
            "Importer",
            "Distributor",
          ],
          correctIndex: 2,
          explanation:
            "Placing a non-EU-manufactured product on the EU market makes us the importer. We're responsible for verifying DoC + CE marking + authorised representative, but the manufacturer still owns the Annex I work.",
        },
        {
          question:
            "We buy an OEM device, flash our own firmware, and sell it under our brand. What role?",
          options: [
            "Distributor — we didn't build the hardware",
            "Manufacturer — flashing firmware under our brand is substantial modification",
            "Importer, because someone else made the hardware",
            "Authorised representative of the OEM",
          ],
          correctIndex: 1,
          explanation:
            "Substantial modification (our firmware, our brand) makes us the manufacturer under the CRA. We inherit the full obligation set including Annex I and DoC.",
        },
        {
          question:
            "A non-EU manufacturer wants to sell directly in the EU without appointing a representative. Can they?",
          options: [
            "Yes, if the product is CE-marked",
            "Yes, if the importer accepts the technical documentation",
            "No — Article 18 requires an authorised representative in the EU",
            "Only for Important Class II products",
          ],
          correctIndex: 2,
          explanation:
            "Article 18 is unconditional: non-EU manufacturers must appoint an EU-based authorised representative before placing products on the EU market. No workaround.",
        },
        {
          question:
            "Which operator holds primary responsibility for Annex I compliance?",
          options: [
            "Manufacturer",
            "Authorised representative",
            "Importer",
            "Distributor",
          ],
          correctIndex: 0,
          explanation:
            "The manufacturer is the operator who must satisfy Annex I, prepare the technical documentation, and issue the DoC. Other operators verify or support but don't own compliance.",
        },
        {
          question:
            "Our org setting in Seentrix is marked as Manufacturer, but we're actually just an EU distributor. What's the impact?",
          options: [
            "Nothing — the setting is cosmetic",
            "The obligation checklist pushes Annex I + DoC tasks we aren't actually responsible for — distracting but not unsafe",
            "We inherit manufacturer liability through the misconfiguration, which is exactly what we shouldn't claim in an audit",
            "The distributor tasks are added automatically on top",
          ],
          correctIndex: 2,
          explanation:
            "Seentrix's checklist is driven by the role. Claiming manufacturer status when we're a distributor invites manufacturer-level liability we don't have the evidence for. Fix the role on Settings → Entity role to match reality.",
        },
      ],
    },
    de: {
      title: "Wirtschaftsakteursrollen",
      summary:
        "Hersteller, Bevollmächtigter, Einführer, Händler — die vier CRA-Rollen und ihre jeweiligen Pflichten.",
      sections: [
        {
          heading: "Warum die Rolle zählt",
          body: (
            <p>
              Der CRA staffelt die Pflichten nach Rolle. Ein Hersteller
              verantwortet Konformitätsbewertung und DoC. Ein Einführer
              prüft die Arbeit des Herstellers. Ein Händler prüft nur, ob
              die CE-Kennzeichnung vorhanden ist. Die richtige Rolle unter{" "}
              <strong>Einstellungen → Rolle</strong> auszuwählen, formt
              die Pflichtenliste — falsche Rolle = falsche Liste = falsche
              Belege im Audit.
            </p>
          ),
        },
        {
          heading: "Die vier Rollen",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Hersteller.</strong> Wir bringen das Produkt unter
                  eigenem Namen oder eigener Marke auf den EU-Markt. Wir
                  verantworten Anhang I, Anhang V, Artikel 13, Artikel 14 —
                  das volle Set. Die meisten Seentrix-Kunden sind hier.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Bevollmächtigter</Term>
                    .
                  </strong>{" "}
                  In der EU ansässig, schriftlich von einem
                  Nicht-EU-Hersteller mandatiert. Hält die technische
                  Dokumentation bereit und steht der Marktüberwachung
                  gegenüber. Pflicht nach <strong>Artikel 18</strong> bei
                  jedem Nicht-EU-Hersteller.
                </li>
                <li>
                  <strong>Einführer.</strong> Bringt ein außerhalb der EU
                  hergestelltes Produkt auf den EU-Markt. Prüft DoC +
                  CE-Kennzeichnung + gültigen Bevollmächtigten. Erstellt
                  die DoC nicht, haftet aber, wenn ein nicht-konformes
                  Produkt in Verkehr gebracht wird.
                </li>
                <li>
                  <strong>Händler.</strong> Verkauft ein Produkt, ohne
                  Hersteller oder Einführer zu sein. Prüft CE-Kennzeichnung
                  + Verfügbarkeit der DoC + Nutzerinformationen. Geringste
                  Pflicht, aber die Pflicht, offensichtlich
                  nicht-konforme Produkte nicht zu verkaufen.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Die Regel zur „wesentlichen Modifikation“",
          body: (
            <p>
              Ein Händler oder Einführer, der ein Produkt{" "}
              <em>wesentlich modifiziert</em> — neue Firmware, Umbranding,
              Änderung der Cybersicherheits-Eigenschaften — wird für den
              CRA zum Hersteller, mit dem vollen Pflichtensatz. Ein
              OEM-Produkt zu white-labeln und eigene Firmware zu flashen ist
              wesentliche Modifikation; es mit einer Beilage in eine Box zu
              packen ist es nicht.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Wir kaufen ein IoT-Gerät von einem US-Hersteller und verkaufen es unverändert in der EU. Welche Rolle haben wir nach dem CRA?",
          options: [
            "Hersteller",
            "Bevollmächtigter",
            "Einführer",
            "Händler",
          ],
          correctIndex: 2,
          explanation:
            "Das Inverkehrbringen eines außerhalb der EU hergestellten Produkts macht uns zum Einführer. Wir prüfen DoC + CE + Bevollmächtigten; der Hersteller verantwortet weiterhin Anhang I.",
        },
        {
          question:
            "Wir kaufen ein OEM-Gerät, flashen eigene Firmware und verkaufen es unter unserer Marke. Welche Rolle?",
          options: [
            "Händler — wir haben die Hardware nicht gebaut",
            "Hersteller — eigene Firmware unter eigener Marke ist wesentliche Modifikation",
            "Einführer, weil jemand anders die Hardware gebaut hat",
            "Bevollmächtigter des OEM",
          ],
          correctIndex: 1,
          explanation:
            "Wesentliche Modifikation (eigene Firmware, eigene Marke) macht uns zum Hersteller. Wir übernehmen das volle Pflichtenset einschließlich Anhang I und DoC.",
        },
        {
          question:
            "Ein Nicht-EU-Hersteller will ohne Bevollmächtigten direkt in der EU verkaufen. Zulässig?",
          options: [
            "Ja, wenn das Produkt CE-gekennzeichnet ist",
            "Ja, wenn der Einführer die technische Dokumentation akzeptiert",
            "Nein — Artikel 18 verlangt einen Bevollmächtigten in der EU",
            "Nur für Important-Class-II-Produkte",
          ],
          correctIndex: 2,
          explanation:
            "Artikel 18 ist ohne Wenn und Aber: Nicht-EU-Hersteller müssen vor dem Inverkehrbringen einen in der EU ansässigen Bevollmächtigten benennen.",
        },
        {
          question:
            "Welcher Akteur trägt die Hauptverantwortung für die Anhang-I-Konformität?",
          options: [
            "Hersteller",
            "Bevollmächtigter",
            "Einführer",
            "Händler",
          ],
          correctIndex: 0,
          explanation:
            "Der Hersteller erfüllt Anhang I, erstellt die technische Dokumentation und stellt die DoC aus. Andere Akteure prüfen oder unterstützen, tragen aber nicht die Konformität.",
        },
        {
          question:
            "Unsere Seentrix-Rolle steht auf „Hersteller“, wir sind aber nur EU-Händler. Folge?",
          options: [
            "Keine — die Einstellung ist kosmetisch",
            "Die Checkliste listet Anhang-I- und DoC-Aufgaben, die uns nicht betreffen — störend, aber nicht unsicher",
            "Wir beanspruchen damit Herstellerhaftung ohne die Belege — im Audit genau das, was wir nicht wollen",
            "Händleraufgaben werden automatisch ergänzt",
          ],
          correctIndex: 2,
          explanation:
            "Seentrix leitet die Checkliste aus der Rolle ab. Als Hersteller aufzutreten, ohne tatsächlich Hersteller zu sein, lädt Herstellerhaftung ein, für die die Nachweise fehlen. Rolle unter Einstellungen → Rolle korrigieren.",
        },
      ],
    },
    fr: {
      title: "Rôles des opérateurs économiques",
      summary:
        "Fabricant, mandataire, importateur, distributeur — les quatre rôles CRA et les obligations que chacun implique.",
      sections: [
        {
          heading: "Pourquoi le rôle est important",
          body: (
            <p>
              Le CRA calibre les obligations en fonction du rôle. Un fabricant
              est responsable de l’évaluation de la conformité et de la
              déclaration de conformité. Un importateur vérifie le travail du
              fabricant. Un distributeur vérifie simplement que le marquage CE
              est présent. Choisir le bon rôle pour notre organisation dans{" "}
              <strong>Paramètres → Rôle de l’entité</strong> remodèle notre
              liste de contrôle des obligations — mauvais rôle = mauvaise
              liste = mauvaises preuves pour un audit.
            </p>
          ),
        },
        {
          heading: "Les quatre rôles",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Fabricant.</strong> Nous mettons le produit sur
                  le marché de l’UE sous notre propre nom ou marque. Nous
                  sommes responsables de l’Annexe I, de l’Annexe V, de
                  l’Article 13, de l’Article 14 — l’ensemble complet.
                  La plupart des clients Seentrix sont dans ce cas.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Mandataire</Term>
                    .
                  </strong>{" "}
                  Établi dans l’UE, mandaté par écrit par un fabricant
                  hors UE. Détient la documentation technique et assure la
                  liaison avec la surveillance du marché au nom du fabricant.
                  Requis en vertu de{" "}
                  <strong>l’Article 18</strong> dès que le fabricant est
                  établi hors de l’UE.
                </li>
                <li>
                  <strong>Importateur.</strong> Met sur le marché de l’UE
                  un produit fabriqué hors UE. Vérifie que la déclaration de
                  conformité existe, que le marquage CE est présent et que le
                  fabricant dispose d’un mandataire valide. Non responsable
                  de la production de la déclaration de conformité, mais{" "}
                  <em>est</em> tenu responsable s’il met un produit non
                  conforme sur le marché.
                </li>
                <li>
                  <strong>Distributeur.</strong> Vend un produit sans être
                  le fabricant ni l’importateur. Vérifie le marquage CE,
                  la disponibilité de la déclaration de conformité et les
                  informations utilisateur. Ensemble d’obligations le plus
                  léger, mais obligation de refuser de vendre des produits
                  manifestement non conformes.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "La règle de la « modification substantielle »",
          body: (
            <p>
              Un distributeur ou un importateur qui <em>modifie substantiellement</em>{" "}
              un produit — ajout d’un nouveau firmware, rebranding, modification
              de sa posture de cybersécurité — devient le fabricant aux yeux
              du CRA, avec l’ensemble complet des obligations. Apposer notre
              marque sur un produit OEM et flasher notre propre firmware
              constitue une modification substantielle ; le conditionner dans
              une boîte avec un dépliant ne l’est pas.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Nous achetons un appareil IoT à un fabricant américain et le vendons dans l’UE sans modification. Quel rôle avons-nous au titre du CRA ?",
          options: [
            "Fabricant",
            "Mandataire",
            "Importateur",
            "Distributeur",
          ],
          correctIndex: 2,
          explanation:
            "Mettre sur le marché de l’UE un produit fabriqué hors UE nous rend importateurs. Nous sommes responsables de la vérification de la déclaration de conformité, du marquage CE et du mandataire, mais le fabricant reste responsable du travail Annexe I.",
        },
        {
          question:
            "Nous achetons un appareil OEM, flashons notre propre firmware et le vendons sous notre marque. Quel rôle ?",
          options: [
            "Distributeur — nous n’avons pas fabriqué le matériel",
            "Fabricant — flasher un firmware sous notre marque est une modification substantielle",
            "Importateur, car quelqu’un d’autre a fabriqué le matériel",
            "Mandataire de l’OEM",
          ],
          correctIndex: 1,
          explanation:
            "La modification substantielle (notre firmware, notre marque) fait de nous le fabricant au titre du CRA. Nous héritons de l’ensemble complet des obligations, y compris l’Annexe I et la déclaration de conformité.",
        },
        {
          question:
            "Un fabricant hors UE souhaite vendre directement dans l’UE sans nommer de mandataire. Est-ce possible ?",
          options: [
            "Oui, si le produit porte le marquage CE",
            "Oui, si l’importateur accepte la documentation technique",
            "Non — l’Article 18 impose un mandataire établi dans l’UE",
            "Uniquement pour les produits importants de classe II",
          ],
          correctIndex: 2,
          explanation:
            "L’Article 18 est inconditionnel : les fabricants hors UE doivent nommer un mandataire établi dans l’Union avant de mettre des produits sur le marché de l’UE. Aucune dérogation n’est prévue.",
        },
        {
          question:
            "Quel opérateur est principalement responsable de la conformité à l’Annexe I ?",
          options: [
            "Fabricant",
            "Mandataire",
            "Importateur",
            "Distributeur",
          ],
          correctIndex: 0,
          explanation:
            "Le fabricant est l’opérateur qui doit satisfaire l’Annexe I, préparer la documentation technique et émettre la déclaration de conformité. Les autres opérateurs vérifient ou soutiennent, mais ne sont pas responsables de la conformité.",
        },
        {
          question:
            "Notre paramètre d’organisation dans Seentrix est défini sur Fabricant, mais nous sommes en réalité simplement un distributeur UE. Quelle est l’incidence ?",
          options: [
            "Aucune — le paramètre est cosmétique",
            "La liste de contrôle pousse des tâches Annexe I + déclaration de conformité dont nous ne sommes pas responsables — perturbant mais pas risqué",
            "Nous revendiquons ainsi une responsabilité de fabricant sans en avoir les preuves — exactement ce qu’il ne faut pas afficher lors d’un audit",
            "Les tâches de distributeur sont automatiquement ajoutées en plus",
          ],
          correctIndex: 2,
          explanation:
            "La liste de contrôle de Seentrix est déterminée par le rôle. Revendiquer le statut de fabricant alors que nous sommes distributeur expose à une responsabilité de fabricant pour laquelle nous n’avons pas les preuves. Corriger le rôle dans Paramètres → Rôle de l’entité pour correspondre à la réalité.",
        },
      ],
    },
    it: {
      title: "Ruoli degli operatori economici",
      summary:
        "Fabbricante, rappresentante autorizzato, importatore, distributore — i quattro ruoli CRA e gli obblighi che ciascuno comporta.",
      sections: [
        {
          heading: "Perché il ruolo è importante",
          body: (
            <p>
              Il CRA calibra gli obblighi in base al ruolo. Un fabbricante è
              responsabile della valutazione della conformità e della
              dichiarazione di conformità. Un importatore verifica il lavoro
              del fabbricante. Un distributore verifica semplicemente che la
              marcatura CE sia presente. Scegliere il ruolo corretto per la
              nostra organizzazione in{" "}
              <strong>Impostazioni → Ruolo dell’entità</strong> ridisegna la
              nostra lista di controllo degli obblighi — ruolo sbagliato =
              lista sbagliata = prove sbagliate per un audit.
            </p>
          ),
        },
        {
          heading: "I quattro ruoli",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Fabbricante.</strong> Immettiamo il prodotto sul
                  mercato dell’UE con il nostro nome o marchio. Siamo
                  responsabili dell’Allegato I, dell’Allegato V,
                  dell’Articolo 13, dell’Articolo 14 — l’insieme completo.
                  La maggior parte dei clienti Seentrix rientra in questa
                  categoria.
                </li>
                <li>
                  <strong>
                    <Term id="authorised_representative">Rappresentante autorizzato</Term>
                    .
                  </strong>{" "}
                  Stabilito nell’UE, incaricato per iscritto da un fabbricante
                  extra-UE. Detiene la documentazione tecnica e funge da
                  interlocutore con la vigilanza del mercato per conto del
                  fabbricante. Obbligatorio ai sensi dell’
                  <strong>Articolo 18</strong> ogni volta che il fabbricante
                  è stabilito fuori dall’UE.
                </li>
                <li>
                  <strong>Importatore.</strong> Immette sul mercato dell’UE
                  un prodotto fabbricato fuori dall’UE. Verifica che la
                  dichiarazione di conformità esista, che la marcatura CE sia
                  presente e che il fabbricante abbia un rappresentante
                  autorizzato valido. Non è responsabile della produzione
                  della dichiarazione di conformità, ma <em>è</em> responsabile
                  se immette un prodotto non conforme.
                </li>
                <li>
                  <strong>Distributore.</strong> Vende un prodotto senza
                  essere il fabbricante né l’importatore. Verifica la
                  marcatura CE, la disponibilità della dichiarazione di
                  conformità e le istruzioni per l’utente. Insieme di
                  obblighi più leggero, ma ha comunque il dovere di rifiutarsi
                  di vendere prodotti che manifestamente non sono conformi.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "La regola della «modifica sostanziale»",
          body: (
            <p>
              Un distributore o un importatore che <em>modifica sostanzialmente</em>{" "}
              un prodotto — aggiungendo nuovo firmware, ribrandizzandolo,
              modificandone la postura di cibersicurezza — diventa il
              fabbricante agli occhi del CRA, con l’insieme completo degli
              obblighi. Apporre il proprio marchio su un prodotto OEM e
              installare il proprio firmware è una modifica sostanziale;
              confezionarlo in una scatola con un foglietto illustrativo
              non lo è.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Acquistiamo un dispositivo IoT da un fabbricante statunitense e lo vendiamo nell’UE senza modifiche. Qual è il nostro ruolo ai sensi del CRA?",
          options: [
            "Fabbricante",
            "Rappresentante autorizzato",
            "Importatore",
            "Distributore",
          ],
          correctIndex: 2,
          explanation:
            "Immettere sul mercato dell’UE un prodotto fabbricato fuori dall’UE ci rende importatori. Siamo responsabili della verifica della dichiarazione di conformità, della marcatura CE e del rappresentante autorizzato, ma il fabbricante rimane responsabile del lavoro Allegato I.",
        },
        {
          question:
            "Acquistiamo un dispositivo OEM, installiamo il nostro firmware e lo vendiamo con il nostro marchio. Qual è il ruolo?",
          options: [
            "Distributore — non abbiamo costruito l’hardware",
            "Fabbricante — installare firmware con il proprio marchio è una modifica sostanziale",
            "Importatore, perché qualcun altro ha prodotto l’hardware",
            "Rappresentante autorizzato dell’OEM",
          ],
          correctIndex: 1,
          explanation:
            "La modifica sostanziale (nostro firmware, nostro marchio) ci rende fabbricanti ai sensi del CRA. Ereditiamo l’insieme completo degli obblighi, inclusi Allegato I e dichiarazione di conformità.",
        },
        {
          question:
            "Un fabbricante extra-UE vuole vendere direttamente nell’UE senza nominare un rappresentante. È possibile?",
          options: [
            "Sì, se il prodotto reca la marcatura CE",
            "Sì, se l’importatore accetta la documentazione tecnica",
            "No — l’Articolo 18 richiede un rappresentante autorizzato nell’UE",
            "Solo per i prodotti importanti di classe II",
          ],
          correctIndex: 2,
          explanation:
            "L’Articolo 18 è incondizionato: i fabbricanti extra-UE devono nominare un rappresentante autorizzato stabilito nell’Unione prima di immettere prodotti sul mercato dell’UE. Non esistono deroghe.",
        },
        {
          question:
            "Quale operatore è il principale responsabile della conformità all’Allegato I?",
          options: [
            "Fabbricante",
            "Rappresentante autorizzato",
            "Importatore",
            "Distributore",
          ],
          correctIndex: 0,
          explanation:
            "Il fabbricante è l’operatore che deve soddisfare l’Allegato I, preparare la documentazione tecnica ed emettere la dichiarazione di conformità. Gli altri operatori verificano o supportano, ma non sono responsabili della conformità.",
        },
        {
          question:
            "La nostra impostazione di organizzazione in Seentrix è impostata come Fabbricante, ma siamo in realtà solo un distributore UE. Qual è l’impatto?",
          options: [
            "Nessuno — l’impostazione è cosmetica",
            "La lista di controllo propone attività Allegato I + dichiarazione di conformità di cui non siamo responsabili — disturbante ma non pericoloso",
            "Rivendichiamo così una responsabilità da fabbricante senza averne le prove — esattamente ciò che non vogliamo sostenere in un audit",
            "Le attività da distributore vengono aggiunte automaticamente in cima",
          ],
          correctIndex: 2,
          explanation:
            "La lista di controllo di Seentrix è determinata dal ruolo. Rivendicare lo stato di fabbricante quando siamo distributori espone a una responsabilità da fabbricante per la quale mancano le prove. Correggere il ruolo in Impostazioni → Ruolo dell’entità per rispecchiare la realtà.",
        },
      ],
    },
  },
};

export default lesson;
