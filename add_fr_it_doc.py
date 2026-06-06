import sys

with open('/home/user/workspace/seentrix/src/content/academy/declaration-of-conformity.tsx', 'r') as f:
    content = f.read()

old_tail = '''          correctIndex: 0,
          explanation:
            "Das Ort-Feld benennt den Ort der Unterschrift. Seentrix nutzt unsere eingetragene Stadt aus Einstellungen → Organisation.",
        },
      ],
    },
  },
};

export default lesson;'''

new_tail = '''          correctIndex: 0,
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

export default lesson;'''

if old_tail not in content:
    print("ERROR: old_tail not found", file=sys.stderr)
    sys.exit(1)

new_content = content.replace(old_tail, new_tail, 1)
with open('/home/user/workspace/seentrix/src/content/academy/declaration-of-conformity.tsx', 'w') as f:
    f.write(new_content)
print("Done. New length:", len(new_content))
