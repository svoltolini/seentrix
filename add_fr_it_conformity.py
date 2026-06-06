import sys

with open('/home/user/workspace/seentrix/src/content/academy/conformity-assessment-routes.tsx', 'r') as f:
    content = f.read()

old_tail = '''          correctIndex: 1,
          explanation:
            "NANDO ist die maßgebliche Kommissions-Datenbank der notifizierten Stellen mit IDs, Adressen und Kompetenzbereichen.",
        },
      ],
    },
  },
};

export default lesson;'''

new_tail = '''          correctIndex: 1,
          explanation:
            "NANDO ist die maßgebliche Kommissions-Datenbank der notifizierten Stellen mit IDs, Adressen und Kompetenzbereichen.",
        },
      ],
    },
    fr: {
      title: "Procédures d'évaluation de la conformité (Module A, B+C, H)",
      summary:
        "Comment nous prouvons que notre produit satisfait à l'Annexe I. La procédure dépend de la classification CRA — auto-évaluation, examen de type ou audit qualité complet.",
      sections: [
        {
          heading: "Pourquoi quatre procédures existent",
          body: (
            <p>
              Le CRA répartit les produits en niveaux de risque — par défaut,{" "}
              <em>Important Class I</em>, <em>Important Class II</em> et{" "}
              <em>Critical</em>. Un risque plus élevé implique un contrôle
              tiers plus poussé. La{" "}
              <Term id="conformity_assessment">procédure d'évaluation de la conformité</Term>{" "}
              est la manière dont nous démontrons la conformité au niveau
              correspondant. Choisir la mauvaise procédure pour notre classe
              rend le marquage CE invalide — l'autorité de surveillance du
              marché peut retirer le produit de la vente.
            </p>
          ),
        },
        {
          heading: "Les quatre procédures",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="module_a">Module A</Term> — Contrôle interne de
                    la production.
                  </strong>{" "}
                  Auto-évaluation. Nous préparons la documentation technique,
                  déclarons la conformité et apposons le marquage CE. Aucun
                  organisme notifié. Réservé aux produits de classe par défaut.
                </li>
                <li>
                  <strong>
                    <Term id="module_b_c">Module B+C</Term> — Examen UE de
                    type + conformité au type.
                  </strong>{" "}
                  Un organisme notifié examine un échantillon représentatif et
                  délivre un certificat d'examen de type ; nous déclarons
                  ensuite la conformité de chaque unité produite à ce type.
                  Obligatoire pour Important Class II.
                </li>
                <li>
                  <strong>
                    <Term id="module_h">Module H</Term> — Assurance qualité
                    complète.
                  </strong>{" "}
                  Un organisme notifié audite l'intégralité de notre système
                  qualité (conception → fabrication → tests) et délivre une
                  approbation. Audits de surveillance annuels. Obligatoire pour
                  Critical ; disponible pour Important Class II.
                </li>
                <li>
                  <strong>Certification européenne de cybersécurité.</strong>{" "}
                  Conformité via un schéma de certification de cybersécurité
                  de l'UE au titre du règlement sur la cybersécurité (CSA).
                  En cours d'émergence.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Choisir la bonne procédure dans Seentrix",
          body: (
            <p>
              Lorsque nous exécutons l'assistant d'évaluation CRA sur un
              produit, Seentrix le classifie (par défaut / Important I /
              Important II / Critical) et propose une procédure appropriée.
              Nous pouvons passer outre, mais uniquement dans le sens d'un
              contrôle <em>plus</em> poussé, jamais moins — choisir le
              Module A pour un produit Critical constitue un manquement de
              conformité. La base de données{" "}
              <Term id="nando">NANDO</Term> est l'endroit où nous
              sélectionnons un organisme notifié pour le Module B+C ou H.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quelle procédure de conformité est obligatoire pour les produits Important Class II ?",
          options: [
            "Module A",
            "Module B+C ou Module H",
            "Certification européenne de cybersécurité uniquement",
            "N'importe laquelle des options ci-dessus",
          ],
          correctIndex: 1,
          explanation:
            "Les produits Important Class II ne peuvent pas utiliser le Module A (auto-évaluation). Ils doivent passer par un organisme notifié, soit via le Module B+C (examen de type), soit via le Module H (audit complet du système qualité).",
        },
        {
          question:
            "Quelle est la principale différence opérationnelle entre le Module B+C et le Module H ?",
          options: [
            "Le Module H ne nécessite pas d'organisme notifié",
            "Le Module B+C examine un échantillon ; le Module H audite l'intégralité du système qualité avec une surveillance annuelle",
            "Le Module H est moins coûteux",
            "Seul le Module B+C est autorisé pour le matériel",
          ],
          correctIndex: 1,
          explanation:
            "Le Module B+C est un examen de type d'un échantillon représentatif ; le Module H audite l'ensemble du système qualité (conception/fabrication/tests) avec des audits de surveillance annuels.",
        },
        {
          question:
            "Notre produit est classifié dans le niveau par défaut. Pouvons-nous procéder à une auto-évaluation selon le Module A ?",
          options: [
            "Non, un organisme notifié est toujours requis",
            "Oui — le Module A (contrôle interne) est disponible pour les produits de classe par défaut",
            "Uniquement si notre société mère est établie dans l'UE",
            "Uniquement avec une dérogation accordée par un organisme notifié",
          ],
          correctIndex: 1,
          explanation:
            "Le Module A est une auto-évaluation et est disponible pour les produits de classe par défaut. Aucun organisme notifié n'est impliqué. L'important est de tenir à jour une documentation technique précise.",
        },
        {
          question:
            "Nous avons classifié un produit comme Critical mais avons choisi le Module A. Quelle en est la conséquence ?",
          options: [
            "Le Module A est invalide pour les produits Critical ; le marquage CE est illicite",
            "Aucun problème — le Module A est une procédure de repli",
            "Nous recevons un avertissement de la surveillance du marché mais pouvons continuer à vendre",
            "Le Module H est appliqué automatiquement de manière rétroactive",
          ],
          correctIndex: 0,
          explanation:
            "Les produits Critical doivent passer par le Module H (ou une certification de cybersécurité UE équivalente). L'utilisation du Module A pour un produit Critical rend le marquage CE illicite et nous expose à des amendes CRA pouvant atteindre 15 M€ / 2,5 % du chiffre d'affaires mondial.",
        },
        {
          question:
            "Où consultons-nous l'identifiant à quatre chiffres et le domaine de compétence d'un organisme notifié ?",
          options: [
            "La plateforme de notification unique de l'ENISA",
            "La base de données NANDO (ec.europa.eu/growth/tools-databases/nando)",
            "Notre registre national du commerce",
            "La base de données EUDAMED",
          ],
          correctIndex: 1,
          explanation:
            "NANDO (New Approach Notified and Designated Organisations) est la base de données officielle de la Commission européenne répertoriant les organismes notifiés, avec leurs identifiants, adresses et domaines de compétence.",
        },
      ],
    },
    it: {
      title: "Procedure di valutazione della conformità (Modulo A, B+C, H)",
      summary:
        "Come dimostriamo che il nostro prodotto soddisfa l'Allegato I. La procedura dipende dalla classificazione CRA — autovalutazione, esame del tipo o audit completo del sistema qualità.",
      sections: [
        {
          heading: "Perché esistono quattro procedure",
          body: (
            <p>
              Il CRA suddivide i prodotti in livelli di rischio — standard,{" "}
              <em>Important Class I</em>, <em>Important Class II</em> e{" "}
              <em>Critical</em>. Un rischio più elevato implica un controllo
              di terze parti più rigoroso. La{" "}
              <Term id="conformity_assessment">procedura di valutazione della conformità</Term>{" "}
              è il modo in cui dimostriamo la conformità al livello
              corrispondente. Scegliere la procedura sbagliata per la nostra
              classe rende invalida la marcatura CE — l'autorità di vigilanza
              del mercato può ritirare il prodotto dagli scaffali.
            </p>
          ),
        },
        {
          heading: "Le quattro procedure",
          body: (
            <>
              <ul className="space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>
                    <Term id="module_a">Modulo A</Term> — Controllo interno
                    della produzione.
                  </strong>{" "}
                  Autovalutazione. Predisponiamo la documentazione tecnica,
                  dichiariamo la conformità e apponiamo la marcatura CE.
                  Nessun organismo notificato. Disponibile solo per i prodotti
                  di classe standard.
                </li>
                <li>
                  <strong>
                    <Term id="module_b_c">Modulo B+C</Term> — Esame UE del
                    tipo + conformità al tipo.
                  </strong>{" "}
                  Un organismo notificato esamina un campione rappresentativo
                  e rilascia un certificato di esame del tipo; dichiariamo
                  quindi la conformità di ogni unità prodotta a quel tipo.
                  Obbligatorio per Important Class II.
                </li>
                <li>
                  <strong>
                    <Term id="module_h">Modulo H</Term> — Garanzia qualità
                    completa.
                  </strong>{" "}
                  Un organismo notificato sottopone a audit l'intero sistema
                  qualità (progettazione → produzione → collaudo) e rilascia
                  un'approvazione. Audit di sorveglianza annuali. Obbligatorio
                  per Critical; disponibile per Important Class II.
                </li>
                <li>
                  <strong>Certificazione europea di cibersicurezza.</strong>{" "}
                  Conformità tramite un sistema di certificazione della
                  cibersicurezza dell'UE ai sensi del regolamento sulla
                  cibersicurezza (CSA). Attualmente in fase di sviluppo.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Scegliere la procedura corretta in Seentrix",
          body: (
            <p>
              Quando eseguiamo la procedura guidata di valutazione CRA su un
              prodotto, Seentrix lo classifica (standard / Important I /
              Important II / Critical) e propone una procedura appropriata.
              Possiamo ignorare la proposta, ma solo nella direzione di un
              controllo <em>più</em> rigoroso, mai meno — scegliere il
              Modulo A per un prodotto Critical costituisce un inadempimento
              della conformità. Il database{" "}
              <Term id="nando">NANDO</Term> è il luogo in cui scegliamo
              un organismo notificato per il Modulo B+C o H.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quale procedura di conformità è obbligatoria per i prodotti Important Class II?",
          options: [
            "Modulo A",
            "Modulo B+C o Modulo H",
            "Solo Certificazione europea di cibersicurezza",
            "Una qualsiasi delle opzioni precedenti",
          ],
          correctIndex: 1,
          explanation:
            "I prodotti Important Class II non possono utilizzare il Modulo A (autovalutazione). Devono essere sottoposti a un organismo notificato, tramite il Modulo B+C (esame del tipo) o il Modulo H (audit completo del sistema qualità).",
        },
        {
          question:
            "Qual è la principale differenza operativa tra il Modulo B+C e il Modulo H?",
          options: [
            "Il Modulo H non richiede un organismo notificato",
            "Il Modulo B+C esamina un campione; il Modulo H sottopone a audit l'intero sistema qualità con sorveglianza annuale",
            "Il Modulo H è meno costoso",
            "Solo il Modulo B+C è consentito per l'hardware",
          ],
          correctIndex: 1,
          explanation:
            "Il Modulo B+C è un esame del tipo su un campione rappresentativo; il Modulo H sottopone a audit l'intero sistema qualità (progettazione/produzione/collaudo) con audit di sorveglianza annuali.",
        },
        {
          question:
            "Il nostro prodotto è classificato nel livello standard. Possiamo procedere all'autovalutazione ai sensi del Modulo A?",
          options: [
            "No, un organismo notificato è sempre richiesto",
            "Sì — il Modulo A (controllo interno) è disponibile per i prodotti di classe standard",
            "Solo se la nostra società madre ha sede nell'UE",
            "Solo con una deroga valida rilasciata da un organismo notificato",
          ],
          correctIndex: 1,
          explanation:
            "Il Modulo A è un'autovalutazione ed è disponibile per i prodotti di classe standard. Non è coinvolto alcun organismo notificato. È importante mantenere una documentazione tecnica accurata.",
        },
        {
          question:
            "Abbiamo classificato un prodotto come Critical ma abbiamo scelto il Modulo A. Qual è la conseguenza?",
          options: [
            "Il Modulo A non è valido per i prodotti Critical; la marcatura CE è illegittima",
            "Non ci sono problemi — il Modulo A è una procedura alternativa",
            "Riceviamo un avvertimento dalla vigilanza del mercato ma possiamo continuare a vendere",
            "Il Modulo H viene applicato automaticamente con effetto retroattivo",
          ],
          correctIndex: 0,
          explanation:
            "I prodotti Critical devono essere sottoposti al Modulo H (o a una certificazione di cibersicurezza UE equivalente). L'utilizzo del Modulo A per un prodotto Critical rende illegittima la marcatura CE ed espone a sanzioni CRA fino a 15 M€ / 2,5% del fatturato mondiale.",
        },
        {
          question:
            "Dove consultiamo il codice a quattro cifre e l'ambito di competenza di un organismo notificato?",
          options: [
            "La piattaforma di notifica unica dell'ENISA",
            "Il database NANDO (ec.europa.eu/growth/tools-databases/nando)",
            "Il nostro registro nazionale del commercio",
            "Il database EUDAMED",
          ],
          correctIndex: 1,
          explanation:
            "NANDO (New Approach Notified and Designated Organisations) è il database ufficiale della Commissione europea degli organismi notificati, con i loro codici, indirizzi e ambiti di competenza.",
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
with open('/home/user/workspace/seentrix/src/content/academy/conformity-assessment-routes.tsx', 'w') as f:
    f.write(new_content)
print("Done. New length:", len(new_content))
