/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "support-period-obligations",
  duration: "5 min",
  requiredForRoles: ["admin", "compliance_officer", "cto", "editor"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Support period and security-update obligations",
      summary:
        "The 5-year-minimum commitment to keep shipping security updates, and the channel through which users receive them.",
      sections: [
        {
          heading: "The support-period floor",
          body: (
            <p>
              CRA Article 13 + Annex I Part II(8) set a baseline: every
              product must have a{" "}
              <Term id="support_period">support period</Term> of at least{" "}
              <strong>5 years</strong> from the first unit placed on the
              market, or longer if the product's expected lifetime is
              longer. Industrial and medical devices routinely need 10–15
              years. We set ours on the Releases tab → Support period, and
              it appears on every end-user information sheet.
            </p>
          ),
        },
        {
          heading: "What counts as a security update",
          body: (
            <p>
              A <Term id="security_update">security update</Term> is a
              release whose purpose is patching one or more vulnerabilities.
              Article 13(8) requires us to ship them{" "}
              <em>without undue delay and free of charge</em> — that
              wording matters for audits. “Without undue delay”
              is context-dependent: for a{" "}
              <Term id="kev">CISA KEV</Term>-listed CVE, days. For a{" "}
              <Term id="cvss">low-CVSS</Term> finding, weeks can be
              defensible if your risk assessment documents it. Seentrix
              timestamps every release, so the evidence is automatic.
            </p>
          ),
        },
        {
          heading: "The update channel must be declared",
          body: (
            <p>
              Annex II's end-user information must state{" "}
              <em>how</em> updates reach users — over-the-air push,
              package manager pull, download portal, USB stick, or a
              recall. A declared support period is meaningless if users
              don't know the channel. Seentrix's Releases → Support period
              tab asks us to name the channel and includes it in the
              auto-generated end-user information PDF. Changing the
              channel mid-lifecycle requires explicit communication to
              affected users.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "What's the minimum support-period length under the CRA?",
          options: [
            "2 years",
            "5 years",
            "10 years",
            "The product's expected lifetime, with no hard floor",
          ],
          correctIndex: 1,
          explanation:
            "CRA Article 13 + Annex I Part II(8) mandate a minimum of 5 years, or longer if the product's expected lifetime is longer. “Up to 5 years” is a floor, not a cap.",
        },
        {
          question:
            "Article 13(8) says security updates must be provided “without undue delay and ___” — what completes the phrase?",
          options: [
            "under paid-support agreements",
            "free of charge",
            "for a fee proportional to severity",
            "at the manufacturer's discretion",
          ],
          correctIndex: 1,
          explanation:
            "Article 13(8): security updates must be provided “without undue delay and free of charge.” Charging for security patches for products within their support period breaches the CRA.",
        },
        {
          question:
            "We launched a product 3 years ago and want to stop shipping security updates. Is that legal?",
          options: [
            "Yes, after 2 years we can do whatever we like",
            "No — the CRA mandates at least 5 years, so we're in breach at year 3",
            "Only if we refund every customer",
            "Yes, if we discontinue the product",
          ],
          correctIndex: 1,
          explanation:
            "5 years is the legal floor. Dropping support at year 3 is a breach even if we discontinue the product commercially; we owe security updates to existing users for the declared period.",
        },
        {
          question:
            "Why does the update channel need to be declared on end-user information?",
          options: [
            "It's optional",
            "A support period promise is hollow if users can't find or install updates",
            "The CRA requires a unique channel per product",
            "Market surveillance provides the channel for us",
          ],
          correctIndex: 1,
          explanation:
            "Annex II of end-user information requires the update channel because the support-period commitment is meaningless without a way for users to receive and install updates.",
        },
        {
          question:
            "Which Seentrix screen is the authoritative source for our declared support period?",
          options: [
            "Settings → Organization",
            "Products → [product] → Releases → Support period",
            "Conformity → Notified body",
            "Settings → Activity",
          ],
          correctIndex: 1,
          explanation:
            "The Releases → Support period section of each product page is where we declare start date, end date, and update channel. These values feed the end-user information PDF and the dashboard support-window widget.",
        },
      ],
    },
    de: {
      title: "Support-Zeitraum und Sicherheitsupdate-Pflichten",
      summary:
        "Die mindestens 5-jährige Zusage, Sicherheitsupdates zu liefern, und der Kanal, über den Nutzer sie erhalten.",
      sections: [
        {
          heading: "Die Untergrenze für den Support-Zeitraum",
          body: (
            <p>
              CRA Artikel 13 + Anhang I Teil II(8) setzen den Rahmen: Jedes
              Produkt muss einen{" "}
              <Term id="support_period">Support-Zeitraum</Term> von{" "}
              <strong>mindestens 5 Jahren</strong> ab dem ersten in Verkehr
              gebrachten Gerät haben — länger, wenn die erwartete
              Nutzungsdauer länger ist. Industrie- und Medizingeräte
              benötigen regelmäßig 10–15 Jahre. Wir stellen ihn unter
              Releases → Support-Zeitraum ein, und er erscheint auf jedem
              Endnutzer-Informationsblatt.
            </p>
          ),
        },
        {
          heading: "Was als Sicherheitsupdate zählt",
          body: (
            <p>
              Ein <Term id="security_update">Sicherheitsupdate</Term> ist
              ein Release, dessen Zweck das Schließen einer oder mehrerer
              Schwachstellen ist. Artikel 13(8) verlangt die Lieferung{" "}
              <em>ohne ungebührliche Verzögerung und kostenfrei</em> — der
              Wortlaut zählt im Audit. „Ohne ungebührliche Verzögerung“
              hängt vom Kontext ab: bei einem{" "}
              <Term id="kev">CISA-KEV</Term>-Eintrag Tage, bei einer{" "}
              <Term id="cvss">niedrigen CVSS</Term> sind Wochen mit
              dokumentierter Risikobewertung vertretbar. Seentrix zeichnet
              jedes Release mit Zeitstempel auf — der Nachweis kommt
              automatisch.
            </p>
          ),
        },
        {
          heading: "Der Update-Kanal muss angegeben sein",
          body: (
            <p>
              Die Endnutzerinformationen nach Anhang II müssen angeben,{" "}
              <em>wie</em> Updates die Nutzer erreichen — OTA-Push,
              Paketmanager, Download-Portal, USB-Stick oder Rückruf. Ein
              zugesagter Support-Zeitraum ist wertlos, wenn Nutzer den
              Kanal nicht kennen. Seentrix verlangt unter Releases →
              Support-Zeitraum die Angabe des Kanals und übernimmt ihn in
              die Endnutzer-PDF. Ein Kanalwechsel im Lebenszyklus erfordert
              explizite Kommunikation an betroffene Nutzer.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Wie lang ist der CRA-Mindest-Support-Zeitraum?",
          options: [
            "2 Jahre",
            "5 Jahre",
            "10 Jahre",
            "Die erwartete Nutzungsdauer, ohne feste Untergrenze",
          ],
          correctIndex: 1,
          explanation:
            "CRA Artikel 13 + Anhang I Teil II(8) schreiben mindestens 5 Jahre vor — länger, wenn die erwartete Nutzungsdauer länger ist. „Bis zu 5 Jahre“ ist eine Untergrenze, keine Obergrenze.",
        },
        {
          question:
            "Artikel 13(8): Sicherheitsupdates müssen „ohne ungebührliche Verzögerung und ___“ geliefert werden. Was fehlt?",
          options: [
            "unter kostenpflichtigen Support-Verträgen",
            "kostenfrei",
            "gegen ein schwerebedingtes Entgelt",
            "nach Ermessen des Herstellers",
          ],
          correctIndex: 1,
          explanation:
            "Artikel 13(8): Sicherheitsupdates müssen „ohne ungebührliche Verzögerung und kostenfrei“ bereitgestellt werden. Gebühren für Sicherheitspatches während des Support-Zeitraums verstoßen gegen den CRA.",
        },
        {
          question:
            "Wir haben vor 3 Jahren gelauncht und wollen die Sicherheitsupdates einstellen. Zulässig?",
          options: [
            "Ja, nach 2 Jahren haben wir freie Hand",
            "Nein — der CRA verlangt mindestens 5 Jahre; ab Jahr 3 sind wir im Verstoß",
            "Nur wenn wir jedem Kunden das Geld zurückerstatten",
            "Ja, wenn wir das Produkt einstellen",
          ],
          correctIndex: 1,
          explanation:
            "5 Jahre sind die Rechts-Untergrenze. Support in Jahr 3 einzustellen ist ein Verstoß, auch bei kommerzieller Einstellung des Produkts; wir schulden bestehenden Nutzern Updates für die zugesagte Dauer.",
        },
        {
          question:
            "Warum muss der Update-Kanal auf der Endnutzerinformation stehen?",
          options: [
            "Ist optional",
            "Eine Support-Zusage ist hohl, wenn Nutzer Updates nicht finden oder installieren können",
            "Der CRA verlangt je Produkt einen eigenen Kanal",
            "Die Marktüberwachung stellt den Kanal bereit",
          ],
          correctIndex: 1,
          explanation:
            "Anhang II der Endnutzerinformation verlangt den Update-Kanal, weil die Support-Zusage ohne Liefer- und Installationsmöglichkeit leer bleibt.",
        },
        {
          question:
            "Welcher Seentrix-Screen ist die maßgebliche Quelle für unseren Support-Zeitraum?",
          options: [
            "Einstellungen → Organisation",
            "Produkte → [Produkt] → Releases → Support-Zeitraum",
            "Konformität → Notifizierte Stelle",
            "Einstellungen → Aktivität",
          ],
          correctIndex: 1,
          explanation:
            "Der Support-Zeitraum-Bereich unter Releases jedes Produkts ist der Ort für Startdatum, Enddatum und Kanal. Diese Werte fließen in die Endnutzer-PDF und in das Dashboard-Support-Fenster-Widget.",
        },
      ],
    },
    fr: {
      title: "Période de support et obligations de mise à jour de sécurité",
      summary:
        "L'engagement d'au moins 5 ans pour continuer à livrer des mises à jour de sécurité, et le canal par lequel les utilisateurs les reçoivent.",
      sections: [
        {
          heading: "Le plancher de la période de support",
          body: (
            <p>
              CRA Article 13 + Annexe I Partie II(8) établissent une
              base : chaque produit doit avoir une{" "}
              <Term id="support_period">période de support</Term> d'au moins{" "}
              <strong>5 ans</strong> à compter de la première unité mise
              sur le marché, ou plus longtemps si la durée de vie prévue
              du produit est plus longue. Les appareils industriels et
              médicaux nécessitent souvent 10 à 15 ans. Nous la définissons
              sous Releases → Période de support, et elle figure sur chaque
              fiche d'information destinée aux utilisateurs finaux.
            </p>
          ),
        },
        {
          heading: "Ce qui compte comme mise à jour de sécurité",
          body: (
            <p>
              Une <Term id="security_update">mise à jour de sécurité</Term>{" "}
              est une version dont l'objet est de corriger une ou plusieurs
              vulnérabilités. L'Article 13(8) nous impose de les livrer{" "}
              <em>sans retard injustifié et gratuitement</em> — ce libellé
              compte lors des audits. « Sans retard injustifié » dépend
              du contexte : pour un CVE inscrit au{" "}
              <Term id="kev">CISA KEV</Term>, quelques jours. Pour une
              découverte à{" "}
              <Term id="cvss">CVSS faible</Term>, des semaines peuvent être
              défendables si votre évaluation des risques le documente.
              Seentrix horodate chaque version, donc la preuve est
              automatique.
            </p>
          ),
        },
        {
          heading: "Le canal de mise à jour doit être déclaré",
          body: (
            <p>
              Les informations destinées aux utilisateurs finaux prévues par
              l'Annexe II doivent indiquer{" "}
              <em>comment</em> les mises à jour parviennent aux utilisateurs
              — push OTA, gestionnaire de paquets, portail de téléchargement,
              clé USB ou rappel. Une période de support déclarée est sans
              valeur si les utilisateurs ne connaissent pas le canal.
              L'onglet Releases → Période de support de Seentrix nous demande
              de nommer le canal et l'intègre dans le PDF d'informations
              destinées aux utilisateurs finaux généré automatiquement.
              Changer de canal en cours de cycle de vie nécessite une
              communication explicite aux utilisateurs concernés.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quelle est la durée minimale de la période de support au titre du CRA ?",
          options: [
            "2 ans",
            "5 ans",
            "10 ans",
            "La durée de vie prévue du produit, sans plancher fixe",
          ],
          correctIndex: 1,
          explanation:
            "CRA Article 13 + Annexe I Partie II(8) imposent un minimum de 5 ans, ou plus si la durée de vie prévue du produit est plus longue. « Jusqu'à 5 ans » est un plancher, pas un plafond.",
        },
        {
          question:
            "L'Article 13(8) dispose que les mises à jour de sécurité doivent être fournies « sans retard injustifié et ___ » — qu'est-ce qui complète la phrase ?",
          options: [
            "dans le cadre de contrats de support payant",
            "gratuitement",
            "contre une redevance proportionnelle à la sévérité",
            "à la discrétion du fabricant",
          ],
          correctIndex: 1,
          explanation:
            "Article 13(8) : les mises à jour de sécurité doivent être fournies « sans retard injustifié et gratuitement ». Facturer des correctifs de sécurité pour des produits dans leur période de support constitue une violation du CRA.",
        },
        {
          question:
            "Nous avons lancé un produit il y a 3 ans et souhaitons arrêter de livrer des mises à jour de sécurité. Est-ce légal ?",
          options: [
            "Oui, après 2 ans nous pouvons faire ce que nous voulons",
            "Non — le CRA impose au moins 5 ans, donc nous sommes en infraction à l'année 3",
            "Seulement si nous remboursons chaque client",
            "Oui, si nous arrêtons le produit",
          ],
          correctIndex: 1,
          explanation:
            "5 ans est le plancher légal. Abandonner le support à l'année 3 est une infraction même si nous arrêtons le produit commercialement ; nous devons des mises à jour de sécurité aux utilisateurs existants pour la période déclarée.",
        },
        {
          question:
            "Pourquoi le canal de mise à jour doit-il figurer sur les informations destinées aux utilisateurs finaux ?",
          options: [
            "C'est facultatif",
            "Une promesse de période de support est vide de sens si les utilisateurs ne peuvent pas trouver ni installer les mises à jour",
            "Le CRA exige un canal unique par produit",
            "L'autorité de surveillance du marché fournit le canal à notre place",
          ],
          correctIndex: 1,
          explanation:
            "L'Annexe II des informations destinées aux utilisateurs finaux exige le canal de mise à jour car l'engagement de période de support n'a pas de sens sans un moyen pour les utilisateurs de recevoir et d'installer les mises à jour.",
        },
        {
          question:
            "Quel écran Seentrix est la source faisant autorité pour notre période de support déclarée ?",
          options: [
            "Paramètres → Organisation",
            "Produits → [produit] → Releases → Période de support",
            "Conformité → Organisme notifié",
            "Paramètres → Activité",
          ],
          correctIndex: 1,
          explanation:
            "La section Releases → Période de support de chaque page produit est l'endroit où nous déclarons la date de début, la date de fin et le canal de mise à jour. Ces valeurs alimentent le PDF d'informations destinées aux utilisateurs finaux et le widget de fenêtre de support du tableau de bord.",
        },
      ],
    },
    it: {
      title: "Periodo di supporto e obblighi di aggiornamento di sicurezza",
      summary:
        "L'impegno di almeno 5 anni a continuare a rilasciare aggiornamenti di sicurezza e il canale attraverso cui gli utenti li ricevono.",
      sections: [
        {
          heading: "Il livello minimo del periodo di supporto",
          body: (
            <p>
              CRA Articolo 13 + Allegato I Parte II(8) stabiliscono una
              base: ogni prodotto deve avere un{" "}
              <Term id="support_period">periodo di supporto</Term> di almeno{" "}
              <strong>5 anni</strong> dalla prima unità immessa sul mercato,
              o più a lungo se la vita utile prevista del prodotto è più
              lunga. I dispositivi industriali e medicali richiedono
              regolarmente 10–15 anni. Lo impostiamo sotto Releases →
              Periodo di supporto, e appare su ogni scheda informativa
              per l'utente finale.
            </p>
          ),
        },
        {
          heading: "Cosa conta come aggiornamento di sicurezza",
          body: (
            <p>
              Un <Term id="security_update">aggiornamento di sicurezza</Term>{" "}
              è una release il cui scopo è correggere una o più
              vulnerabilità. L'Articolo 13(8) ci impone di distribuirli{" "}
              <em>senza indebito ritardo e gratuitamente</em> — questa
              formulazione conta negli audit. «Senza indebito ritardo»
              dipende dal contesto: per un CVE iscritto al{" "}
              <Term id="kev">CISA KEV</Term>, giorni. Per una scoperta a{" "}
              <Term id="cvss">CVSS basso</Term>, settimane possono essere
              difendibili se la valutazione del rischio lo documenta.
              Seentrix registra con timestamp ogni release, quindi la prova
              è automatica.
            </p>
          ),
        },
        {
          heading: "Il canale di aggiornamento deve essere dichiarato",
          body: (
            <p>
              Le informazioni per l'utente finale previste dall'Allegato II
              devono indicare{" "}
              <em>come</em> gli aggiornamenti raggiungono gli utenti —
              push OTA, gestore di pacchetti, portale di download, chiavetta
              USB o richiamo. Un periodo di supporto dichiarato è privo di
              significato se gli utenti non conoscono il canale. La scheda
              Releases → Periodo di supporto di Seentrix ci chiede di
              indicare il canale e lo include nel PDF informativo per
              l'utente finale generato automaticamente. Cambiare il canale
              durante il ciclo di vita richiede una comunicazione esplicita
              agli utenti interessati.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Qual è la durata minima del periodo di supporto ai sensi del CRA?",
          options: [
            "2 anni",
            "5 anni",
            "10 anni",
            "La vita utile prevista del prodotto, senza un minimo fisso",
          ],
          correctIndex: 1,
          explanation:
            "CRA Articolo 13 + Allegato I Parte II(8) impongono un minimo di 5 anni, o più se la vita utile prevista del prodotto è più lunga. «Fino a 5 anni» è un minimo, non un massimo.",
        },
        {
          question:
            "L'Articolo 13(8) prevede che gli aggiornamenti di sicurezza debbano essere forniti «senza indebito ritardo e ___» — cosa completa la frase?",
          options: [
            "nell'ambito di contratti di supporto a pagamento",
            "gratuitamente",
            "contro un corrispettivo proporzionale alla gravità",
            "a discrezione del fabbricante",
          ],
          correctIndex: 1,
          explanation:
            "Articolo 13(8): gli aggiornamenti di sicurezza devono essere forniti «senza indebito ritardo e gratuitamente». Addebitare costi per patch di sicurezza per prodotti nel loro periodo di supporto viola il CRA.",
        },
        {
          question:
            "Abbiamo lanciato un prodotto 3 anni fa e vogliamo smettere di rilasciare aggiornamenti di sicurezza. È legale?",
          options: [
            "Sì, dopo 2 anni possiamo fare quello che vogliamo",
            "No — il CRA impone almeno 5 anni, quindi siamo in violazione al terzo anno",
            "Solo se rimborsiamo ogni cliente",
            "Sì, se discontinuiamo il prodotto",
          ],
          correctIndex: 1,
          explanation:
            "5 anni è il minimo legale. Interrompere il supporto al terzo anno è una violazione anche se discontinuiamo il prodotto commercialmente; dobbiamo aggiornamenti di sicurezza agli utenti esistenti per il periodo dichiarato.",
        },
        {
          question:
            "Perché il canale di aggiornamento deve essere indicato nelle informazioni per l'utente finale?",
          options: [
            "È facoltativo",
            "Una promessa di periodo di supporto è priva di significato se gli utenti non riescono a trovare o installare gli aggiornamenti",
            "Il CRA richiede un canale unico per prodotto",
            "L'autorità di vigilanza del mercato fornisce il canale al posto nostro",
          ],
          correctIndex: 1,
          explanation:
            "L'Allegato II delle informazioni per l'utente finale richiede il canale di aggiornamento perché l'impegno sul periodo di supporto è privo di significato senza un modo per gli utenti di ricevere e installare gli aggiornamenti.",
        },
        {
          question:
            "Quale schermata Seentrix è la fonte autorevole per il nostro periodo di supporto dichiarato?",
          options: [
            "Impostazioni → Organizzazione",
            "Prodotti → [prodotto] → Releases → Periodo di supporto",
            "Conformità → Organismo notificato",
            "Impostazioni → Attività",
          ],
          correctIndex: 1,
          explanation:
            "La sezione Releases → Periodo di supporto di ogni pagina prodotto è il luogo in cui dichiariamo la data di inizio, la data di fine e il canale di aggiornamento. Questi valori alimentano il PDF informativo per l'utente finale e il widget della finestra di supporto nel dashboard.",
        },
      ],
    },
  },
};

export default lesson;
