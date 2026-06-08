import type { Locale } from "./pdf-messages";

/**
 * Localised labels for the End-User Cybersecurity Information Sheet
 * (CRA Article 13 + Annex II(3)). This document ships WITH the product on the
 * EU market, so per the CRA it must be in a language understood by users in the
 * market where the product is sold — we generate it in the user's UI language.
 *
 * Kept separate from `pdf-messages.ts` because this sheet isn't part of the
 * `DocumentType` union used by the documents table; it's streamed on demand.
 */

type Messages = Record<string, string>;

const en: Messages = {
  title: "End-User Cybersecurity Information",
  subtitle:
    "Document required by CRA Article 13 and Annex II(3). Accompanies the product when placed on the EU market.",
  section1: "1. Product identification",
  productName: "Product name",
  productType: "Type",
  productIdentification: "Identification",
  section2: "2. Manufacturer and cybersecurity contact",
  manufacturer: "Manufacturer",
  manufacturerAddress: "Address",
  cybersecurityContact: "Cybersecurity contact",
  website: "Website",
  section3: "3. Support period and update channel",
  supportStart: "Support starts",
  supportEnd: "Support ends",
  updateChannel: "Update channel",
  updateChannelTbd: "Communicated to users at product rollout",
  supportNote:
    "Security updates are provided free of charge and without undue delay throughout the support period (CRA Article 13(8)).",
  section4: "4. Reporting vulnerabilities",
  disclosureIntro:
    "We operate a coordinated vulnerability disclosure policy. Please report security issues through the channel below — we acknowledge within 5 business days.",
  disclosureUrl: "Reporting URL",
  section5: "5. Secure-use guidance",
  secureUseDefault:
    "Use the product according to the accompanying user manual. Keep the product current with security updates. Replace any factory-default credentials before deployment.",
  section6: "6. Declaration of Conformity reference",
  docVersion: "DoC version",
  docIssued: "Issued on",
  intendedUse: "Intended use",
  knownRisks: "Known and foreseeable cybersecurity risks",
  knownRisksNone:
    "No specific risks identified beyond standard secure-use practices.",
  docUrl: "Where the EU Declaration of Conformity can be accessed",
};

const de: Messages = {
  title: "Cybersicherheitsinformationen für Endnutzer",
  subtitle:
    "Gemäß CRA Artikel 13 und Anhang II(3) erforderliches Dokument. Begleitet das Produkt beim Inverkehrbringen auf dem EU-Markt.",
  section1: "1. Produktidentifikation",
  productName: "Produktname",
  productType: "Typ",
  productIdentification: "Identifikation",
  section2: "2. Hersteller und Cybersicherheitskontakt",
  manufacturer: "Hersteller",
  manufacturerAddress: "Anschrift",
  cybersecurityContact: "Cybersicherheitskontakt",
  website: "Website",
  section3: "3. Unterstützungszeitraum und Aktualisierungskanal",
  supportStart: "Unterstützung beginnt",
  supportEnd: "Unterstützung endet",
  updateChannel: "Aktualisierungskanal",
  updateChannelTbd: "Wird den Nutzern bei der Produkteinführung mitgeteilt",
  supportNote:
    "Sicherheitsupdates werden während des gesamten Unterstützungszeitraums kostenlos und ohne ungebührliche Verzögerung bereitgestellt (CRA Artikel 13(8)).",
  section4: "4. Meldung von Schwachstellen",
  disclosureIntro:
    "Wir betreiben eine Richtlinie zur koordinierten Offenlegung von Schwachstellen. Bitte melden Sie Sicherheitsprobleme über den unten genannten Kanal — wir bestätigen den Eingang innerhalb von 5 Werktagen.",
  disclosureUrl: "Melde-URL",
  section5: "5. Hinweise zur sicheren Nutzung",
  secureUseDefault:
    "Verwenden Sie das Produkt gemäß dem beiliegenden Benutzerhandbuch. Halten Sie das Produkt mit Sicherheitsupdates aktuell. Ersetzen Sie werkseitige Standard-Zugangsdaten vor der Inbetriebnahme.",
  section6: "6. Verweis auf die Konformitätserklärung",
  docVersion: "Version der Konformitätserklärung",
  docIssued: "Ausgestellt am",
  intendedUse: "Verwendungszweck",
  knownRisks: "Bekannte und vorhersehbare Cybersicherheitsrisiken",
  knownRisksNone:
    "Über die üblichen Praktiken zur sicheren Nutzung hinaus wurden keine spezifischen Risiken festgestellt.",
  docUrl: "Wo die EU-Konformitätserklärung abgerufen werden kann",
};

