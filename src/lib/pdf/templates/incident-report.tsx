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

export function IncidentReportPdf({
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

        {/* Phase A — Early Warning (within 24 hours) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.phaseA}</Text>
          <View style={baseStyles.calloutBox}>
            <Text style={baseStyles.calloutLabel}>TIMELINE</Text>
            <Text style={baseStyles.body}>{m.phaseACallout}</Text>
          </View>
          <PdfField label={m.incidentTitle} value={data.incidentTitle} />
          <PdfField label={m.incidentDate} value={data.incidentDate} />
          <PdfField
            label={m.incidentDescription}
            value={data.incidentDescription}
          />
        </View>

        <View style={baseStyles.divider} />

        {/* Phase B — Full Notification (within 72 hours) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.phaseB}</Text>
          <View style={baseStyles.calloutBox}>
            <Text style={baseStyles.calloutLabel}>TIMELINE</Text>
            <Text style={baseStyles.body}>{m.phaseBCallout}</Text>
          </View>
          <PdfField
            label={m.fullDescription}
            value={data.incidentDescription}
          />
          <PdfField
            label={m.impactAssessment}
            value={data.impactAssessment}
          />
        </View>

        <View style={baseStyles.divider} />

        {/* Phase C — Final Report (within 14 days) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.phaseC}</Text>
          <View style={baseStyles.calloutBox}>
            <Text style={baseStyles.calloutLabel}>TIMELINE</Text>
            <Text style={baseStyles.body}>{m.phaseCCallout}</Text>
          </View>
          <PdfField
            label={m.mitigationActions}
            value={data.mitigationActions}
          />
          <PdfField
            label={m.notificationDate}
            value={data.notificationDate}
          />
        </View>
      </Page>
    </Document>
  );
}
