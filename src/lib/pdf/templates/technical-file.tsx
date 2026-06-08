import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { baseStyles, colors } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";
import { PdfField } from "../components/pdf-field";

/**
 * Assembled Annex VII technical file (Phase 3). One branded multi-section PDF
 * compiling the artifacts of the earlier phases in Annex VII order, with
 * navy section dividers and embedded architecture/data-flow diagram PNGs.
 */

export interface TfVersion {
  version: string;
  releasedAt: string;
  type: string;
}
export interface TfDiagram {
  title: string;
  type: string;
  imageDataUri: string | null;
}
export interface TfEvidence {
  title: string;
  category: string;
  annexPoint: string | null;
}
export interface TfManifestRow {
  ref: string;
  label: string;
  coverage: "present" | "partial" | "missing";
}

export interface TechnicalFileData {
  productName: string;
  version: number;
  retentionUntil: string | null;
  manifest: TfManifestRow[];
  // 1
  description: string;
  intendedUse: string;
  connectivity: string;
  productType: string;
  craCategory: string;
  manufacturer: string;
  manufacturerAddress: string;
  versions: TfVersion[];
  // 2a
  diagrams: TfDiagram[];
  // 2b
  sbom: {
    format: string;
    components: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    kev: number;
  } | null;
  vdpPresent: boolean;
  securityContact: string;
  updateMechanism: string;
  // 2c
  production: string;
  // 3
  riskAssessment: {
    version: number;
    releasedAt: string;
    applies: number;
    notApplicable: number;
    unmapped: number;
  } | null;
  // 4
  supportStart: string;
  supportEnd: string;
  // 5
  standards: string;
  // 6
  evidence: TfEvidence[];
  // 7
  docStatus: string;
  docSignatory: string;
}

const COVERAGE_HEX: Record<string, string> = {
  present: "#4CD964",
  partial: "#F59E0B",
  missing: "#E60019",
};

