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
 * Authorised Representative written mandate (CRA Article 18). A manufacturer
 * established outside the Union appoints, by written mandate, a representative
 * in the Union and confers the Article 18(3) tasks. The known party is
 * pre-filled from the org; the counterparty is left blank to complete.
 */
export function AuthorisedRepresentativeMandatePdf({
  data,
  messages: m,
  generatedAt,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title={m.title} />
        <PdfFooter generatedAt={generatedAt} />

        <Text style={baseStyles.h1}>{m.title}</Text>
        <Text style={baseStyles.body}>{m.subtitle}</Text>
        <View style={baseStyles.divider} />

        {/* Section 1: Manufacturer (principal) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section1}</Text>
          <PdfField label={m.manufacturerName} value={data.manufacturerName} />
          <PdfField
            label={m.manufacturerAddress}
            value={data.manufacturerAddress}
          />
        </View>

        {/* Section 2: Authorised representative */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section2}</Text>
          <PdfField
            label={m.representativeName}
            value={data.representativeName}
          />
          <PdfField
            label={m.representativeAddress}
            value={data.representativeAddress}
          />
        </View>

        {/* Section 3: Scope */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section3}</Text>
          <PdfField label={m.scope} value={data.scope} />
        </View>

        {/* Section 4: Tasks conferred */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section4}</Text>
          <PdfField label={m.tasks} value={data.tasks} />
        </View>

        {/* Section 5: Term and termination */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section5}</Text>
          <PdfField label={m.term} value={data.term} />
        </View>

        {/* Section 6: Signatures */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section6}</Text>
          <PdfField label={m.place} value={data.place} />
          <PdfField label={m.date} value={data.date} />
          <View style={{ marginTop: 20 }}>
            <Text style={baseStyles.body}>{m.manufacturerSignatory}</Text>
            <Text style={baseStyles.body}>{m.signatureLine}</Text>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={baseStyles.body}>{m.representativeSignatory}</Text>
            <Text style={baseStyles.body}>{m.signatureLine}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
