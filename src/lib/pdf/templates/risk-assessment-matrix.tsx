import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { baseStyles, colors } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";
import { PdfField } from "../components/pdf-field";
import { RISK_HEX } from "@/lib/constants/risk-matrix";

/**
 * Structured CRA risk-assessment PDF (Phase 2). Renders the Art 13(3) context
 * plus the per-Annex-I-requirement mapping (applicability + threat /
 * likelihood / impact / derived band / mitigation / residual risk, or a
 * justification for N/A). Reuses the shared PDF chrome (header/footer/styles).
 */

export interface RaPdfItem {
  requirementTitle: string;
  article: string;
  applicability: "applies" | "not_applicable" | null;
  threat: string;
  likelihood: string;
  impact: string;
  inherentBand: string;
  implementation: string;
  residualRisk: string;
  justification: string;
}

export interface RaPdfData {
  productName: string;
  version: number;
  intendedPurpose: string;
  operationalEnvironment: string;
  assetsToProtect: string;
  expectedLifetime: string;
  partI: RaPdfItem[];
  partII: RaPdfItem[];
}

const s = StyleSheet.create({
  itemBlock: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    flex: 1,
    paddingRight: 8,
  },
  article: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  metaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: colors.background,
  },
  metaBadgeText: {
    fontSize: 8,
    color: colors.textSecondary,
  },
  naText: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: "Helvetica-Oblique",
  },
});

function RiskBadge({ label, band }: { label: string; band: string }) {
  const bg = RISK_HEX[band as keyof typeof RISK_HEX] ?? colors.textMuted;
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={s.badgeText}>{label}</Text>
    </View>
  );
}

function MetaBadge({ label }: { label: string }) {
  return (
    <View style={s.metaBadge}>
      <Text style={s.metaBadgeText}>{label}</Text>
    </View>
  );
}

function Item({
  item,
  m,
}: {
  item: RaPdfItem;
  m: Record<string, string>;
}) {
  const levelLabel = (v: string) =>
    m[`level${v.charAt(0).toUpperCase()}${v.slice(1)}`] || v;

  return (
    <View style={s.itemBlock} wrap={false}>
      <View style={s.itemHead}>
        <Text style={s.itemTitle}>{item.requirementTitle}</Text>
        {item.applicability === "applies" && (
          <MetaBadge label={m.applies} />
        )}
        {item.applicability === "not_applicable" && (
          <MetaBadge label={m.notApplicable} />
        )}
      </View>
      <Text style={s.article}>{item.article}</Text>

      {item.applicability === "applies" && (
        <>
          {item.threat ? (
            <PdfField label={m.threat} value={item.threat} />
          ) : null}
          <View style={s.badgeRow}>
            <MetaBadge label={`${m.likelihood}: ${levelLabel(item.likelihood)}`} />
            <MetaBadge label={`${m.impact}: ${levelLabel(item.impact)}`} />
            {item.inherentBand ? (
              <RiskBadge
                label={`${m.inherentRisk}: ${levelLabel(item.inherentBand)}`}
                band={item.inherentBand}
              />
            ) : null}
            {item.residualRisk ? (
              <RiskBadge
                label={`${m.residualRisk}: ${levelLabel(item.residualRisk)}`}
                band={item.residualRisk}
              />
            ) : null}
          </View>
          {item.implementation ? (
            <PdfField label={m.implementation} value={item.implementation} />
          ) : null}
        </>
      )}

      {item.applicability === "not_applicable" && (
        <PdfField label={m.justification} value={item.justification} />
      )}

      {!item.applicability && <Text style={s.naText}>{m.notAssessed}</Text>}
    </View>
  );
}

export function RiskAssessmentMatrixPdf({
  data,
  messages: m,
  generatedAt,
}: {
  data: RaPdfData;
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
          {data.productName} · {m.versionLabel} {data.version}
        </Text>
        <View style={baseStyles.divider} />

        {/* Context (Art 13(3)) */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.contextHeading}</Text>
          <PdfField label={m.intendedPurpose} value={data.intendedPurpose} />
          <PdfField
            label={m.operationalEnvironment}
            value={data.operationalEnvironment}
          />
          <PdfField label={m.assetsToProtect} value={data.assetsToProtect} />
          <PdfField label={m.expectedLifetime} value={data.expectedLifetime} />
        </View>

        {/* Part I */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.partI}</Text>
          {data.partI.map((item, i) => (
            <Item key={`pi-${i}`} item={item} m={m} />
          ))}
        </View>

        {/* Part II */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.h2}>{m.partII}</Text>
          {data.partII.map((item, i) => (
            <Item key={`pii-${i}`} item={item} m={m} />
          ))}
        </View>
      </Page>
    </Document>
  );
}
