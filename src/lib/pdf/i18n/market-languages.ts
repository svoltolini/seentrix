/**
 * Market-language label sets for the two CRA documents that must be in the
 * language of the market where the product is sold: the EU Declaration of
 * Conformity (Annex V) and the End-User Cybersecurity Information sheet
 * (Annex II). These supplement the reviewed en/de/fr/it sets with the
 * additional shipped languages (pl/es/pt/sv); the message getters merge them
 * over English so any missing key falls back gracefully.
 *
 * The DoC conformity statement + applied-standards line are boilerplate
 * synthesised in the route, so their localised templates live here too. Field
 * VALUES the operator enters pass through verbatim — the operator remains
 * responsible for translating their own substantive content.
 */

import type { DocLocale } from "../doc-locales";

type Labels = Record<string, string>;

// Languages beyond the reviewed en/de/fr/it set.
type MarketLocale = "pl" | "es" | "pt" | "sv";

// ─── EU Declaration of Conformity (Annex V) labels ───
export const MARKET_DOC_LABELS: Record<MarketLocale, Labels> = {
  pl: {
    title: "Deklaracja zgodności UE",
    subtitle: "Zgodnie z aktem o cyberodporności — załącznik V",
    section1: "1. Producent",
    manufacturerName: "Nazwa",
    manufacturerAddress: "Adres",
    section2: "2. Produkt z elementami cyfrowymi",
    productName: "Nazwa produktu",
    productIdentification: "Identyfikacja produktu",
    section3: "3. Oświadczenie o zgodności",
    conformityStatement: "Deklaracja",
    section4: "4. Normy zharmonizowane i specyfikacje",
    standardsApplied: "Zastosowane normy",
    section5: "5. Jednostka notyfikowana (w stosownych przypadkach)",
    notifiedBodyName: "Nazwa jednostki notyfikowanej",
    notifiedBodyNumber: "Numer jednostki notyfikowanej",
    section6: "6. Podpisano",
    place: "Miejsce",
    date: "Data",
    signatoryName: "Imię i nazwisko",
    signatoryPosition: "Stanowisko",
    signatureLine: "Podpis: ____________________________",
  },
  es: {
    title: "Declaración UE de conformidad",
    subtitle: "De conformidad con el Reglamento de Ciberresiliencia — Anexo V",
    section1: "1. Fabricante",
    manufacturerName: "Nombre",
    manufacturerAddress: "Dirección",
    section2: "2. Producto con elementos digitales",
    productName: "Nombre del producto",
    productIdentification: "Identificación del producto",
    section3: "3. Declaración de conformidad",
    conformityStatement: "Declaración",
    section4: "4. Normas armonizadas y especificaciones",
    standardsApplied: "Normas aplicadas",
    section5: "5. Organismo notificado (cuando proceda)",
    notifiedBodyName: "Nombre del organismo notificado",
    notifiedBodyNumber: "Número del organismo notificado",
    section6: "6. Firmado",
    place: "Lugar",
    date: "Fecha",
    signatoryName: "Nombre",
    signatoryPosition: "Cargo",
    signatureLine: "Firma: ____________________________",
  },
  pt: {
    title: "Declaração UE de conformidade",
    subtitle: "Em conformidade com o Regulamento Ciber-Resiliência — Anexo V",
    section1: "1. Fabricante",
    manufacturerName: "Nome",
    manufacturerAddress: "Endereço",
    section2: "2. Produto com elementos digitais",
    productName: "Nome do produto",
    productIdentification: "Identificação do produto",
    section3: "3. Declaração de conformidade",
    conformityStatement: "Declaração",
    section4: "4. Normas harmonizadas e especificações",
    standardsApplied: "Normas aplicadas",
    section5: "5. Organismo notificado (se aplicável)",
    notifiedBodyName: "Nome do organismo notificado",
    notifiedBodyNumber: "Número do organismo notificado",
    section6: "6. Assinado",
    place: "Local",
    date: "Data",
    signatoryName: "Nome",
    signatoryPosition: "Cargo",
    signatureLine: "Assinatura: ____________________________",
  },
  sv: {
    title: "EU-försäkran om överensstämmelse",
    subtitle: "I enlighet med cyberresiliensförordningen — bilaga V",
    section1: "1. Tillverkare",
    manufacturerName: "Namn",
    manufacturerAddress: "Adress",
    section2: "2. Produkt med digitala element",
    productName: "Produktnamn",
    productIdentification: "Produktidentifiering",
    section3: "3. Försäkran om överensstämmelse",
    conformityStatement: "Försäkran",
    section4: "4. Harmoniserade standarder och specifikationer",
    standardsApplied: "Tillämpade standarder",
    section5: "5. Anmält organ (i tillämpliga fall)",
    notifiedBodyName: "Anmält organs namn",
    notifiedBodyNumber: "Anmält organs nummer",
    section6: "6. Undertecknat",
    place: "Ort",
    date: "Datum",
    signatoryName: "Namn",
    signatoryPosition: "Befattning",
    signatureLine: "Underskrift: ____________________________",
  },
};

