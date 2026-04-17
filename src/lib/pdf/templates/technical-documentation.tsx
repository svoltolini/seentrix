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

export function TechnicalDocumentationPdf({
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

        {/* Section 1: Scope */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section1}</Text>
          <PdfField label={m.techDocScope} value={data.techDocScope} />
        </View>

        {/* Section 2: Design Description */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section2}</Text>
          <PdfField
            label={m.designDescription}
            value={data.designDescription}
          />
        </View>

        {/* Section 3: Development Process */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section3}</Text>
          <PdfField
            label={m.developmentProcess}
            value={data.developmentProcess}
          />
        </View>

        {/* Section 4: Testing and Verification */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section4}</Text>
          <PdfField label={m.testingResults} value={data.testingResults} />
        </View>

        {/* Section 5: Update Mechanism */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section5}</Text>
          <PdfField
            label={m.updateMechanism}
            value={data.updateMechanism}
          />
        </View>

        {/* Section 6: Support Period */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section6}</Text>
          <PdfField label={m.supportPeriod} value={data.supportPeriod} />
        </View>
      </Page>
    </Document>
  );
}
