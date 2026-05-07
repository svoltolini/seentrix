import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { baseStyles, colors } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";
import { PdfField } from "../components/pdf-field";

const riskStyles = StyleSheet.create({
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  riskBadgeText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
});

const RISK_COLORS: Record<string, string> = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#FF6D00",
};

interface Props {
  data: Record<string, string>;
  messages: Record<string, string>;
  generatedAt: string;
}

export function RiskAssessmentPdf({
  data,
  messages: m,
  generatedAt,
}: Props) {
  const riskLevel = data.riskLevel || "medium";
  const riskColor = RISK_COLORS[riskLevel] || RISK_COLORS.medium;
  const riskLabelKey = `riskLevel${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)}` as string;
  const riskLabel = m[riskLabelKey] || riskLevel;

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title={m.title} />
        <PdfFooter generatedAt={generatedAt} />

        <Text style={baseStyles.h1}>{m.title}</Text>
        <Text style={baseStyles.body}>{m.subtitle}</Text>
        <View style={baseStyles.divider} />

        {/* Section 1: Assessment Overview */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section1}</Text>
          <PdfField label={m.riskTitle} value={data.riskTitle} />
        </View>

        {/* Section 2: Threat Description */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section2}</Text>
          <PdfField
            label={m.threatDescription}
            value={data.threatDescription}
          />
        </View>

        {/* Section 3: Vulnerabilities */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section3}</Text>
          <PdfField
            label={m.vulnerabilitiesIdentified}
            value={data.vulnerabilitiesIdentified}
          />
        </View>

        {/* Section 4: Risk Level */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section4}</Text>
          <Text style={baseStyles.label}>{m.riskLevel}</Text>
          <View
            style={[
              riskStyles.riskBadge,
              { backgroundColor: riskColor },
            ]}
          >
            <Text style={riskStyles.riskBadgeText}>{riskLabel}</Text>
          </View>
        </View>

        {/* Section 5: Mitigation Plan */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section5}</Text>
          <PdfField
            label={m.mitigationPlan}
            value={data.mitigationPlan}
          />
        </View>

        {/* Section 6: Residual Risk */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.section6}</Text>
          <PdfField label={m.residualRisk} value={data.residualRisk} />
        </View>
      </Page>
    </Document>
  );
}
