/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "risk-assessment-fundamentals",
  duration: "9 min",
  requiredForRoles: ["admin", "compliance_officer", "cto", "editor"],
  prerequisites: ["annex-i-essential-requirements"],
  i18n: {
    en: {
      title: "How to do the CRA risk assessment",
      summary:
        "What Article 13(3) requires, how to map every Annex I requirement to applies / not-applicable, how to score likelihood and impact, and why each version is dated and kept alive.",
      sections: [
        {
          heading: "What the CRA actually asks for",
          body: (
            <p>
              Article 13(2)-(3) requires a documented{" "}
              <Term id="risk_assessment">cybersecurity risk assessment</Term>{" "}
              that is taken into account during design, development, production
              and maintenance. It must capture four context elements — the
              product's <strong>intended purpose</strong> and reasonably
              foreseeable use, its <strong>operational environment</strong>, the{" "}
              <strong>assets it protects</strong>, and its{" "}
              <strong>expected lifetime</strong> — and then work through every{" "}
              <Term id="annex_i">Annex I</Term> requirement. It is point 3 of the
              Annex VII technical file.
            </p>
          ),
        },
        {
          heading: "Applies or not — and N/A always needs a reason",
          body: (
            <p>
              For each of the 21 Annex I requirements (13 in Part I, 8 in Part
              II) you decide whether it <em>applies</em> or is{" "}
              <em>not applicable</em>. If it applies, you describe how the
              product meets it. If it does not, Article 13(3) requires a written{" "}
              <strong>justification</strong> — "not applicable" on its own is not
              acceptable, because a market-surveillance authority must be able to
              follow your reasoning. Seentrix blocks releasing a version until
              every requirement is decided and every N/A is justified.
            </p>
          ),
        },
        {
          heading: "Scoring: inherent risk vs residual risk",
          body: (
            <p>
              For an applicable requirement you name the threat, then rate its{" "}
              <strong>likelihood</strong> and <strong>impact</strong> on a
              Low/Medium/High scale. Those two combine into a derived{" "}
              <em>inherent risk</em> band (a 3×3 heat-map). After you describe
              the mitigating controls, you record the{" "}
              <Term id="residual_risk">residual risk</Term> that remains — which
              should normally be lower than the inherent risk. This is the link
              back to a <Term id="threat_model">threat model</Term>: the threats
              you found on your diagrams are exactly what you score here.
            </p>
          ),
        },
        {
          heading: "Version it, date it, keep it alive",
          body: (
            <p>
              A risk assessment is not a one-off. Releasing a version in Seentrix
              locks it, stamps the date and produces a PDF for the technical
              file; when the product or the threat landscape changes you create a
              new version, which clones the previous one so you only edit what
              moved. The CRA expects the assessment to be kept up to date and
              dated across the whole support period — released versions form the
              audit trail.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Which CRA article requires the cybersecurity risk assessment?",
          options: ["Annex V", "Article 13", "Article 14", "Annex II"],
          correctIndex: 1,
          explanation:
            "Article 13(2)-(3) requires the manufacturer to carry out and document a cybersecurity risk assessment and take it into account across the lifecycle.",
        },
        {
          question:
            "A requirement is marked 'not applicable'. What does the CRA require you to record?",
          options: [
            "Nothing — N/A is self-explanatory",
            "A written justification for why it does not apply",
            "The CVE that makes it irrelevant",
            "A notified body's sign-off",
          ],
          correctIndex: 1,
          explanation:
            "Article 13(3) requires a written justification for any requirement deemed not applicable, so an authority can follow the reasoning.",
        },
        {
          question:
            "Which four context elements must the assessment document?",
          options: [
            "Price, market, competitors, warranty",
            "Intended purpose, operational environment, assets to protect, expected lifetime",
            "SBOM, CVEs, patches, advisories",
            "Manufacturer, importer, distributor, retailer",
          ],
          correctIndex: 1,
          explanation:
            "Article 13(3) frames the assessment around intended purpose, conditions of use, the assets protected, and the expected product lifetime.",
        },
        {
          question: "What is the residual risk?",
          options: [
            "The risk before any controls are applied",
            "The risk that remains after the mitigating controls are in place",
            "The risk transferred to the user",
            "The average of likelihood and impact",
          ],
          correctIndex: 1,
          explanation:
            "Residual risk is what remains once the mitigating implementation is applied — as opposed to the inherent risk before mitigation.",
        },
        {
          question: "How long must the risk assessment be kept current?",
          options: [
            "Only until the product is placed on the market",
            "For 30 days after each release",
            "Kept up to date and dated across the whole support period",
            "It never needs updating once released",
          ],
          correctIndex: 2,
          explanation:
            "The assessment is a living document: it must be updated and re-dated whenever the product or threat landscape changes, throughout the support period.",
        },
      ],
    },
    de: {
      title: "So führen Sie die CRA-Risikobewertung durch",
      summary:
        "Was Artikel 13(3) verlangt, wie Sie jede Anhang-I-Anforderung als anwendbar / nicht anwendbar einordnen, wie Sie Eintrittswahrscheinlichkeit und Auswirkung bewerten und warum jede Version datiert und aktuell gehalten wird.",
      sections: [
        {
          heading: "Was der CRA tatsächlich verlangt",
          body: (
            <p>
              Artikel 13(2)-(3) verlangt eine dokumentierte{" "}
              <Term id="risk_assessment">Cybersicherheits-Risikobewertung</Term>,
              die bei Design, Entwicklung, Produktion und Wartung berücksichtigt
              wird. Sie muss vier Kontextelemente erfassen — den{" "}
              <strong>Verwendungszweck</strong> und die vernünftigerweise
              vorhersehbare Verwendung, die{" "}
              <strong>Betriebsumgebung</strong>, die{" "}
              <strong>geschützten Werte</strong> und die{" "}
              <strong>erwartete Lebensdauer</strong> — und anschließend jede{" "}
              <Term id="annex_i">Anhang-I</Term>-Anforderung durcharbeiten. Sie
              ist Punkt 3 der technischen Dokumentation nach Anhang VII.
            </p>
          ),
        },
        {
          heading: "Anwendbar oder nicht — und N/A braucht immer einen Grund",
          body: (
            <p>
              Für jede der 21 Anhang-I-Anforderungen (13 in Teil I, 8 in Teil II)
              entscheiden Sie, ob sie <em>anwendbar</em> oder{" "}
              <em>nicht anwendbar</em> ist. Wenn sie anwendbar ist, beschreiben
              Sie, wie das Produkt sie erfüllt. Wenn nicht, verlangt Artikel
              13(3) eine schriftliche <strong>Begründung</strong> — ein bloßes
              „nicht anwendbar“ genügt nicht, da eine Marktüberwachungsbehörde
              Ihrer Argumentation folgen können muss. Seentrix verhindert die
              Freigabe einer Version, bis jede Anforderung entschieden und jedes
              N/A begründet ist.
            </p>
          ),
        },
        {
          heading: "Bewertung: inhärentes Risiko vs. Restrisiko",
          body: (
            <p>
              Für eine anwendbare Anforderung benennen Sie die Bedrohung und
              bewerten dann ihre <strong>Eintrittswahrscheinlichkeit</strong> und{" "}
              <strong>Auswirkung</strong> auf einer Skala von Niedrig/Mittel/Hoch.
              Beide ergeben ein abgeleitetes <em>inhärentes Risiko</em> (eine
              3×3-Matrix). Nachdem Sie die mindernden Maßnahmen beschrieben haben,
              erfassen Sie das verbleibende{" "}
              <Term id="residual_risk">Restrisiko</Term> — das normalerweise
              niedriger sein sollte als das inhärente Risiko. Das ist die
              Verbindung zum <Term id="threat_model">Bedrohungsmodell</Term>: die
              auf Ihren Diagrammen gefundenen Bedrohungen bewerten Sie hier.
            </p>
          ),
        },
        {
          heading: "Versionieren, datieren, aktuell halten",
          body: (
            <p>
              Eine Risikobewertung ist keine einmalige Sache. Das Freigeben einer
              Version in Seentrix sperrt sie, datiert sie und erzeugt ein PDF für
              die technische Dokumentation; ändern sich Produkt oder
              Bedrohungslage, erstellen Sie eine neue Version, die die vorherige
              klont, sodass Sie nur das Geänderte bearbeiten. Der CRA erwartet,
              dass die Bewertung über den gesamten Supportzeitraum aktuell
              gehalten und datiert wird — freigegebene Versionen bilden den
              Prüfpfad.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Welcher CRA-Artikel verlangt die Cybersicherheits-Risikobewertung?",
          options: ["Anhang V", "Artikel 13", "Artikel 14", "Anhang II"],
          correctIndex: 1,
          explanation:
            "Artikel 13(2)-(3) verlangt, dass der Hersteller eine Cybersicherheits-Risikobewertung durchführt, dokumentiert und über den Lebenszyklus berücksichtigt.",
        },
        {
          question:
            "Eine Anforderung wird als „nicht anwendbar“ markiert. Was verlangt der CRA?",
          options: [
            "Nichts — N/A ist selbsterklärend",
            "Eine schriftliche Begründung, warum sie nicht zutrifft",
            "Die CVE, die sie irrelevant macht",
            "Die Freigabe einer notifizierten Stelle",
          ],
          correctIndex: 1,
          explanation:
            "Artikel 13(3) verlangt eine schriftliche Begründung für jede als nicht anwendbar eingestufte Anforderung.",
        },
        {
          question:
            "Welche vier Kontextelemente muss die Bewertung dokumentieren?",
          options: [
            "Preis, Markt, Wettbewerber, Garantie",
            "Verwendungszweck, Betriebsumgebung, zu schützende Werte, erwartete Lebensdauer",
            "SBOM, CVEs, Patches, Advisories",
            "Hersteller, Importeur, Händler, Einzelhändler",
          ],
          correctIndex: 1,
          explanation:
            "Artikel 13(3) rahmt die Bewertung um Verwendungszweck, Nutzungsbedingungen, geschützte Werte und erwartete Produktlebensdauer.",
        },
        {
          question: "Was ist das Restrisiko?",
          options: [
            "Das Risiko vor jeglichen Maßnahmen",
            "Das Risiko, das nach den mindernden Maßnahmen verbleibt",
            "Das auf den Nutzer übertragene Risiko",
            "Der Durchschnitt aus Wahrscheinlichkeit und Auswirkung",
          ],
          correctIndex: 1,
          explanation:
            "Das Restrisiko ist das, was nach Umsetzung der mindernden Maßnahmen verbleibt — im Gegensatz zum inhärenten Risiko davor.",
        },
        {
          question: "Wie lange muss die Risikobewertung aktuell gehalten werden?",
          options: [
            "Nur bis zum Inverkehrbringen des Produkts",
            "30 Tage nach jeder Freigabe",
            "Über den gesamten Supportzeitraum aktuell gehalten und datiert",
            "Nach der Freigabe muss sie nie aktualisiert werden",
          ],
          correctIndex: 2,
          explanation:
            "Die Bewertung ist ein lebendiges Dokument: Sie muss bei Änderungen am Produkt oder der Bedrohungslage über den gesamten Supportzeitraum aktualisiert und neu datiert werden.",
        },
      ],
    },
    fr: {
      title: "Comment réaliser l'évaluation des risques CRA",
      summary:
        "Ce qu'exige l'Article 13(3), comment associer chaque exigence de l'annexe I à applicable / non applicable, comment coter la probabilité et l'impact, et pourquoi chaque version est datée et tenue à jour.",
      sections: [
        {
          heading: "Ce que le CRA demande réellement",
          body: (
            <p>
              L'Article 13(2)-(3) exige une{" "}
              <Term id="risk_assessment">
                évaluation des risques de cybersécurité
              </Term>{" "}
              documentée, prise en compte lors de la conception, du
              développement, de la production et de la maintenance. Elle doit
              saisir quatre éléments de contexte — la{" "}
              <strong>destination prévue</strong> et l'usage raisonnablement
              prévisible, l'<strong>environnement d'exploitation</strong>, les{" "}
              <strong>actifs protégés</strong> et la{" "}
              <strong>durée de vie attendue</strong> — puis passer en revue
              chaque exigence de l'<Term id="annex_i">annexe I</Term>. C'est le
              point 3 du dossier technique de l'annexe VII.
            </p>
          ),
        },
        {
          heading: "Applicable ou non — et le N/A exige toujours un motif",
          body: (
            <p>
              Pour chacune des 21 exigences de l'annexe I (13 en partie I, 8 en
              partie II), vous décidez si elle <em>s'applique</em> ou est{" "}
              <em>non applicable</em>. Si elle s'applique, vous décrivez comment
              le produit la satisfait. Sinon, l'Article 13(3) exige une{" "}
              <strong>justification</strong> écrite — un simple « non applicable »
              ne suffit pas, car une autorité de surveillance du marché doit
              pouvoir suivre votre raisonnement. Seentrix bloque la publication
              d'une version tant que chaque exigence n'est pas tranchée et chaque
              N/A justifié.
            </p>
          ),
        },
        {
          heading: "Cotation : risque inhérent vs risque résiduel",
          body: (
            <p>
              Pour une exigence applicable, vous nommez la menace, puis vous
              cotez sa <strong>probabilité</strong> et son{" "}
              <strong>impact</strong> sur une échelle Faible/Moyen/Élevé. Les deux
              se combinent en un <em>risque inhérent</em> dérivé (une matrice
              3×3). Après avoir décrit les mesures d'atténuation, vous
              enregistrez le{" "}
              <Term id="residual_risk">risque résiduel</Term> qui subsiste — qui
              devrait normalement être inférieur au risque inhérent. C'est le lien
              avec le <Term id="threat_model">modèle de menaces</Term> : les
              menaces trouvées sur vos schémas sont exactement ce que vous cotez
              ici.
            </p>
          ),
        },
        {
          heading: "Versionner, dater, maintenir à jour",
          body: (
            <p>
              Une évaluation des risques n'est pas un exercice unique. Publier une
              version dans Seentrix la verrouille, la date et produit un PDF pour
              le dossier technique ; lorsque le produit ou le paysage des menaces
              change, vous créez une nouvelle version qui clone la précédente afin
              de ne modifier que ce qui a évolué. Le CRA attend que l'évaluation
              soit tenue à jour et datée sur toute la période de support — les
              versions publiées constituent la piste d'audit.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quel article du CRA exige l'évaluation des risques de cybersécurité ?",
          options: ["Annexe V", "Article 13", "Article 14", "Annexe II"],
          correctIndex: 1,
          explanation:
            "L'Article 13(2)-(3) impose au fabricant de réaliser et documenter une évaluation des risques et d'en tenir compte tout au long du cycle de vie.",
        },
        {
          question:
            "Une exigence est marquée « non applicable ». Qu'exige le CRA ?",
          options: [
            "Rien — N/A se suffit à lui-même",
            "Une justification écrite expliquant pourquoi elle ne s'applique pas",
            "La CVE qui la rend non pertinente",
            "La validation d'un organisme notifié",
          ],
          correctIndex: 1,
          explanation:
            "L'Article 13(3) exige une justification écrite pour toute exigence jugée non applicable.",
        },
        {
          question:
            "Quels quatre éléments de contexte l'évaluation doit-elle documenter ?",
          options: [
            "Prix, marché, concurrents, garantie",
            "Destination prévue, environnement d'exploitation, actifs à protéger, durée de vie attendue",
            "SBOM, CVE, correctifs, avis",
            "Fabricant, importateur, distributeur, détaillant",
          ],
          correctIndex: 1,
          explanation:
            "L'Article 13(3) structure l'évaluation autour de la destination prévue, des conditions d'utilisation, des actifs protégés et de la durée de vie attendue.",
        },
        {
          question: "Qu'est-ce que le risque résiduel ?",
          options: [
            "Le risque avant toute mesure",
            "Le risque qui subsiste après la mise en place des mesures d'atténuation",
            "Le risque transféré à l'utilisateur",
            "La moyenne de la probabilité et de l'impact",
          ],
          correctIndex: 1,
          explanation:
            "Le risque résiduel est ce qui subsiste une fois la mise en œuvre d'atténuation appliquée — par opposition au risque inhérent avant atténuation.",
        },
        {
          question:
            "Pendant combien de temps l'évaluation doit-elle rester à jour ?",
          options: [
            "Seulement jusqu'à la mise sur le marché du produit",
            "30 jours après chaque publication",
            "Tenue à jour et datée sur toute la période de support",
            "Elle n'a jamais besoin d'être mise à jour une fois publiée",
          ],
          correctIndex: 2,
          explanation:
            "L'évaluation est un document vivant : elle doit être mise à jour et redatée à chaque évolution du produit ou des menaces, pendant toute la période de support.",
        },
      ],
    },
    it: {
      title: "Come realizzare la valutazione dei rischi CRA",
      summary:
        "Cosa richiede l'Articolo 13(3), come associare ogni requisito dell'allegato I ad applicabile / non applicabile, come valutare probabilità e impatto e perché ogni versione è datata e mantenuta aggiornata.",
      sections: [
        {
          heading: "Cosa chiede davvero il CRA",
          body: (
            <p>
              L'Articolo 13(2)-(3) richiede una{" "}
              <Term id="risk_assessment">
                valutazione dei rischi di cibersicurezza
              </Term>{" "}
              documentata, presa in considerazione durante progettazione,
              sviluppo, produzione e manutenzione. Deve cogliere quattro elementi
              di contesto — la <strong>destinazione d'uso</strong> e l'uso
              ragionevolmente prevedibile, l'<strong>ambiente operativo</strong>,
              gli <strong>asset protetti</strong> e la{" "}
              <strong>durata di vita prevista</strong> — e poi esaminare ogni
              requisito dell'<Term id="annex_i">allegato I</Term>. È il punto 3
              del fascicolo tecnico dell'allegato VII.
            </p>
          ),
        },
        {
          heading: "Applicabile o no — e il N/A richiede sempre un motivo",
          body: (
            <p>
              Per ciascuno dei 21 requisiti dell'allegato I (13 nella parte I, 8
              nella parte II) decidi se <em>si applica</em> o è{" "}
              <em>non applicabile</em>. Se si applica, descrivi come il prodotto
              lo soddisfa. In caso contrario, l'Articolo 13(3) richiede una{" "}
              <strong>giustificazione</strong> scritta — un semplice «non
              applicabile» non basta, perché un'autorità di vigilanza del mercato
              deve poter seguire il tuo ragionamento. Seentrix impedisce il
              rilascio di una versione finché ogni requisito non è deciso e ogni
              N/A giustificato.
            </p>
          ),
        },
        {
          heading: "Valutazione: rischio inerente vs rischio residuo",
          body: (
            <p>
              Per un requisito applicabile indichi la minaccia, poi valuti la sua{" "}
              <strong>probabilità</strong> e il suo <strong>impatto</strong> su
              una scala Basso/Medio/Alto. I due si combinano in un{" "}
              <em>rischio inerente</em> derivato (una matrice 3×3). Dopo aver
              descritto i controlli di mitigazione, registri il{" "}
              <Term id="residual_risk">rischio residuo</Term> che permane — che
              normalmente dovrebbe essere inferiore al rischio inerente. È il
              collegamento con il{" "}
              <Term id="threat_model">modello di minaccia</Term>: le minacce
              trovate sui tuoi diagrammi sono esattamente ciò che valuti qui.
            </p>
          ),
        },
        {
          heading: "Versionare, datare, mantenere viva",
          body: (
            <p>
              Una valutazione dei rischi non è un'attività una tantum. Rilasciare
              una versione in Seentrix la blocca, la data e produce un PDF per il
              fascicolo tecnico; quando il prodotto o il panorama delle minacce
              cambia, crei una nuova versione che clona la precedente, così
              modifichi solo ciò che è cambiato. Il CRA si aspetta che la
              valutazione sia mantenuta aggiornata e datata per tutto il periodo
              di supporto — le versioni rilasciate costituiscono la pista di
              controllo.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quale articolo del CRA richiede la valutazione dei rischi di cibersicurezza?",
          options: ["Allegato V", "Articolo 13", "Articolo 14", "Allegato II"],
          correctIndex: 1,
          explanation:
            "L'Articolo 13(2)-(3) impone al fabbricante di effettuare e documentare una valutazione dei rischi e di tenerne conto lungo il ciclo di vita.",
        },
        {
          question:
            "Un requisito è contrassegnato come «non applicabile». Cosa richiede il CRA?",
          options: [
            "Nulla — N/A si spiega da sé",
            "Una giustificazione scritta del perché non si applica",
            "La CVE che lo rende irrilevante",
            "L'approvazione di un organismo notificato",
          ],
          correctIndex: 1,
          explanation:
            "L'Articolo 13(3) richiede una giustificazione scritta per ogni requisito ritenuto non applicabile.",
        },
        {
          question:
            "Quali quattro elementi di contesto deve documentare la valutazione?",
          options: [
            "Prezzo, mercato, concorrenti, garanzia",
            "Destinazione d'uso, ambiente operativo, asset da proteggere, durata di vita prevista",
            "SBOM, CVE, patch, advisory",
            "Fabbricante, importatore, distributore, rivenditore",
          ],
          correctIndex: 1,
          explanation:
            "L'Articolo 13(3) struttura la valutazione attorno a destinazione d'uso, condizioni d'uso, asset protetti e durata di vita prevista del prodotto.",
        },
        {
          question: "Che cos'è il rischio residuo?",
          options: [
            "Il rischio prima di qualsiasi controllo",
            "Il rischio che permane dopo l'applicazione dei controlli di mitigazione",
            "Il rischio trasferito all'utente",
            "La media di probabilità e impatto",
          ],
          correctIndex: 1,
          explanation:
            "Il rischio residuo è ciò che permane una volta applicata l'implementazione di mitigazione — in contrapposizione al rischio inerente precedente.",
        },
        {
          question:
            "Per quanto tempo la valutazione dei rischi deve essere mantenuta aggiornata?",
          options: [
            "Solo fino all'immissione sul mercato del prodotto",
            "30 giorni dopo ogni rilascio",
            "Mantenuta aggiornata e datata per tutto il periodo di supporto",
            "Una volta rilasciata non deve mai essere aggiornata",
          ],
          correctIndex: 2,
          explanation:
            "La valutazione è un documento vivo: deve essere aggiornata e ridatata a ogni cambiamento del prodotto o del panorama delle minacce, per tutto il periodo di supporto.",
        },
      ],
    },
  },
};

export default lesson;