const fr: Messages = {
  title: "Informations de cybersécurité pour l’utilisateur final",
  subtitle:
    "Document requis par l’article 13 et l’annexe II(3) du CRA. Accompagne le produit lors de sa mise sur le marché de l’UE.",
  section1: "1. Identification du produit",
  productName: "Nom du produit",
  productType: "Type",
  productIdentification: "Identification",
  section2: "2. Fabricant et contact de cybersécurité",
  manufacturer: "Fabricant",
  manufacturerAddress: "Adresse",
  cybersecurityContact: "Contact de cybersécurité",
  website: "Site web",
  section3: "3. Période de support et canal de mise à jour",
  supportStart: "Début du support",
  supportEnd: "Fin du support",
  updateChannel: "Canal de mise à jour",
  updateChannelTbd: "Communiqué aux utilisateurs lors du déploiement du produit",
  supportNote:
    "Les mises à jour de sécurité sont fournies gratuitement et sans retard injustifié pendant toute la période de support (article 13(8) du CRA).",
  section4: "4. Signalement des vulnérabilités",
  disclosureIntro:
    "Nous appliquons une politique de divulgation coordonnée des vulnérabilités. Veuillez signaler les problèmes de sécurité via le canal ci-dessous — nous accusons réception sous 5 jours ouvrables.",
  disclosureUrl: "URL de signalement",
  section5: "5. Consignes d’utilisation sécurisée",
  secureUseDefault:
    "Utilisez le produit conformément au manuel d’utilisation fourni. Maintenez le produit à jour avec les mises à jour de sécurité. Remplacez tout identifiant par défaut avant le déploiement.",
  section6: "6. Référence de la déclaration de conformité",
  docVersion: "Version de la déclaration de conformité",
  docIssued: "Émise le",
  intendedUse: "Utilisation prévue",
  knownRisks: "Risques de cybersécurité connus et prévisibles",
  knownRisksNone:
    "Aucun risque spécifique identifié au-delà des pratiques d’utilisation sécurisée standard.",
  docUrl: "Où la déclaration UE de conformité peut être consultée",
};

const it: Messages = {
  title: "Informazioni di cibersicurezza per l’utente finale",
  subtitle:
    "Documento richiesto dall’articolo 13 e dall’allegato II(3) del CRA. Accompagna il prodotto al momento dell’immissione sul mercato dell’UE.",
  section1: "1. Identificazione del prodotto",
  productName: "Nome del prodotto",
  productType: "Tipo",
  productIdentification: "Identificazione",
  section2: "2. Fabbricante e contatto per la cibersicurezza",
  manufacturer: "Fabbricante",
  manufacturerAddress: "Indirizzo",
  cybersecurityContact: "Contatto per la cibersicurezza",
  website: "Sito web",
  section3: "3. Periodo di supporto e canale di aggiornamento",
  supportStart: "Inizio del supporto",
  supportEnd: "Fine del supporto",
  updateChannel: "Canale di aggiornamento",
  updateChannelTbd: "Comunicato agli utenti al lancio del prodotto",
  supportNote:
    "Gli aggiornamenti di sicurezza sono forniti gratuitamente e senza indebito ritardo per tutto il periodo di supporto (articolo 13(8) del CRA).",
  section4: "4. Segnalazione delle vulnerabilità",
  disclosureIntro:
    "Adottiamo una politica di divulgazione coordinata delle vulnerabilità. Si prega di segnalare i problemi di sicurezza tramite il canale indicato di seguito — confermiamo la ricezione entro 5 giorni lavorativi.",
  disclosureUrl: "URL di segnalazione",
  section5: "5. Indicazioni per l’uso sicuro",
  secureUseDefault:
    "Utilizzare il prodotto secondo il manuale d’uso allegato. Mantenere il prodotto aggiornato con gli aggiornamenti di sicurezza. Sostituire eventuali credenziali predefinite di fabbrica prima della messa in servizio.",
  section6: "6. Riferimento alla dichiarazione di conformità",
  docVersion: "Versione della dichiarazione di conformità",
  docIssued: "Rilasciata il",
  intendedUse: "Destinazione d’uso",
  knownRisks: "Rischi di cibersicurezza noti e prevedibili",
  knownRisksNone:
    "Non sono stati identificati rischi specifici oltre alle normali pratiche di uso sicuro.",
  docUrl: "Dove è possibile consultare la dichiarazione di conformità UE",
};

const MESSAGES: Record<Locale, Messages> = { en, de, fr, it };

export function getEndUserInfoMessages(locale: Locale): Messages {
  return MESSAGES[locale] ?? MESSAGES.en;
}
