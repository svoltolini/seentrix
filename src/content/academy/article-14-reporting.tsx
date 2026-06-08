/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "article-14-reporting",
  duration: "7 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Article 14 incident reporting (24h / 72h / 14d)",
      summary:
        "The three-stage clock that starts when we become aware of an actively-exploited vulnerability or severe incident. Miss a window and the fine is measured in millions.",
      sections: [
        {
          heading: "What triggers the clock",
          body: (
            <>
              <p>
                Article 14 is triggered the moment we <em>become aware</em>{" "}
                of one of two things in our product:
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  An <Term id="actively_exploited">actively exploited</Term>{" "}
                  vulnerability (credible real-world evidence, KEV entry,
                  weaponised PoC).
                </li>
                <li>
                  A <em>severe incident</em> affecting the product's
                  security.
                </li>
              </ul>
              <p className="mt-3">
                “Becoming aware” is a factual standard — the clock
                starts with the first credible internal signal, not when
                the incident review board finalises a decision. Seentrix's
                Incidents → New incident is the action that timestamps this
                moment in our audit trail.
              </p>
            </>
          ),
        },
        {
          heading: "The three windows",
          body: (
            <>
              <ul className="space-y-2 pl-5 [list-style:disc]">
                <li>
                  <strong>24 hours — <Term id="early_warning">early warning</Term>.</strong>{" "}
                  Short. Name the incident, whether we suspect malicious
                  activity, affected EU member states. Can be terse; we'll
                  refine later.
                </li>
                <li>
                  <strong>72 hours — <Term id="incident_report">incident report</Term>.</strong>{" "}
                  Severity assessment, indicators of compromise (IOCs),
                  affected products and users, mitigation in progress.
                  First substantive submission.
                </li>
                <li>
                  <strong>14 days — <Term id="final_report">final report</Term>.</strong>{" "}
                  Root-cause analysis, corrective measures (taken and
                  planned), residual risk, and how we communicated to
                  affected users.
                </li>
              </ul>
              <p className="mt-3">
                All three are filed via ENISA's single reporting platform.
                Seentrix prepares the PDF and renders the countdown rings
                so the team sees the remaining time, not just a deadline.
              </p>
            </>
          ),
        },
        {
          heading: "User notification (Article 14(6))",
          body: (
            <p>
              Alongside the ENISA reports, Article 14(6) mandates that we
              inform <em>affected users</em> of any actively-exploited
              vulnerability and provide mitigation guidance — “without
              undue delay.” The Incidents detail page has a notification
              composer that records the content and the send timestamp.
              Missing the user-notification step is the most common
              Article 14 failure found in post-incident audits.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "When does the Article 14 clock start?",
          options: [
            "When a CVE is publicly disclosed",
            "When our incident-review board formally classifies the issue",
            "The moment we become aware of the incident or actively-exploited vulnerability",
            "When a user files a complaint",
          ],
          correctIndex: 2,
          explanation:
            "“Becoming aware” starts the clock. That's the first credible internal signal — not the formal classification decision and not public disclosure. The Incidents → New incident action timestamps it.",
        },
        {
          question:
            "Which report must reach ENISA within 72 hours?",
          options: [
            "Early warning",
            "Incident report",
            "Final report",
            "User notification",
          ],
          correctIndex: 1,
          explanation:
            "24h = early warning, 72h = incident report, 14 days = final report. The 72-hour incident report is the first substantive filing with severity, IOCs, and mitigation in progress.",
        },
        {
          question:
            "In which phase do we file a root-cause analysis?",
          options: [
            "Early warning",
            "Incident report",
            "Final report (14 days)",
            "In a post-mortem, outside Article 14",
          ],
          correctIndex: 2,
          explanation:
            "The 14-day final report is where root-cause analysis, corrective measures, and residual risk land. Before that we often don't have the full picture.",
        },
        {
          question:
            "Article 14(6) requires us to notify affected users of actively-exploited vulnerabilities. How quickly?",
          options: [
            "Within 24 hours of ENISA filing",
            "Without undue delay",
            "Within the 14-day final-report window",
            "Only if the incident is still ongoing after 14 days",
          ],
          correctIndex: 1,
          explanation:
            "“Without undue delay” is the Article 14(6) standard for user notification. Missing the user-notification step is the most common post-incident audit finding.",
        },
        {
          question:
            "An intern discovers an actively-exploited CVE in our product and tells the lead engineer at 17:00 Friday. The incident-review board won't meet until Monday 9:00. When did the Article 14 clock start?",
          options: [
            "Monday 9:00, when the board reviews",
            "Friday 17:00, when we became aware",
            "When we publicly disclose",
            "Whenever we file with ENISA",
          ],
          correctIndex: 1,
          explanation:
            "“Becoming aware” is factual, not procedural. The clock started Friday 17:00. That means the 24-hour early-warning deadline is Saturday 17:00 — weekends and bank holidays don't extend the window.",
        },
      ],
    },
    de: {
      title: "Artikel 14 — Vorfallsmeldung (24h / 72h / 14T)",
      summary:
        "Der Dreistufen-Zähler ab Kenntnisnahme einer aktiv ausgenutzten Schwachstelle oder eines schweren Vorfalls. Verpasste Frist = Millionen-Bußgeld.",
      sections: [
        {
          heading: "Was den Zähler auslöst",
          body: (
            <>
              <p>
                Artikel 14 wird in dem Moment ausgelöst, in dem wir{" "}
                <em>Kenntnis</em> von einem dieser beiden Fälle erlangen:
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Einer <Term id="actively_exploited">aktiv ausgenutzten</Term>{" "}
                  Schwachstelle (glaubwürdige Realweltbelege, KEV-Eintrag,
                  ausgenutzter PoC).
                </li>
                <li>
                  Einem <em>schweren Vorfall</em>, der die Produktsicherheit
                  betrifft.
                </li>
              </ul>
              <p className="mt-3">
                „Kenntnisnahme“ ist faktisch — der Zähler läuft ab dem
                ersten glaubwürdigen internen Signal, nicht ab der
                formellen Entscheidung eines Gremiums. In Seentrix setzt
                Vorfälle → Neuer Vorfall diesen Zeitstempel.
              </p>
            </>
          ),
        },
        {
          heading: "Die drei Fristen",
          body: (
            <>
              <ul className="space-y-2 pl-5 [list-style:disc]">
                <li>
                  <strong>24 Stunden — <Term id="early_warning">Frühwarnung</Term>.</strong>{" "}
                  Kurz. Vorfall benennen, Verdacht auf böswillige Aktivität,
                  betroffene EU-Mitgliedstaaten. Darf knapp sein — wir
                  verfeinern später.
                </li>
                <li>
                  <strong>72 Stunden — <Term id="incident_report">Vorfallsbericht</Term>.</strong>{" "}
                  Schweregrad, Indicators of Compromise (IOCs), betroffene
                  Produkte und Nutzer, laufende Abhilfe. Erste inhaltliche
                  Meldung.
                </li>
                <li>
                  <strong>14 Tage — <Term id="final_report">Abschlussbericht</Term>.</strong>{" "}
                  Root-Cause-Analyse, ergriffene und geplante Maßnahmen,
                  Restrisiko und die Kommunikation an betroffene Nutzer.
                </li>
              </ul>
              <p className="mt-3">
                Alle drei werden über die einheitliche ENISA-Meldeplattform
                eingereicht. Seentrix erstellt die PDF und zeigt
                Countdown-Ringe — das Team sieht die Restzeit, nicht nur
                einen Stichtag.
              </p>
            </>
          ),
        },
        {
          heading: "Nutzerbenachrichtigung (Artikel 14(6))",
          body: (
            <p>
              Zusätzlich zu den ENISA-Meldungen verpflichtet Artikel 14(6)
              uns, <em>betroffene Nutzer</em> über aktiv ausgenutzte
              Schwachstellen zu informieren und Abhilfeanweisungen zu
              geben — „ohne ungebührliche Verzögerung“. Die
              Vorfallsdetailseite hat einen Benachrichtigungs-Composer, der
              Inhalt und Versanddatum erfasst. Fehlende
              Nutzerbenachrichtigung ist der häufigste Audit-Befund nach
              Vorfällen.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Wann beginnt die Artikel-14-Frist?",
          options: [
            "Bei öffentlicher CVE-Offenlegung",
            "Wenn das Incident-Gremium den Fall formell einstuft",
            "Mit der Kenntnisnahme des Vorfalls oder der aktiv ausgenutzten Schwachstelle",
            "Bei Beschwerde eines Nutzers",
          ],
          correctIndex: 2,
          explanation:
            "„Kenntnisnahme“ startet die Frist. Das ist das erste glaubwürdige interne Signal — nicht die formale Einstufung und nicht die öffentliche Offenlegung. Vorfälle → Neuer Vorfall setzt den Zeitstempel.",
        },
        {
          question: "Welche Meldung muss binnen 72 Stunden bei der ENISA sein?",
          options: [
            "Frühwarnung",
            "Vorfallsbericht",
            "Abschlussbericht",
            "Nutzerbenachrichtigung",
          ],
          correctIndex: 1,
          explanation:
            "24h = Frühwarnung, 72h = Vorfallsbericht, 14 Tage = Abschlussbericht. Der 72-Stunden-Bericht ist die erste inhaltliche Meldung mit Schweregrad, IOCs und laufender Abhilfe.",
        },
        {
          question: "In welcher Phase reichen wir eine Root-Cause-Analyse ein?",
          options: [
            "Frühwarnung",
            "Vorfallsbericht",
            "Abschlussbericht (14 Tage)",
            "In einer Post-Mortem außerhalb von Artikel 14",
          ],
          correctIndex: 2,
          explanation:
            "Der 14-Tage-Abschlussbericht enthält Root-Cause, ergriffene Maßnahmen und Restrisiko. Vorher fehlt oft noch das Gesamtbild.",
        },
        {
          question:
            "Artikel 14(6) verlangt, betroffene Nutzer über aktiv ausgenutzte Schwachstellen zu informieren. Wie schnell?",
          options: [
            "Binnen 24 Stunden nach ENISA-Meldung",
            "Ohne ungebührliche Verzögerung",
            "Innerhalb der 14-Tage-Abschlussfrist",
            "Nur wenn der Vorfall nach 14 Tagen noch läuft",
          ],
          correctIndex: 1,
          explanation:
            "„Ohne ungebührliche Verzögerung“ ist der Maßstab nach Artikel 14(6). Fehlende Nutzerbenachrichtigung ist der häufigste Audit-Befund.",
        },
        {
          question:
            "Ein Praktikant entdeckt eine aktiv ausgenutzte CVE Freitag 17:00 und informiert die Teamleitung. Das Incident-Gremium tagt erst Montag 9:00. Wann begann die Frist?",
          options: [
            "Montag 9:00, bei Gremiumsbewertung",
            "Freitag 17:00, mit Kenntnisnahme",
            "Bei öffentlicher Offenlegung",
            "Wenn wir der ENISA melden",
          ],
          correctIndex: 1,
          explanation:
            "Kenntnisnahme ist faktisch, nicht prozedural. Frist ab Freitag 17:00. Die 24-Stunden-Frühwarnfrist endet Samstag 17:00 — Wochenende und Feiertage verschieben nichts.",
        },
      ],
    },
    fr: {
      title: "Article 14 — notification d'incident (24h / 72h / 14j)",
      summary:
        "Le chronomètre en trois étapes qui démarre dès que nous avons connaissance d'une vulnérabilité activement exploitée ou d'un incident grave. Manquer une fenêtre expose à des amendes se chiffrant en millions.",
      sections: [
        {
          heading: "Ce qui déclenche le chronomètre",
          body: (
            <>
              <p>
                L'article 14 est déclenché dès le moment où nous{" "}
                <em>prenons connaissance</em> de l'un de ces deux événements
                dans notre produit :
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Une <Term id="actively_exploited">vulnérabilité activement exploitée</Term>{" "}
                  (preuve réelle crédible, entrée KEV,
                  PoC armé).
                </li>
                <li>
                  Un <em>incident grave</em> affectant la sécurité
                  du produit.
                </li>
              </ul>
              <p className="mt-3">
                « Prendre connaissance » est un critère factuel — le
                chronomètre démarre au premier signal interne crédible, et
                non lorsque le comité de révision des incidents rend une
                décision formelle. Dans Seentrix, l'action
                Incidents → Nouvel incident horodate ce moment dans
                notre piste d'audit.
              </p>
            </>
          ),
        },
        {
          heading: "Les trois fenêtres",
          body: (
            <>
              <ul className="space-y-2 pl-5 [list-style:disc]">
                <li>
                  <strong>24 heures — <Term id="early_warning">notification d'alerte précoce</Term>.</strong>{" "}
                  Court. Nommer l'incident, signaler tout soupçon d'activité
                  malveillante, indiquer les États membres de l'UE concernés.
                  Peut être succinct ; nous affinerons ensuite.
                </li>
                <li>
                  <strong>72 heures — <Term id="incident_report">rapport d'incident</Term>.</strong>{" "}
                  Évaluation de la gravité, indicateurs de compromission (IOCs),
                  produits et utilisateurs affectés, mesures d'atténuation en
                  cours. Première soumission substantielle.
                </li>
                <li>
                  <strong>14 jours — <Term id="final_report">rapport final</Term>.</strong>{" "}
                  Analyse des causes profondes, mesures correctives (prises et
                  prévues), risque résiduel et modalités de communication
                  aux utilisateurs concernés.
                </li>
              </ul>
              <p className="mt-3">
                Les trois rapports sont déposés via la plateforme de
                notification unique d'ENISA. Seentrix prépare le PDF et
                affiche des anneaux de décompte afin que l'équipe voie le
                temps restant, et non seulement une échéance.
              </p>
            </>
          ),
        },
        {
          heading: "Notification des utilisateurs (article 14(6))",
          body: (
            <p>
              Parallèlement aux rapports ENISA, l'article 14(6) nous impose
              d'informer les <em>utilisateurs concernés</em> de toute
              vulnérabilité activement exploitée et de leur fournir des
              conseils d'atténuation — « sans retard injustifié ». La page
              de détail d'un incident dispose d'un compositeur de
              notification qui enregistre le contenu et l'horodatage
              d'envoi. L'absence de notification aux utilisateurs est le
              manquement à l'article 14 le plus fréquemment relevé lors des
              audits post-incident.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Quand démarre le chronomètre de l'article 14 ?",
          options: [
            "Lors de la divulgation publique d'un CVE",
            "Lorsque notre comité de révision des incidents classe formellement le problème",
            "Dès le moment où nous prenons connaissance de l'incident ou de la vulnérabilité activement exploitée",
            "Lorsqu'un utilisateur dépose une plainte",
          ],
          correctIndex: 2,
          explanation:
            "« Prendre connaissance » déclenche le chronomètre. C'est le premier signal interne crédible — ni la décision formelle de classification, ni la divulgation publique. L'action Incidents → Nouvel incident l'horodate.",
        },
        {
          question:
            "Quel rapport doit parvenir à ENISA dans les 72 heures ?",
          options: [
            "Notification d'alerte précoce",
            "Rapport d'incident",
            "Rapport final",
            "Notification des utilisateurs",
          ],
          correctIndex: 1,
          explanation:
            "24h = notification d'alerte précoce, 72h = rapport d'incident, 14 jours = rapport final. Le rapport d'incident à 72 heures est la première soumission substantielle avec gravité, IOCs et mesures d'atténuation en cours.",
        },
        {
          question:
            "À quelle phase déposons-nous une analyse des causes profondes ?",
          options: [
            "Notification d'alerte précoce",
            "Rapport d'incident",
            "Rapport final (14 jours)",
            "Dans un post-mortem, hors article 14",
          ],
          correctIndex: 2,
          explanation:
            "Le rapport final à 14 jours est celui qui contient l'analyse des causes profondes, les mesures correctives et le risque résiduel. Avant cela, nous n'avons souvent pas encore l'image complète.",
        },
        {
          question:
            "L'article 14(6) nous impose de notifier les utilisateurs concernés des vulnérabilités activement exploitées. Dans quel délai ?",
          options: [
            "Dans les 24 heures suivant le dépôt auprès d'ENISA",
            "Sans retard injustifié",
            "Dans la fenêtre du rapport final à 14 jours",
            "Uniquement si l'incident est toujours en cours après 14 jours",
          ],
          correctIndex: 1,
          explanation:
            "« Sans retard injustifié » est la norme de l'article 14(6) pour la notification des utilisateurs. L'absence de notification aux utilisateurs est le constat d'audit post-incident le plus fréquent.",
        },
        {
          question:
            "Un stagiaire découvre un CVE activement exploité dans notre produit et en informe l'ingénieur responsable le vendredi à 17h00. Le comité de révision des incidents ne se réunira que le lundi à 9h00. Quand le chronomètre de l'article 14 a-t-il démarré ?",
          options: [
            "Lundi à 9h00, lors de l'examen par le comité",
            "Vendredi à 17h00, dès notre prise de connaissance",
            "Lors de la divulgation publique",
            "Lorsque nous déposons auprès d'ENISA",
          ],
          correctIndex: 1,
          explanation:
            "« Prendre connaissance » est factuel, non procédural. Le chronomètre a démarré vendredi à 17h00. Cela signifie que l'échéance de l'alerte précoce à 24 heures est samedi à 17h00 — les week-ends et jours fériés ne prolongent pas la fenêtre.",
        },
      ],
    },
    it: {
      title: "Articolo 14 — notifica degli incidenti (24h / 72h / 14g)",
      summary:
        "Il cronometro in tre fasi che scatta nel momento in cui veniamo a conoscenza di una vulnerabilità sfruttata attivamente o di un incidente grave. Mancando una finestra, la sanzione si misura in milioni.",
      sections: [
        {
          heading: "Cosa fa scattare il cronometro",
          body: (
            <>
              <p>
                L'articolo 14 scatta nel momento in cui{" "}
                <em>veniamo a conoscenza</em> di uno dei seguenti due
                eventi nel nostro prodotto:
              </p>
              <ul className="mt-2 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Una <Term id="actively_exploited">vulnerabilità sfruttata attivamente</Term>{" "}
                  (prove concrete e credibili nel mondo reale, voce KEV,
                  PoC armato).
                </li>
                <li>
                  Un <em>incidente grave</em> che compromette la
                  sicurezza del prodotto.
                </li>
              </ul>
              <p className="mt-3">
                «Venire a conoscenza» è un criterio fattuale — il
                cronometro parte dal primo segnale interno credibile, non
                da quando il comitato di revisione degli incidenti formalizza
                una decisione. In Seentrix, l'azione
                Incidenti → Nuovo incidente registra questo momento
                nella pista di audit.
              </p>
            </>
          ),
        },
        {
          heading: "Le tre finestre",
          body: (
            <>
              <ul className="space-y-2 pl-5 [list-style:disc]">
                <li>
                  <strong>24 ore — <Term id="early_warning">notifica di preallarme</Term>.</strong>{" "}
                  Breve. Denominare l'incidente, segnalare eventuali sospetti
                  di attività dolosa, indicare gli Stati membri UE coinvolti.
                  Può essere sintetica; affineremo in seguito.
                </li>
                <li>
                  <strong>72 ore — <Term id="incident_report">relazione sull'incidente</Term>.</strong>{" "}
                  Valutazione della gravità, indicatori di compromissione (IOC),
                  prodotti e utenti interessati, misure di attenuazione in
                  corso. Prima comunicazione sostanziale.
                </li>
                <li>
                  <strong>14 giorni — <Term id="final_report">relazione finale</Term>.</strong>{" "}
                  Analisi delle cause profonde, misure correttive (adottate e
                  pianificate), rischio residuo e modalità di comunicazione
                  agli utenti interessati.
                </li>
              </ul>
              <p className="mt-3">
                Tutte e tre le relazioni sono presentate tramite la
                piattaforma di notifica unica di ENISA. Seentrix prepara
                il PDF e visualizza gli anelli di conto alla rovescia così
                che il team veda il tempo rimanente, non solo una scadenza.
              </p>
            </>
          ),
        },
        {
          heading: "Notifica agli utenti (articolo 14(6))",
          body: (
            <p>
              Oltre alle segnalazioni a ENISA, l'articolo 14(6) ci impone
              di informare gli <em>utenti interessati</em> di qualsiasi
              vulnerabilità sfruttata attivamente e di fornire loro
              indicazioni di attenuazione — «senza indebito ritardo». La
              pagina di dettaglio dell'incidente dispone di un compositore
              di notifiche che registra il contenuto e l'orario di invio.
              L'omissione della notifica agli utenti è il mancamento
              all'articolo 14 più frequentemente rilevato negli audit
              post-incidente.
            </p>
          ),
        },
      ],
      quiz: [
        {
          question: "Quando inizia il cronometro dell'articolo 14?",
          options: [
            "Alla divulgazione pubblica di un CVE",
            "Quando il nostro comitato di revisione degli incidenti classifica formalmente il problema",
            "Nel momento in cui veniamo a conoscenza dell'incidente o della vulnerabilità sfruttata attivamente",
            "Quando un utente presenta un reclamo",
          ],
          correctIndex: 2,
          explanation:
            "«Venire a conoscenza» fa scattare il cronometro. È il primo segnale interno credibile — non la decisione formale di classificazione né la divulgazione pubblica. L'azione Incidenti → Nuovo incidente lo registra con un timestamp.",
        },
        {
          question:
            "Quale relazione deve pervenire a ENISA entro 72 ore?",
          options: [
            "Notifica di preallarme",
            "Relazione sull'incidente",
            "Relazione finale",
            "Notifica agli utenti",
          ],
          correctIndex: 1,
          explanation:
            "24h = notifica di preallarme, 72h = relazione sull'incidente, 14 giorni = relazione finale. La relazione sull'incidente a 72 ore è la prima comunicazione sostanziale con gravità, IOC e misure di attenuazione in corso.",
        },
        {
          question:
            "In quale fase presentiamo un'analisi delle cause profonde?",
          options: [
            "Notifica di preallarme",
            "Relazione sull'incidente",
            "Relazione finale (14 giorni)",
            "In un post-mortem, al di fuori dell'articolo 14",
          ],
          correctIndex: 2,
          explanation:
            "La relazione finale a 14 giorni è quella che contiene l'analisi delle cause profonde, le misure correttive e il rischio residuo. Prima di allora spesso non disponiamo ancora del quadro completo.",
        },
        {
          question:
            "L'articolo 14(6) ci impone di notificare gli utenti interessati delle vulnerabilità sfruttate attivamente. Entro quanto tempo?",
          options: [
            "Entro 24 ore dalla presentazione a ENISA",
            "Senza indebito ritardo",
            "Entro la finestra della relazione finale a 14 giorni",
            "Solo se l'incidente è ancora in corso dopo 14 giorni",
          ],
          correctIndex: 1,
          explanation:
            "«Senza indebito ritardo» è lo standard dell'articolo 14(6) per la notifica agli utenti. L'omissione della notifica agli utenti è il rilievo di audit post-incidente più frequente.",
        },
        {
          question:
            "Un tirocinante scopre un CVE sfruttato attivamente nel nostro prodotto e lo comunica all'ingegnere responsabile venerdì alle 17:00. Il comitato di revisione degli incidenti si riunirà solo lunedì alle 9:00. Quando ha iniziato a decorrere il cronometro dell'articolo 14?",
          options: [
            "Lunedì alle 9:00, all'esame del comitato",
            "Venerdì alle 17:00, quando siamo venuti a conoscenza del fatto",
            "Al momento della divulgazione pubblica",
            "Quando presentiamo la segnalazione a ENISA",
          ],
          correctIndex: 1,
          explanation:
            "«Venire a conoscenza» è un criterio fattuale, non procedurale. Il cronometro è partito venerdì alle 17:00. Ciò significa che la scadenza per la notifica di preallarme a 24 ore è sabato alle 17:00 — i fine settimana e i giorni festivi non prorogano la finestra.",
        },
      ],
    },
  },
};

export default lesson;
