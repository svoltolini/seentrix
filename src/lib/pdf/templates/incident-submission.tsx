import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";
import { PdfField } from "../components/pdf-field";

/**
 * Article 14 submission package (Phase 4) — a structured, ENISA-oriented
 * rendering of one reporting stage (early warning / intermediate / final) for a
 * single incident, ready to attach to or transcribe into the Single Reporting
 * Platform. Reuses the shared PDF chrome.
 */

export interface IncidentSubmissionData {
  stageLabel: string;
  reportType: string;
  severity: string;
  incidentTitle: string;
  organisation: string;
  contact: string;
  awareAt: string;
  deadline: string;
  affectedProducts: string;
  cve: string;
  description: string;
  narrative: string;
  userNotification: string;
}

export function IncidentSubmissionPdf({
  data,
  messages: m,
  generatedAt,
}: {
  data: IncidentSubmissionData;
  messages: Record<string, string>;
  generatedAt: string;
}) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title={m.title} />
        <PdfFooter generatedAt={generatedAt} />

        <Text style={baseStyles.h1}>{m.title}</Text>
        <Text style={baseStyles.body}>
          {data.stageLabel} · {data.incidentTitle}
        </Text>
        <View style={baseStyles.calloutBox}>
          <Text style={baseStyles.calloutLabel}>{m.deadlineLabel}</Text>
          <Text>{data.deadline}</Text>
        </View>
        <View style={baseStyles.divider} />

        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.identification}</Text>
          <PdfField label={m.organisation} value={data.organisation} />
          <PdfField label={m.contact} value={data.contact} />
          <PdfField label={m.reportType} value={data.reportType} />
          <PdfField label={m.severity} value={data.severity} />
          <PdfField label={m.awareAt} value={data.awareAt} />
          <PdfField label={m.affectedProducts} value={data.affectedProducts} />
          <PdfField label={m.cve} value={data.cve} />
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.summary}</Text>
          <PdfField label={m.description} value={data.description} />
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.stageLabel}</Text>
          <PdfField label={data.stageLabel} value={data.narrative} />
        </View>

        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.userNotification}</Text>
          <PdfField label={m.userNotification} value={data.userNotification} />
        </View>
      </Page>
    </Document>
  );
}
