/* eslint-disable react/no-unescaped-entities */
import { Term } from "@/components/glossary/term";
import type { Lesson } from "@/lib/academy/types";

export const lesson: Lesson = {
  id: "annex-i-essential-requirements",
  duration: "10 min",
  requiredForRoles: ["admin", "compliance_officer", "cto"],
  prerequisites: ["cra-101"],
  i18n: {
    en: {
      title: "Annex I — Essential cybersecurity requirements",
      summary:
        "The thirteen baseline cybersecurity properties every product we ship must have, plus the vulnerability-handling obligations that run alongside them.",
      sections: [
        {
          heading: "Two halves of Annex I",
          body: (
            <>
              <p>
                Annex I is split into two parts and both apply to every
                product with digital elements we place on the EU market.
                Missing either half invalidates the{" "}
                <Term id="doc">Declaration of Conformity</Term>.
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Part I — Product requirements.</strong> Thirteen
                  baseline cybersecurity properties the product itself must
                  exhibit at the point of{" "}
                  <Term id="placing_on_market">placing on the market</Term>.
                </li>
                <li>
                  <strong>Part II — Vulnerability handling.</strong> Eight
                  process obligations we run as a manufacturer throughout the{" "}
                  <Term id="support_period">support period</Term>. These
                  are about how we operate, not about the code in a release.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Part I at a glance",
          body: (
            <>
              <p>
                The thirteen Part I requirements cluster into five themes.
                In practice, Seentrix's checklist splits them back out so
                you can evidence each one individually, but it helps to know
                the groupings:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>No known exploitable vulnerabilities</strong> at
                  market placement (requires an active{" "}
                  <Term id="sbom">SBOM</Term> scan).
                </li>
                <li>
                  <strong>Secure by default</strong> — shipped configuration
                  has to be the safe one.
                </li>
                <li>
                  <strong>Identity and access control</strong> — authentication,
                  authorisation, and the principle of least privilege.
                </li>
                <li>
                  <strong>Data protection</strong> — confidentiality,
                  integrity, authenticity, and data minimisation.
                </li>
                <li>
                  <strong>Resilience and minimised attack surface</strong> —
                  resistance to denial-of-service, minimum necessary network
                  exposure, and secure update delivery.
                </li>
              </ul>
              <p className="mt-3">
                Harmonised standards — the EN 18031-1/2/3 series — describe
                concrete ways to meet each requirement. Using them gives you
                a legal <em>presumption of conformity</em>: if you follow EN
                18031, you're assumed compliant unless a market surveillance
                authority proves otherwise.
              </p>
            </>
          ),
        },
        {
          heading: "Part II — running the vulnerability-handling engine",
          body: (
            <>
              <p>
                Part II mandates the operational side of cybersecurity. The
                eight obligations map to dedicated Seentrix screens:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Active <Term id="sbom">SBOM</Term> + vulnerability scanning
                  (SBOM tab).
                </li>
                <li>
                  Address vulnerabilities via{" "}
                  <Term id="security_update">security updates</Term> without
                  undue delay (Releases tab).
                </li>
                <li>
                  Public <Term id="cvd">CVD</Term> contact point and
                  disclosure policy (Reports &gt; public security page).
                </li>
                <li>
                  Inform users of known exploitable vulnerabilities
                  (Incidents &gt; user notification).
                </li>
                <li>
                  Free security updates for at least the{" "}
                  <Term id="support_period">support period</Term> (Releases &gt;
                  support period).
                </li>
              </ul>
              <p className="mt-3">
                Part I is a one-time gate at launch. Part II is ongoing.
                Auditors check both — a product that met Part I on day one
                but stopped shipping security updates three years in is in
                breach.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Which of these is a Part II (vulnerability handling) obligation, not a Part I (product) one?",
          options: [
            "Secure-by-default configuration at shipment",
            "Operating a coordinated vulnerability disclosure policy",
            "Authenticity of firmware signatures",
            "Minimised network attack surface",
          ],
          correctIndex: 1,
          explanation:
            "A CVD policy is Part II (process). The other three are Part I (properties the product itself must exhibit at market placement).",
        },
        {
          question:
            "What does it mean to have a “presumption of conformity” with Annex I?",
          options: [
            "You are automatically exempt from Annex I",
            "Following a harmonised standard (EN 18031) is assumed to satisfy the corresponding requirements unless disproven",
            "You can skip the Declaration of Conformity",
            "A notified body has pre-approved your product",
          ],
          correctIndex: 1,
          explanation:
            "Presumption of conformity means that if you apply the relevant harmonised standards, compliance with the essential requirements is presumed — the burden shifts to the market surveillance authority to prove otherwise.",
        },
        {
          question:
            "A product met Annex I Part I at launch but stopped shipping security updates after 2 years. What's the consequence under the CRA?",
          options: [
            "No issue — Part I compliance is what counts",
            "Breach of Part II obligations; the product is non-compliant",
            "Only the support-period promise is breached; CRA compliance itself is intact",
            "The DoC expires and must be re-issued",
          ],
          correctIndex: 1,
          explanation:
            "Part II obligations run for the entire support period (minimum 5 years). Stopping security updates early is a breach of Annex I Part II and of Article 13.",
        },
        {
          question:
            "Which document evidences Annex I compliance to a market surveillance authority?",
          options: [
            "The Declaration of Conformity alone",
            "The technical documentation (Annex II) and the Declaration of Conformity together",
            "A notified body certificate only",
            "The SBOM",
          ],
          correctIndex: 1,
          explanation:
            "The DoC is the signed claim; the technical documentation (Annex II) contains the evidence supporting that claim. Market surveillance asks for both.",
        },
        {
          question:
            "Which of these Part I themes covers “authentication, authorisation, and least privilege”?",
          options: [
            "No known exploitable vulnerabilities",
            "Secure by default",
            "Identity and access control",
            "Resilience and minimised attack surface",
          ],
          correctIndex: 2,
          explanation:
            "The five themes of Part I group the thirteen requirements. Identity and access control covers authentication, authorisation, and least privilege.",
        },
      ],
    },
    de: {
      title: "Anhang I — Grundlegende Cybersicherheitsanforderungen",
      summary:
        "Die dreizehn grundlegenden Eigenschaften, die jedes unserer auf den EU-Markt gebrachten Produkte haben muss, plus die begleitenden Schwachstellenbehandlungspflichten.",
      sections: [
        {
          heading: "Zwei Hälften von Anhang I",
          body: (
            <>
              <p>
                Anhang I ist zweigeteilt, und beide Teile gelten für jedes
                von uns auf dem EU-Markt bereitgestellte Produkt mit
                digitalen Elementen. Fehlt einer der beiden Teile, ist die{" "}
                <Term id="doc">Konformitätserklärung</Term> ungültig.
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Teil I — Produktanforderungen.</strong> Dreizehn
                  Cybersicherheitseigenschaften, die das Produkt selbst zum
                  Zeitpunkt des{" "}
                  <Term id="placing_on_market">Inverkehrbringens</Term>{" "}
                  aufweisen muss.
                </li>
                <li>
                  <strong>Teil II — Schwachstellenbehandlung.</strong> Acht
                  prozessuale Pflichten, die wir als Hersteller während des
                  gesamten{" "}
                  <Term id="support_period">Support-Zeitraums</Term> laufen
                  lassen. Geht um unseren Betrieb, nicht um den Code im
                  Release.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Teil I im Überblick",
          body: (
            <>
              <p>
                Die dreizehn Teil-I-Anforderungen gruppieren sich in fünf
                Themenbereiche. Seentrix splittet sie in der Checkliste
                wieder auf, damit jede einzeln nachgewiesen werden kann,
                aber zur Orientierung:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Keine bekannten ausnutzbaren Schwachstellen</strong>{" "}
                  beim Markteintritt (aktiver{" "}
                  <Term id="sbom">SBOM</Term>-Scan nötig).
                </li>
                <li>
                  <strong>Secure by Default</strong> — die Auslieferungs-
                  konfiguration muss die sichere sein.
                </li>
                <li>
                  <strong>Identitäts- und Zugriffskontrolle</strong> —
                  Authentifizierung, Autorisierung, Least Privilege.
                </li>
                <li>
                  <strong>Datenschutz</strong> — Vertraulichkeit,
                  Integrität, Authentizität, Datenminimierung.
                </li>
                <li>
                  <strong>Resilienz und minimierte Angriffsfläche</strong> —
                  DoS-Widerstand, nur notwendige Netzexposition, sichere
                  Update-Auslieferung.
                </li>
              </ul>
              <p className="mt-3">
                Die harmonisierten Normen — EN 18031-1/2/3 — beschreiben
                konkrete Umsetzungen. Wer sie anwendet, erhält eine{" "}
                <em>Konformitätsvermutung</em>: es wird angenommen, die
                Anforderungen seien erfüllt, bis eine Marktüberwachungs-
                behörde das Gegenteil nachweist.
              </p>
            </>
          ),
        },
        {
          heading: "Teil II — die Schwachstellenbehandlung betreiben",
          body: (
            <>
              <p>
                Teil II regelt die operative Seite. Die acht Pflichten
                bilden dedizierte Seentrix-Screens ab:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Aktiver <Term id="sbom">SBOM</Term>- und
                  Schwachstellen-Scan (Tab SBOM).
                </li>
                <li>
                  Schwachstellen durch{" "}
                  <Term id="security_update">Sicherheitsupdates</Term> ohne
                  ungebührliche Verzögerung beheben (Tab Releases).
                </li>
                <li>
                  Öffentlicher <Term id="cvd">CVD</Term>-Kontaktpunkt und
                  Offenlegungsrichtlinie (Tab Meldungen &gt; Security-Seite).
                </li>
                <li>
                  Nutzer über aktiv ausgenutzte Schwachstellen informieren
                  (Tab Vorfälle &gt; Nutzerbenachrichtigung).
                </li>
                <li>
                  Kostenfreie Sicherheitsupdates für mindestens den{" "}
                  <Term id="support_period">Support-Zeitraum</Term>{" "}
                  (Tab Releases &gt; Support-Zeitraum).
                </li>
              </ul>
              <p className="mt-3">
                Teil I ist eine einmalige Hürde beim Start. Teil II läuft
                kontinuierlich. Prüfer kontrollieren beides — ein Produkt,
                das Teil I am ersten Tag erfüllte und nach drei Jahren keine
                Sicherheitsupdates mehr liefert, ist nicht konform.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Welche dieser Pflichten gehört zu Teil II (Schwachstellenbehandlung), nicht zu Teil I (Produkt)?",
          options: [
            "Secure-by-Default-Konfiguration bei Auslieferung",
            "Betrieb einer Richtlinie zur koordinierten Offenlegung von Schwachstellen",
            "Authentizität von Firmware-Signaturen",
            "Minimierte Netzangriffsfläche",
          ],
          correctIndex: 1,
          explanation:
            "Eine CVD-Richtlinie gehört zu Teil II (Prozess). Die übrigen drei gehören zu Teil I (Produkt-Eigenschaften zum Zeitpunkt des Inverkehrbringens).",
        },
        {
          question:
            "Was bedeutet „Konformitätsvermutung“ bezogen auf Anhang I?",
          options: [
            "Man ist automatisch von Anhang I befreit",
            "Das Befolgen einer harmonisierten Norm (EN 18031) wird als Erfüllung der entsprechenden Anforderungen angesehen, solange kein Gegenbeweis erbracht wird",
            "Die Konformitätserklärung entfällt",
            "Eine notifizierte Stelle hat das Produkt vorab genehmigt",
          ],
          correctIndex: 1,
          explanation:
            "Konformitätsvermutung heißt: wer die harmonisierten Normen anwendet, gilt als konform mit den grundlegenden Anforderungen, bis das Gegenteil von der Marktüberwachungsbehörde bewiesen wird.",
        },
        {
          question:
            "Ein Produkt erfüllte Teil I beim Start, lieferte aber nach 2 Jahren keine Sicherheitsupdates mehr. Welche Folge unter dem CRA?",
          options: [
            "Kein Problem — Teil-I-Konformität zählt",
            "Verstoß gegen Teil-II-Pflichten; das Produkt ist nicht konform",
            "Nur die Support-Zusage ist verletzt; die CRA-Konformität bleibt bestehen",
            "Die Konformitätserklärung läuft ab und muss neu ausgestellt werden",
          ],
          correctIndex: 1,
          explanation:
            "Teil-II-Pflichten laufen während des gesamten Support-Zeitraums (mind. 5 Jahre). Ein vorzeitiges Einstellen von Sicherheitsupdates ist ein Verstoß gegen Anhang I Teil II und gegen Artikel 13.",
        },
        {
          question:
            "Welches Dokument belegt die Anhang-I-Konformität gegenüber einer Marktüberwachungsbehörde?",
          options: [
            "Die Konformitätserklärung allein",
            "Die technische Dokumentation (Anhang II) zusammen mit der Konformitätserklärung",
            "Ausschließlich ein Zertifikat einer notifizierten Stelle",
            "Die SBOM",
          ],
          correctIndex: 1,
          explanation:
            "Die Konformitätserklärung ist die unterzeichnete Behauptung, die technische Dokumentation (Anhang II) enthält die Belege. Die Behörde verlangt beides.",
        },
        {
          question:
            "Welches der fünf Teil-I-Themenfelder umfasst „Authentifizierung, Autorisierung und Least Privilege“?",
          options: [
            "Keine bekannten ausnutzbaren Schwachstellen",
            "Secure by Default",
            "Identitäts- und Zugriffskontrolle",
            "Resilienz und minimierte Angriffsfläche",
          ],
          correctIndex: 2,
          explanation:
            "Die fünf Themen fassen die dreizehn Anforderungen. Identitäts- und Zugriffskontrolle umfasst Authentifizierung, Autorisierung und das Least-Privilege-Prinzip.",
        },
      ],
    },
    fr: {
      title: "Annexe I — Exigences essentielles de cybersécurité",
      summary:
        "Les treize propriétés de cybersécurité de base que doit posséder chaque produit que nous mettons sur le marché, ainsi que les obligations de traitement des vulnérabilités qui les accompagnent.",
      sections: [
        {
          heading: "Les deux volets de l’Annexe I",
          body: (
            <>
              <p>
                L’Annexe I est divisée en deux parties, et toutes deux
                s’appliquent à chaque produit comportant des éléments
                numériques que nous mettons sur le marché de l’UE.
                L’absence de l’une ou l’autre invalide la{" "}
                <Term id="doc">déclaration de conformité</Term>.
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Partie I — Exigences relatives au produit.</strong> Treize
                  propriétés de cybersécurité de base que le produit lui-même doit
                  présenter au moment de la{" "}
                  <Term id="placing_on_market">mise sur le marché</Term>.
                </li>
                <li>
                  <strong>Partie II — Traitement des vulnérabilités.</strong> Huit
                  obligations de processus que nous assurons en tant que fabricant tout au long de la{" "}
                  <Term id="support_period">période de support</Term>. Elles
                  concernent notre mode de fonctionnement, pas le code d’une version.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Partie I en un coup d’œil",
          body: (
            <>
              <p>
                Les treize exigences de la Partie I se regroupent en cinq thèmes.
                En pratique, la liste de contrôle de Seentrix les détaille
                séparément pour que chacune puisse être justifiée
                individuellement, mais il est utile de connaître les
                regroupements :
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Aucune vulnérabilité exploitable connue</strong> à
                  la mise sur le marché (nécessite un scan actif de{" "}
                  <Term id="sbom">SBOM</Term>).
                </li>
                <li>
                  <strong>Sécurisé par défaut</strong> — la configuration
                  livrée doit être la configuration sûre.
                </li>
                <li>
                  <strong>Identité et contrôle d’accès</strong> — authentification,
                  autorisation et principe de moindre privilège.
                </li>
                <li>
                  <strong>Protection des données</strong> — confidentialité,
                  intégrité, authenticité et minimisation des données.
                </li>
                <li>
                  <strong>Résilience et surface d’attaque minimisée</strong> —
                  résistance au déni de service, exposition réseau minimale
                  nécessaire et livraison sécurisée des mises à jour.
                </li>
              </ul>
              <p className="mt-3">
                Les normes harmonisées — série EN 18031-1/2/3 — décrivent
                des moyens concrets de satisfaire chaque exigence. Les utiliser
                confère une <em>présomption de conformité</em> légale : si vous
                respectez EN 18031, vous êtes présumé conforme à moins qu’une
                autorité de surveillance du marché ne prouve le contraire.
              </p>
            </>
          ),
        },
        {
          heading: "Partie II — faire fonctionner le moteur de traitement des vulnérabilités",
          body: (
            <>
              <p>
                La Partie II impose le volet opérationnel de la cybersécurité.
                Les huit obligations correspondent à des écrans dédiés dans
                Seentrix :
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Scan actif <Term id="sbom">SBOM</Term> + scan de vulnérabilités
                  (onglet SBOM).
                </li>
                <li>
                  Corriger les vulnérabilités via des{" "}
                  <Term id="security_update">mises à jour de sécurité</Term> sans
                  retard indu (onglet Versions).
                </li>
                <li>
                  Point de contact public <Term id="cvd">CVD</Term> et
                  politique de divulgation (Rapports &gt; page de sécurité publique).
                </li>
                <li>
                  Informer les utilisateurs des vulnérabilités activement
                  exploitées (Incidents &gt; notification utilisateur).
                </li>
                <li>
                  Mises à jour de sécurité gratuites pendant au moins la{" "}
                  <Term id="support_period">période de support</Term> (Versions &gt;
                  période de support).
                </li>
              </ul>
              <p className="mt-3">
                La Partie I est un contrôle unique au lancement. La Partie II
                est continue. Les auditeurs vérifient les deux — un produit
                qui satisfaisait la Partie I au premier jour mais a cessé de
                livrer des mises à jour de sécurité trois ans plus tard est
                en infraction.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Laquelle de ces obligations relève de la Partie II (traitement des vulnérabilités) et non de la Partie I (produit) ?",
          options: [
            "Configuration sécurisée par défaut à la livraison",
            "Exploitation d’une politique de divulgation coordonnée des vulnérabilités",
            "Authenticité des signatures de firmware",
            "Surface d’attaque réseau minimisée",
          ],
          correctIndex: 1,
          explanation:
            "Une politique CVD relève de la Partie II (processus). Les trois autres appartiennent à la Partie I (propriétés que le produit doit présenter à la mise sur le marché).",
        },
        {
          question:
            "Que signifie disposer d’une « présomption de conformité » avec l’Annexe I ?",
          options: [
            "Vous êtes automatiquement exempté de l’Annexe I",
            "Le respect d’une norme harmonisée (EN 18031) est présumé satisfaire les exigences correspondantes, sauf preuve contraire",
            "Vous pouvez vous dispenser de la déclaration de conformité",
            "Un organisme notifié a pré-approuvé votre produit",
          ],
          correctIndex: 1,
          explanation:
            "La présomption de conformité signifie que si vous appliquez les normes harmonisées pertinentes, la conformité aux exigences essentielles est présumée — la charge de la preuve contraire incombe à l’autorité de surveillance du marché.",
        },
        {
          question:
            "Un produit satisfaisait la Partie I de l’Annexe I au lancement mais a cessé de livrer des mises à jour de sécurité après 2 ans. Quelle est la conséquence au titre du CRA ?",
          options: [
            "Aucun problème — la conformité à la Partie I est ce qui compte",
            "Violation des obligations de la Partie II ; le produit est non conforme",
            "Seul l’engagement de période de support est enfreint ; la conformité CRA reste intacte",
            "La déclaration de conformité expire et doit être réémise",
          ],
          correctIndex: 1,
          explanation:
            "Les obligations de la Partie II s’appliquent pendant toute la période de support (minimum 5 ans). Cesser les mises à jour de sécurité avant terme constitue une violation de l’Annexe I Partie II et de l’Article 13.",
        },
        {
          question:
            "Quel document atteste la conformité à l’Annexe I auprès d’une autorité de surveillance du marché ?",
          options: [
            "La déclaration de conformité seule",
            "La documentation technique (Annexe II) et la déclaration de conformité ensemble",
            "Un certificat d’organisme notifié uniquement",
            "Le SBOM",
          ],
          correctIndex: 1,
          explanation:
            "La déclaration de conformité est l’affirmation signée ; la documentation technique (Annexe II) contient les preuves étayant cette affirmation. Les autorités de surveillance demandent les deux.",
        },
        {
          question:
            "Lequel de ces thèmes de la Partie I couvre « authentification, autorisation et moindre privilège » ?",
          options: [
            "Aucune vulnérabilité exploitable connue",
            "Sécurisé par défaut",
            "Identité et contrôle d’accès",
            "Résilience et surface d’attaque minimisée",
          ],
          correctIndex: 2,
          explanation:
            "Les cinq thèmes de la Partie I regroupent les treize exigences. L’identité et le contrôle d’accès couvrent l’authentification, l’autorisation et le moindre privilège.",
        },
      ],
    },
    it: {
      title: "Allegato I — Requisiti essenziali di cibersicurezza",
      summary:
        "Le tredici proprietà di cibersicurezza di base che ogni prodotto che immettiamo sul mercato deve possedere, oltre agli obblighi di gestione delle vulnerabilità che le accompagnano.",
      sections: [
        {
          heading: "Le due parti dell’Allegato I",
          body: (
            <>
              <p>
                L’Allegato I è suddiviso in due parti, entrambe applicabili
                a ogni prodotto con elementi digitali che immettiamo sul
                mercato dell’UE. L’assenza di una delle due invalida la{" "}
                <Term id="doc">dichiarazione di conformità</Term>.
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Parte I — Requisiti del prodotto.</strong> Tredici
                  proprietà di cibersicurezza di base che il prodotto stesso deve
                  presentare al momento della{" "}
                  <Term id="placing_on_market">immissione sul mercato</Term>.
                </li>
                <li>
                  <strong>Parte II — Gestione delle vulnerabilità.</strong> Otto
                  obblighi di processo che assolviamo come fabbricante per tutta la{" "}
                  <Term id="support_period">periodo di supporto</Term>. Riguardano
                  il nostro modo di operare, non il codice di una versione.
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Parte I in sintesi",
          body: (
            <>
              <p>
                I tredici requisiti della Parte I si raggruppano in cinque temi.
                In pratica, la lista di controllo di Seentrix li suddivide
                nuovamente in modo che ciascuno possa essere documentato
                singolarmente, ma è utile conoscere i raggruppamenti:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  <strong>Nessuna vulnerabilità sfruttabile nota</strong> al
                  momento dell’immissione sul mercato (richiede una scansione
                  attiva del{" "}
                  <Term id="sbom">SBOM</Term>).
                </li>
                <li>
                  <strong>Sicuro per impostazione predefinita</strong> — la
                  configurazione fornita deve essere quella sicura.
                </li>
                <li>
                  <strong>Identità e controllo degli accessi</strong> — autenticazione,
                  autorizzazione e principio del privilegio minimo.
                </li>
                <li>
                  <strong>Protezione dei dati</strong> — riservatezza,
                  integrità, autenticità e minimizzazione dei dati.
                </li>
                <li>
                  <strong>Resilienza e superficie di attacco minimizzata</strong> —
                  resistenza al denial-of-service, esposizione di rete minima
                  necessaria e distribuzione sicura degli aggiornamenti.
                </li>
              </ul>
              <p className="mt-3">
                Le norme armonizzate — serie EN 18031-1/2/3 — descrivono
                modalità concrete per soddisfare ciascun requisito. Il loro
                utilizzo conferisce una <em>presunzione di conformità</em>
                legale: se si rispetta EN 18031, si è presunti conformi a meno
                che un’autorità di vigilanza del mercato non dimostri il
                contrario.
              </p>
            </>
          ),
        },
        {
          heading: "Parte II — far funzionare il motore di gestione delle vulnerabilità",
          body: (
            <>
              <p>
                La Parte II impone il lato operativo della cibersicurezza.
                Gli otto obblighi corrispondono a schermate dedicate di
                Seentrix:
              </p>
              <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc]">
                <li>
                  Scansione attiva <Term id="sbom">SBOM</Term> + scansione
                  delle vulnerabilità (scheda SBOM).
                </li>
                <li>
                  Risolvere le vulnerabilità tramite{" "}
                  <Term id="security_update">aggiornamenti di sicurezza</Term> senza
                  ritardi indebiti (scheda Versioni).
                </li>
                <li>
                  Punto di contatto pubblico <Term id="cvd">CVD</Term> e
                  politica di divulgazione (Segnalazioni &gt; pagina di sicurezza pubblica).
                </li>
                <li>
                  Informare gli utenti delle vulnerabilità attivamente
                  sfruttate (Incidenti &gt; notifica utente).
                </li>
                <li>
                  Aggiornamenti di sicurezza gratuiti per almeno il{" "}
                  <Term id="support_period">periodo di supporto</Term> (Versioni &gt;
                  periodo di supporto).
                </li>
              </ul>
              <p className="mt-3">
                La Parte I è un controllo unico al lancio. La Parte II è
                continua. I revisori verificano entrambe — un prodotto che
                soddisfaceva la Parte I il primo giorno ma ha smesso di
                distribuire aggiornamenti di sicurezza dopo tre anni è in
                violazione.
              </p>
            </>
          ),
        },
      ],
      quiz: [
        {
          question:
            "Quale di questi obblighi appartiene alla Parte II (gestione delle vulnerabilità) e non alla Parte I (prodotto)?",
          options: [
            "Configurazione sicura per impostazione predefinita alla spedizione",
            "Gestione di una politica di divulgazione coordinata delle vulnerabilità",
            "Autenticità delle firme del firmware",
            "Superficie di attacco di rete minimizzata",
          ],
          correctIndex: 1,
          explanation:
            "Una politica CVD appartiene alla Parte II (processo). Le altre tre appartengono alla Parte I (proprietà che il prodotto deve presentare al momento dell’immissione sul mercato).",
        },
        {
          question:
            "Cosa significa avere una «presunzione di conformità» rispetto all’Allegato I?",
          options: [
            "Si è automaticamente esenti dall’Allegato I",
            "Il rispetto di una norma armonizzata (EN 18031) è presunto soddisfare i requisiti corrispondenti, salvo prova contraria",
            "Si può omettere la dichiarazione di conformità",
            "Un organismo notificato ha pre-approvato il prodotto",
          ],
          correctIndex: 1,
          explanation:
            "La presunzione di conformità significa che se si applicano le norme armonizzate pertinenti, la conformità ai requisiti essenziali è presunta — l’onere di dimostrare il contrario spetta all’autorità di vigilanza del mercato.",
        },
        {
          question:
            "Un prodotto soddisfaceva la Parte I dell’Allegato I al lancio ma ha smesso di distribuire aggiornamenti di sicurezza dopo 2 anni. Qual è la conseguenza ai sensi del CRA?",
          options: [
            "Nessun problema — la conformità alla Parte I è ciò che conta",
            "Violazione degli obblighi della Parte II; il prodotto è non conforme",
            "Solo l’impegno sul periodo di supporto è violato; la conformità CRA rimane intatta",
            "La dichiarazione di conformità scade e deve essere riemessa",
          ],
          correctIndex: 1,
          explanation:
            "Gli obblighi della Parte II valgono per l’intero periodo di supporto (minimo 5 anni). Cessare gli aggiornamenti di sicurezza anticipatamente costituisce una violazione dell’Allegato I Parte II e dell’Articolo 13.",
        },
        {
          question:
            "Quale documento attesta la conformità all’Allegato I a un’autorità di vigilanza del mercato?",
          options: [
            "La dichiarazione di conformità da sola",
            "La documentazione tecnica (Allegato II) e la dichiarazione di conformità insieme",
            "Solo un certificato di un organismo notificato",
            "Il SBOM",
          ],
          correctIndex: 1,
          explanation:
            "La dichiarazione di conformità è l’affermazione firmata; la documentazione tecnica (Allegato II) contiene le prove a sostegno di tale affermazione. Le autorità di vigilanza richiedono entrambe.",
        },
        {
          question:
            "Quale dei cinque temi della Parte I riguarda «autenticazione, autorizzazione e privilegio minimo»?",
          options: [
            "Nessuna vulnerabilità sfruttabile nota",
            "Sicuro per impostazione predefinita",
            "Identità e controllo degli accessi",
            "Resilienza e superficie di attacco minimizzata",
          ],
          correctIndex: 2,
          explanation:
            "I cinque temi della Parte I raggruppano i tredici requisiti. Identità e controllo degli accessi comprende autenticazione, autorizzazione e privilegio minimo.",
        },
      ],
    },
  },
};

export default lesson;
