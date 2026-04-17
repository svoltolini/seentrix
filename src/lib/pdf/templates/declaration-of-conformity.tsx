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

export function DeclarationOfConformityPdf({
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

        {/* Section 1: Manufacturer */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section1}</Text>
          <PdfField label={m.manufacturerName} value={data.manufacturerName} />
          <PdfField
            label={m.manufacturerAddress}
            value={data.manufacturerAddress}
          />
        </View>

        {/* Section 2: Product */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section2}</Text>
          <PdfField label={m.productName} value={data.productName} />
          <PdfField
            label={m.productIdentification}
            value={data.productIdentification}
          />
        </View>

        {/* Section 3: Conformity Statement */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section3}</Text>
          <PdfField
            label={m.conformityStatement}
            value={data.conformityStatement}
          />
        </View>

        {/* Section 4: Standards */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section4}</Text>
          <PdfField
            label={m.standardsApplied}
            value={data.standardsApplied}
          />
        </View>

        {/* Section 5: Notified Body */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section5}</Text>
          <PdfField
            label={m.notifiedBodyName}
            value={data.notifiedBodyName}
          />
          <PdfField
            label={m.notifiedBodyNumber}
            value={data.notifiedBodyNumber}
          />
        </View>

        {/* Section 6: Signed */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section6}</Text>
          <PdfField label={m.place} value={data.place} />
          <PdfField label={m.date} value={data.date} />
          <View style={{ marginTop: 20 }}>
            <Text style={baseStyles.body}>{m.signatureLine}</Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <PdfField label={m.signatoryName} value={data.signatoryName} />
            <PdfField
              label={m.signatoryPosition}
              value={data.signatoryPosition}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