// ─── End-User Cybersecurity Information (Annex II) labels ───
export const MARKET_ANNEX2_LABELS: Record<MarketLocale, Labels> = {
  pl: {
    title: "Informacje o cyberbezpieczeństwie dla użytkownika końcowego",
    subtitle:
      "Dokument wymagany na mocy art. 13 i załącznika II(3) aktu o cyberodporności. Towarzyszy produktowi wprowadzanemu do obrotu na rynku UE.",
    section1: "1. Identyfikacja produktu",
    productName: "Nazwa produktu",
    productType: "Typ",
    productIdentification: "Identyfikacja",
    section2: "2. Producent i kontakt ds. cyberbezpieczeństwa",
    manufacturer: "Producent",
    manufacturerAddress: "Adres",
    cybersecurityContact: "Kontakt ds. cyberbezpieczeństwa",
    website: "Strona internetowa",
    section3: "3. Okres wsparcia i kanał aktualizacji",
    supportStart: "Początek wsparcia",
    supportEnd: "Koniec wsparcia",
    updateChannel: "Kanał aktualizacji",
    updateChannelTbd: "Przekazywany użytkownikom przy wprowadzeniu produktu",
    supportNote:
      "Aktualizacje zabezpieczeń są dostarczane bezpłatnie i bez zbędnej zwłoki przez cały okres wsparcia (art. 13 ust. 8 aktu o cyberodporności).",
    section4: "4. Zgłaszanie podatności",
    disclosureIntro:
      "Prowadzimy politykę skoordynowanego ujawniania podatności. Prosimy zgłaszać problemy bezpieczeństwa za pośrednictwem poniższego kanału — potwierdzamy w ciągu 5 dni roboczych.",
    disclosureUrl: "Adres URL do zgłoszeń",
    section5: "5. Wskazówki dotyczące bezpiecznego użytkowania",
    secureUseDefault:
      "Używaj produktu zgodnie z dołączoną instrukcją. Utrzymuj produkt aktualny dzięki aktualizacjom zabezpieczeń. Przed wdrożeniem zmień wszelkie fabryczne dane uwierzytelniające.",
    section6: "6. Odniesienie do deklaracji zgodności",
    docVersion: "Wersja deklaracji",
    docIssued: "Data wydania",
    intendedUse: "Przeznaczenie",
    knownRisks: "Znane i przewidywalne zagrożenia cyberbezpieczeństwa",
    knownRisksNone:
      "Nie zidentyfikowano szczególnych zagrożeń poza standardowymi praktykami bezpiecznego użytkowania.",
    docUrl: "Gdzie można uzyskać dostęp do deklaracji zgodności UE",
  },
  es: {
    title: "Información de ciberseguridad para el usuario final",
    subtitle:
      "Documento exigido por el artículo 13 y el anexo II(3) del Reglamento de Ciberresiliencia. Acompaña al producto al introducirse en el mercado de la UE.",
    section1: "1. Identificación del producto",
    productName: "Nombre del producto",
    productType: "Tipo",
    productIdentification: "Identificación",
    section2: "2. Fabricante y contacto de ciberseguridad",
    manufacturer: "Fabricante",
    manufacturerAddress: "Dirección",
    cybersecurityContact: "Contacto de ciberseguridad",
    website: "Sitio web",
    section3: "3. Período de soporte y canal de actualización",
    supportStart: "Inicio del soporte",
    supportEnd: "Fin del soporte",
    updateChannel: "Canal de actualización",
    updateChannelTbd: "Se comunica a los usuarios al lanzamiento del producto",
    supportNote:
      "Las actualizaciones de seguridad se proporcionan de forma gratuita y sin demora indebida durante todo el período de soporte (artículo 13, apartado 8, del Reglamento de Ciberresiliencia).",
    section4: "4. Notificación de vulnerabilidades",
    disclosureIntro:
      "Aplicamos una política de divulgación coordinada de vulnerabilidades. Comunique los problemas de seguridad a través del canal indicado a continuación; acusamos recibo en un plazo de 5 días hábiles.",
    disclosureUrl: "URL de notificación",
    section5: "5. Orientaciones para un uso seguro",
    secureUseDefault:
      "Utilice el producto conforme al manual de usuario adjunto. Mantenga el producto actualizado con las actualizaciones de seguridad. Sustituya cualquier credencial predeterminada de fábrica antes del despliegue.",
    section6: "6. Referencia a la declaración de conformidad",
    docVersion: "Versión de la declaración",
    docIssued: "Fecha de emisión",
    intendedUse: "Uso previsto",
    knownRisks: "Riesgos de ciberseguridad conocidos y previsibles",
    knownRisksNone:
      "No se han identificado riesgos específicos más allá de las prácticas estándar de uso seguro.",
    docUrl: "Dónde puede consultarse la declaración UE de conformidad",
  },
  pt: {
    title: "Informações de cibersegurança para o utilizador final",
    subtitle:
      "Documento exigido pelo artigo 13.º e pelo anexo II(3) do Regulamento Ciber-Resiliência. Acompanha o produto aquando da sua colocação no mercado da UE.",
    section1: "1. Identificação do produto",
    productName: "Nome do produto",
    productType: "Tipo",
    productIdentification: "Identificação",
    section2: "2. Fabricante e contacto de cibersegurança",
    manufacturer: "Fabricante",
    manufacturerAddress: "Endereço",
    cybersecurityContact: "Contacto de cibersegurança",
    website: "Sítio Web",
    section3: "3. Período de apoio e canal de atualização",
    supportStart: "Início do apoio",
    supportEnd: "Fim do apoio",
    updateChannel: "Canal de atualização",
    updateChannelTbd: "Comunicado aos utilizadores no lançamento do produto",
    supportNote:
      "As atualizações de segurança são fornecidas gratuitamente e sem demora injustificada durante todo o período de apoio (artigo 13.º, n.º 8, do Regulamento Ciber-Resiliência).",
    section4: "4. Comunicação de vulnerabilidades",
    disclosureIntro:
      "Aplicamos uma política de divulgação coordenada de vulnerabilidades. Comunique os problemas de segurança através do canal abaixo — acusamos a receção no prazo de 5 dias úteis.",
    disclosureUrl: "URL de comunicação",
    section5: "5. Orientações para uma utilização segura",
    secureUseDefault:
      "Utilize o produto de acordo com o manual do utilizador fornecido. Mantenha o produto atualizado com as atualizações de segurança. Substitua quaisquer credenciais predefinidas de fábrica antes da implementação.",
    section6: "6. Referência à declaração de conformidade",
    docVersion: "Versão da declaração",
    docIssued: "Data de emissão",
    intendedUse: "Utilização prevista",
    knownRisks: "Riscos de cibersegurança conhecidos e previsíveis",
    knownRisksNone:
      "Não foram identificados riscos específicos além das práticas correntes de utilização segura.",
    docUrl: "Onde pode ser consultada a declaração UE de conformidade",
  },
  sv: {
    title: "Cybersäkerhetsinformation för slutanvändare",
    subtitle:
      "Dokument som krävs enligt artikel 13 och bilaga II(3) i cyberresiliensförordningen. Medföljer produkten när den släpps ut på EU-marknaden.",
    section1: "1. Produktidentifiering",
    productName: "Produktnamn",
    productType: "Typ",
    productIdentification: "Identifiering",
    section2: "2. Tillverkare och cybersäkerhetskontakt",
    manufacturer: "Tillverkare",
    manufacturerAddress: "Adress",
    cybersecurityContact: "Cybersäkerhetskontakt",
    website: "Webbplats",
    section3: "3. Supportperiod och uppdateringskanal",
    supportStart: "Support börjar",
    supportEnd: "Support upphör",
    updateChannel: "Uppdateringskanal",
    updateChannelTbd: "Meddelas användarna vid produktlanseringen",
    supportNote:
      "Säkerhetsuppdateringar tillhandahålls kostnadsfritt och utan onödigt dröjsmål under hela supportperioden (artikel 13.8 i cyberresiliensförordningen).",
    section4: "4. Rapportering av sårbarheter",
    disclosureIntro:
      "Vi tillämpar en policy för samordnat röjande av sårbarheter. Rapportera säkerhetsproblem via kanalen nedan — vi bekräftar inom 5 arbetsdagar.",
    disclosureUrl: "Rapporterings-URL",
    section5: "5. Vägledning för säker användning",
    secureUseDefault:
      "Använd produkten enligt den medföljande bruksanvisningen. Håll produkten uppdaterad med säkerhetsuppdateringar. Byt ut alla fabriksinställda standarduppgifter före driftsättning.",
    section6: "6. Hänvisning till försäkran om överensstämmelse",
    docVersion: "Försäkrans version",
    docIssued: "Utfärdad den",
    intendedUse: "Avsedd användning",
    knownRisks: "Kända och förutsebara cybersäkerhetsrisker",
    knownRisksNone:
      "Inga särskilda risker har identifierats utöver gängse praxis för säker användning.",
    docUrl: "Var EU-försäkran om överensstämmelse kan erhållas",
  },
};

