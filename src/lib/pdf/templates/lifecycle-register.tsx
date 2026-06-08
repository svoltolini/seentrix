import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { baseStyles, colors } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";
import { PdfField } from "../components/pdf-field";

export interface LifecycleRegisterData {
  productName: string;
  conformity: { route: string; notifiedBody: string; surveillance: string };
  suppliers: { relation: string; name: string; address: string; contact: string }[];
  monitoring: { date: string; source: string; severity: string; description: string }[];
  advisories: { ref: string; title: string; fixed: string; published: string }[];
  tests: { type: string; last: string; next: string; result: string }[];
  supportEnd: string;
  eosNotice: string;
  correctiveAction: string;
}

const s = StyleSheet.create({
  divider: {
    backgroundColor: colors.navy,
    color: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 3,
  },
  dividerText: { fontSize: 12, fontFamily: "Helvetica-Bold", color: colors.white },
  row: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 3,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  meta: { fontSize: 8, color: colors.textMuted },
  none: { fontSize: 9, color: colors.textMuted, fontFamily: "Helvetica-Oblique" },
});

function Divider({ children }: { children: string }) {
  return (
    <View style={s.divider}>
      <Text style={s.dividerText}>{children}</Text>
    </View>
  );
}

export function LifecycleRegisterPdf({
  data,
  messages: m,
  generatedAt,
}: {
  data: LifecycleRegisterData;
  messages: Record<string, string>;
  generatedAt: string;
}) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title={m.title} />
        <PdfFooter generatedAt={generatedAt} />

        <Text style={baseStyles.h1}>{m.title}</Text>
        <Text style={baseStyles.body}>{data.productName}</Text>
        <View style={baseStyles.divider} />

        {/* Conformity module */}
        <Divider>{m.conformity}</Divider>
        <PdfField label={m.route} value={data.conformity.route} />
        <PdfField label={m.notifiedBody} value={data.conformity.notifiedBody} />
        <PdfField label={m.surveillance} value={data.conformity.surveillance} />

        {/* Supply chain */}
        <Divider>{m.supplyChain}</Divider>
        {data.suppliers.length ? (
          data.suppliers.map((x, i) => (
            <View key={i} style={s.row}>
              <Text>
                [{x.relation}] {x.name}
              </Text>
              <Text style={s.meta}>
                {[x.address, x.contact].filter(Boolean).join(" · ")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.none}>{m.none}</Text>
        )}
        <Text style={[s.meta, { marginTop: 4 }]}>{m.retentionNote}</Text>

        {/* Post-market monitoring */}
        <Divider>{m.monitoring}</Divider>
        {data.monitoring.length ? (
          data.monitoring.map((x, i) => (
            <View key={i} style={s.row}>
              <Text>
                {x.date} · {x.source}
                {x.severity ? ` · ${x.severity}` : ""}
              </Text>
              <Text style={s.meta}>{x.description}</Text>
            </View>
          ))
        ) : (
          <Text style={s.none}>{m.none}</Text>
        )}

        {/* Advisories */}
        <Divider>{m.advisories}</Divider>
        {data.advisories.length ? (
          data.advisories.map((x, i) => (
            <View key={i} style={s.row}>
              <Text>
                {x.ref ? `${x.ref} — ` : ""}
                {x.title}
              </Text>
              <Text style={s.meta}>
                {[x.fixed && `fixed ${x.fixed}`, x.published].filter(Boolean).join(" · ")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.none}>{m.none}</Text>
        )}

        {/* Security tests */}
        <Divider>{m.securityTests}</Divider>
        {data.tests.length ? (
          data.tests.map((x, i) => (
            <View key={i} style={s.row}>
              <Text>{x.type}</Text>
              <Text style={s.meta}>
                {[x.last && `last ${x.last}`, x.next && `next ${x.next}`, x.result]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.none}>{m.none}</Text>
        )}

        {/* End of support + corrective action */}
        <Divider>{m.endOfSupport}</Divider>
        <PdfField label={m.supportEnd} value={data.supportEnd} />
        <PdfField label={m.eosNotice} value={data.eosNotice} />
        <PdfField label={m.correctiveAction} value={data.correctiveAction} />
      </Page>
    </Document>
  );
}
