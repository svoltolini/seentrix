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
  },
};

export default lesson;