// ─── DoC boilerplate values (synthesised in the route) for all 8 languages ───
const DOC_BOILERPLATE: Record<
  DocLocale,
  { statement: (manufacturer: string, route: string) => string; standards: string }
> = {
  en: {
    statement: (m, r) =>
      `${m} declares under its sole responsibility that the product named above is in conformity with Regulation (EU) 2024/2847 (Cyber Resilience Act) and fulfils the essential cybersecurity requirements set out in Annex I. Conformity route: ${r}.`,
    standards:
      "Harmonised standards EN 18031-1, EN 18031-2, EN 18031-3 (where applicable).",
  },
  de: {
    statement: (m, r) =>
      `${m} erklärt in alleiniger Verantwortung, dass das oben genannte Produkt der Verordnung (EU) 2024/2847 (Cyber Resilience Act) entspricht und die in Anhang I festgelegten grundlegenden Cybersicherheitsanforderungen erfüllt. Konformitätsbewertungsverfahren: ${r}.`,
    standards:
      "Harmonisierte Normen EN 18031-1, EN 18031-2, EN 18031-3 (sofern zutreffend).",
  },
  fr: {
    statement: (m, r) =>
      `${m} déclare sous sa seule responsabilité que le produit susmentionné est conforme au règlement (UE) 2024/2847 (règlement sur la cyber-résilience) et satisfait aux exigences essentielles de cybersécurité énoncées à l'annexe I. Procédure d'évaluation de la conformité : ${r}.`,
    standards:
      "Normes harmonisées EN 18031-1, EN 18031-2, EN 18031-3 (le cas échéant).",
  },
  it: {
    statement: (m, r) =>
      `${m} dichiara sotto la propria esclusiva responsabilità che il prodotto sopra indicato è conforme al regolamento (UE) 2024/2847 (regolamento sulla ciberresilienza) e soddisfa i requisiti essenziali di cibersicurezza di cui all'allegato I. Procedura di valutazione della conformità: ${r}.`,
    standards:
      "Norme armonizzate EN 18031-1, EN 18031-2, EN 18031-3 (ove applicabile).",
  },
  pl: {
    statement: (m, r) =>
      `${m} oświadcza na swoją wyłączną odpowiedzialność, że wyżej wymieniony produkt jest zgodny z rozporządzeniem (UE) 2024/2847 (akt o cyberodporności) i spełnia zasadnicze wymagania cyberbezpieczeństwa określone w załączniku I. Procedura oceny zgodności: ${r}.`,
    standards:
      "Normy zharmonizowane EN 18031-1, EN 18031-2, EN 18031-3 (w stosownych przypadkach).",
  },
  es: {
    statement: (m, r) =>
      `${m} declara bajo su exclusiva responsabilidad que el producto mencionado es conforme con el Reglamento (UE) 2024/2847 (Reglamento de Ciberresiliencia) y cumple los requisitos esenciales de ciberseguridad establecidos en el Anexo I. Procedimiento de evaluación de la conformidad: ${r}.`,
    standards:
      "Normas armonizadas EN 18031-1, EN 18031-2, EN 18031-3 (cuando proceda).",
  },
  pt: {
    statement: (m, r) =>
      `${m} declara, sob a sua exclusiva responsabilidade, que o produto acima identificado está em conformidade com o Regulamento (UE) 2024/2847 (Regulamento Ciber-Resiliência) e cumpre os requisitos essenciais de cibersegurança estabelecidos no Anexo I. Procedimento de avaliação da conformidade: ${r}.`,
    standards:
      "Normas harmonizadas EN 18031-1, EN 18031-2, EN 18031-3 (se aplicável).",
  },
  sv: {
    statement: (m, r) =>
      `${m} försäkrar på eget ansvar att den ovan angivna produkten överensstämmer med förordning (EU) 2024/2847 (cyberresiliensförordningen) och uppfyller de väsentliga cybersäkerhetskraven i bilaga I. Förfarande för bedömning av överensstämmelse: ${r}.`,
    standards:
      "Harmoniserade standarder EN 18031-1, EN 18031-2, EN 18031-3 (i tillämpliga fall).",
  },
};

/** Localised DoC conformity statement + applied-standards line. */
export function docConformityBoilerplate(
  locale: DocLocale,
  manufacturerName: string,
  conformityRoute: string,
): { conformityStatement: string; standardsApplied: string } {
  const b = DOC_BOILERPLATE[locale] ?? DOC_BOILERPLATE.en;
  return {
    conformityStatement: b.statement(manufacturerName, conformityRoute),
    standardsApplied: b.standards,
  };
}