const s = StyleSheet.create({
  divider: {
    backgroundColor: colors.navy,
    color: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 18,
    marginBottom: 8,
    borderRadius: 3,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  coverRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  coverRef: { width: 40, fontSize: 9, color: colors.textSecondary },
  coverLabel: { flex: 1, fontSize: 9, color: colors.text },
  coverDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  coverState: { fontSize: 8, fontFamily: "Helvetica-Bold", width: 56, textAlign: "right" },
  diagramImg: {
    width: "100%",
    maxHeight: 260,
    objectFit: "contain",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  listItem: { fontSize: 9, color: colors.text, marginBottom: 2 },
  retention: {
    backgroundColor: colors.background,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 8,
    marginTop: 6,
    marginBottom: 4,
    fontSize: 9,
  },
});

function Divider({ children }: { children: string }) {
  return (
    <View style={s.divider}>
      <Text style={s.dividerText}>{children}</Text>
    </View>
  );
}

export function TechnicalFilePdf({
  data,
  messages: m,
  generatedAt,
}: {
  data: TechnicalFileData;
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
          {data.productName} · {m.version} {data.version}
        </Text>
        {data.retentionUntil ? (
          <View style={s.retention}>
            <Text>
              {m.retainedUntil}: {data.retentionUntil} — {m.retentionNote}
            </Text>
          </View>
        ) : null}
        <View style={baseStyles.divider} />

        {/* Coverage summary */}
        <Text style={baseStyles.h2}>{m.coverageHeading}</Text>
        {data.manifest.map((row) => (
          <View key={row.ref} style={s.coverRow}>
            <Text style={s.coverRef}>{row.ref}</Text>
            <Text style={s.coverLabel}>{row.label}</Text>
            <View
              style={[s.coverDot, { backgroundColor: COVERAGE_HEX[row.coverage] }]}
            />
            <Text style={[s.coverState, { color: COVERAGE_HEX[row.coverage] }]}>
              {m[`coverage_${row.coverage}`]}
            </Text>
          </View>
        ))}

        {/* 1 — General description */}
        <Divider>{`1 · ${m.point_general_description}`}</Divider>
        <PdfField label={m.f_manufacturer} value={data.manufacturer} />
        <PdfField label={m.f_address} value={data.manufacturerAddress} />
        <PdfField label={m.f_description} value={data.description} />
        <PdfField label={m.f_intendedUse} value={data.intendedUse} />
        <PdfField label={m.f_connectivity} value={data.connectivity} />
        <PdfField
          label={m.f_type}
          value={`${data.productType} · ${data.craCategory}`}
        />
        <Text style={baseStyles.label}>{m.f_versions}</Text>
        {data.versions.length ? (
          data.versions.map((v, idx) => (
            <Text key={idx} style={s.listItem}>
              • {v.version} ({v.type}) — {v.releasedAt}
            </Text>
          ))
        ) : (
          <Text style={baseStyles.value}>{m.none}</Text>
        )}

        {/* 2(a) — Design & architecture */}
        <Divider>{`2(a) · ${m.point_design_architecture}`}</Divider>
        {data.diagrams.length ? (
          data.diagrams.map((d, idx) => (
            <View key={idx} wrap={false}>
              <Text style={baseStyles.label}>
                {d.title} ({d.type})
              </Text>
              {d.imageDataUri ? (
                // @react-pdf Image is not an HTML <img> and takes no alt prop.
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image style={s.diagramImg} src={d.imageDataUri} />
              ) : (
                <Text style={baseStyles.value}>{m.noPreview}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={baseStyles.value}>{m.missingDiagrams}</Text>
        )}

        {/* 2(b) — Vulnerability handling */}
        <Divider>{`2(b) · ${m.point_vuln_handling}`}</Divider>
        {data.sbom ? (
          <Text style={baseStyles.value}>
            {m.f_sbom}: {data.sbom.format.toUpperCase()} · {data.sbom.components}{" "}
            {m.components} · {data.sbom.critical}C / {data.sbom.high}H /{" "}
            {data.sbom.medium}M / {data.sbom.low}L · {data.sbom.kev} KEV
          </Text>
        ) : (
          <PdfField label={m.f_sbom} value="" />
        )}
        <PdfField
          label={m.f_vdp}
          value={data.vdpPresent ? m.yes : ""}
        />
        <PdfField label={m.f_securityContact} value={data.securityContact} />
        <PdfField label={m.f_updateMechanism} value={data.updateMechanism} />

        {/* 2(c) — Production & monitoring */}
        <Divider>{`2(c) · ${m.point_production_monitoring}`}</Divider>
        <PdfField label={m.f_production} value={data.production} />

        {/* 3 — Risk assessment */}
        <Divider>{`3 · ${m.point_risk_assessment}`}</Divider>
        {data.riskAssessment ? (
          <Text style={baseStyles.value}>
            {m.f_raReleased} v{data.riskAssessment.version} ·{" "}
            {data.riskAssessment.releasedAt} — {data.riskAssessment.applies}{" "}
            {m.raApplies}, {data.riskAssessment.notApplicable} {m.raNa},{" "}
            {data.riskAssessment.unmapped} {m.raUnmapped}
          </Text>
        ) : (
          <Text style={baseStyles.value}>{m.missingRa}</Text>
        )}

        {/* 4 — Support period */}
        <Divider>{`4 · ${m.point_support_period}`}</Divider>
        <PdfField
          label={m.f_supportPeriod}
          value={
            data.supportStart || data.supportEnd
              ? `${data.supportStart || "?"} → ${data.supportEnd || "?"}`
              : ""
          }
        />

        {/* 5 — Standards applied */}
        <Divider>{`5 · ${m.point_standards}`}</Divider>
        <PdfField label={m.f_standards} value={data.standards} />

        {/* 6 — Test reports */}
        <Divider>{`6 · ${m.point_test_reports}`}</Divider>
        {data.evidence.length ? (
          data.evidence.map((e, idx) => (
            <Text key={idx} style={s.listItem}>
              • {e.title} — {e.category}
              {e.annexPoint ? ` (Annex VII ${e.annexPoint})` : ""}
            </Text>
          ))
        ) : (
          <Text style={baseStyles.value}>{m.missingEvidence}</Text>
        )}

        {/* 7 — Declaration of Conformity */}
        <Divider>{`7 · ${m.point_declaration_of_conformity}`}</Divider>
        <PdfField label={m.f_docStatus} value={data.docStatus} />
        <PdfField label={m.f_signatory} value={data.docSignatory} />
      </Page>
    </Document>
  );
}
