import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";

interface CertificateData {
  memberName: string;
  memberEmail: string;
  orgName: string;
  lessonTitle: string;
  lessonDuration: string;
  completedAt: string;
  scorePercent: string;
  certificateHash: string;
}

interface Props {
  data: CertificateData;
  messages: Record<string, string>;
  generatedAt: string;
}

/**
 * Academy completion certificate. One page, legally neutral — proof that
 * an individual passed a Seentrix Academy lesson at a given score on a
 * given date. The SHA-256 hash on the footer is the anti-tamper identifier
 * an auditor can match against the academy_completions table.
 */
export function AcademyCertificatePdf({ data, messages: m, generatedAt }: Props) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title={m.headerTitle} />
        <PdfFooter generatedAt={generatedAt} />

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 }}>
          <Text style={[baseStyles.h1, { fontSize: 11, letterSpacing: 2, color: "#6B7280" }]}>
            {m.eyebrow.toUpperCase()}
          </Text>
          <Text style={[baseStyles.h1, { marginTop: 14, textAlign: "center" }]}>
            {m.title}
          </Text>
          <Text style={[baseStyles.body, { marginTop: 6, textAlign: "center", color: "#6B7280" }]}>
            {m.subtitle}
          </Text>

          <View style={{ marginTop: 38, marginBottom: 38, borderTop: "1 solid #E5E7EB", borderBottom: "1 solid #E5E7EB", paddingTop: 22, paddingBottom: 22, width: "80%", alignItems: "center" }}>
            <Text style={[baseStyles.body, { color: "#6B7280", fontSize: 9 }]}>
              {m.recipientLabel}
            </Text>
            <Text style={[baseStyles.h1, { fontSize: 20, marginTop: 6 }]}>
              {data.memberName}
            </Text>
            <Text style={[baseStyles.body, { color: "#6B7280", fontSize: 10, marginTop: 2 }]}>
              {data.memberEmail}
            </Text>
            <Text style={[baseStyles.body, { color: "#6B7280", fontSize: 10, marginTop: 2 }]}>
              {data.orgName}
            </Text>
          </View>

          <Text style={[baseStyles.body, { textAlign: "center", maxWidth: "75%" }]}>
            {m.completedBody}
          </Text>

          <Text style={[baseStyles.h1, { fontSize: 16, marginTop: 20, textAlign: "center" }]}>
            {data.lessonTitle}
          </Text>
          <Text style={[baseStyles.body, { color: "#6B7280", marginTop: 4, textAlign: "center" }]}>
            {data.lessonDuration} · {data.scorePercent}
          </Text>

          <View style={{ marginTop: 36, flexDirection: "row", gap: 40 }}>
            <View>
              <Text style={[baseStyles.body, { color: "#6B7280", fontSize: 9 }]}>
                {m.dateLabel}
              </Text>
              <Text style={[baseStyles.body, { marginTop: 2 }]}>
                {data.completedAt}
              </Text>
            </View>
            <View>
              <Text style={[baseStyles.body, { color: "#6B7280", fontSize: 9 }]}>
                {m.certIdLabel}
              </Text>
              <Text style={[baseStyles.body, { marginTop: 2, fontFamily: "Courier" }]}>
                {data.certificateHash}
              </Text>
            </View>
          </View>

          <Text style={[baseStyles.body, { color: "#9CA3AF", fontSize: 8, marginTop: 50, textAlign: "center", maxWidth: "75%" }]}>
            {m.disclaimer}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
