import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";
import { PdfField } from "../components/pdf-field";

interface Props {
  data: Record<string, string>;
  messages: Record<string, string>;
  generatedAt: string;
}

/**
 * End-User Cybersecurity Information Sheet.
 *
 * Satisfies CRA Article 13 + Annex II(3) — the user-facing document that
 * must accompany every product placed on the EU market. Covers: product
 * identification, manufacturer contact for cybersecurity matters, declared
 * support period, update channel, secure-use instructions, known
 * limitations, and the URL of the vulnerability disclosure policy.
 */
export function EndUserInfoPdf({ data, messages: m, generatedAt }: Props) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title={m.title} />
        <PdfFooter generatedAt={generatedAt} />

        <Text style={baseStyles.h1}>{m.title}</Text>
        <Text style={baseStyles.body}>{m.subtitle}</Text>
        <View style={baseStyles.divider} />

        {/* Section 1: Product */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section1}</Text>
          <PdfField label={m.productName} value={data.productName} />
          <PdfField label={m.productType} value={data.productType} />
          <PdfField
            label={m.productIdentification}
            value={data.productIdentification}
          />
        </View>

        {/* Section 2: Manufacturer + cybersecurity contact (Art. 13(4)) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section2}</Text>
          <PdfField label={m.manufacturer} value={data.manufacturerName} />
          <PdfField
            label={m.manufacturerAddress}
            value={data.manufacturerAddress}
          />
          <PdfField
            label={m.cybersecurityContact}
            value={data.cybersecurityContact}
          />
          {data.website && (
            <PdfField label={m.website} value={data.website} />
          )}
        </View>

        {/* Section 3: Support period (Art. 13 + Annex I Part II(8)) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section3}</Text>
          <PdfField label={m.supportStart} value={data.supportStart} />
          <PdfField label={m.supportEnd} value={data.supportEnd} />
          <PdfField
            label={m.updateChannel}
            value={data.updateChannel || m.updateChannelTbd}
          />
          <Text style={[baseStyles.body, { marginTop: 8 }]}>
            {m.supportNote}
          </Text>
        </View>

        {/* Section 4: Vulnerability disclosure (Annex I Part II(1)) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section4}</Text>
          <Text style={baseStyles.body}>{m.disclosureIntro}</Text>
          {data.disclosureUrl && (
            <PdfField label={m.disclosureUrl} value={data.disclosureUrl} />
          )}
        </View>

        {/* Section 5: Secure use */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section5}</Text>
          <Text style={baseStyles.body}>
            {data.secureUseInstructions || m.secureUseDefault}
          </Text>
        </View>

        {/* Section 6: DoC reference */}
        {data.declarationVersion && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.h2}>{m.section6}</Text>
            <PdfField label={m.docVersion} value={data.declarationVersion} />
            {data.declarationIssuedAt && (
              <PdfField label={m.docIssued} value={data.declarationIssuedAt} />
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
