/* eslint-disable react/no-unescaped-entities */
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { baseStyles, colors } from "../styles";
import { PdfHeader } from "../components/pdf-header";
import { PdfFooter } from "../components/pdf-footer";

/**
 * Seentrix business plan — one-pager (3 printed pages).
 *
 * Produced for banking / KYC / institutional onboarding contexts where a
 * formal description of the business is required (e.g. Revolut Business
 * enhanced due diligence, Stripe Atlas, investor intros). Not a pitch deck;
 * deliberately factual and evidence-able.
 *
 * Visual language mirrors the other Seentrix PDFs (DoC, incident report,
 * end-user info sheet): navy header bar with the app's wordmark logo,
 * light body, primary-blue callouts.
 */

const styles = StyleSheet.create({
  // Wordmark beneath the hero — "SEENTRIX" displayed all-caps, tracked.
  cover: {
    marginTop: 24,
    marginBottom: 24,
  },
  coverEyebrow: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    marginBottom: 6,
    lineHeight: 1.15,
  },
  coverSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 1.5,
    marginBottom: 18,
  },
  coverMeta: {
    flexDirection: "row",
    gap: 28,
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  coverMetaCol: {
    flexDirection: "column",
    gap: 2,
  },
  coverMetaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  coverMetaValue: {
    fontSize: 10,
    color: colors.text,
  },
  // Exec summary callout — the one block a reader will skim.
  execCallout: {
    backgroundColor: colors.background,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 14,
    marginTop: 18,
    marginBottom: 20,
  },
  execLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  execBody: {
    fontSize: 10,
    lineHeight: 1.55,
    color: colors.text,
  },
  // Section heading — number + title + rule.
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 22,
    marginBottom: 10,
  },
  sectionNumber: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
  },
  sectionHeadRule: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#D4D4D8",
    marginBottom: 12,
    marginTop: 2,
  },
  // Two-column key/value grid used for the Company block.
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    width: "50%",
    marginBottom: 10,
    paddingRight: 10,
  },
  gridLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
  },
  // Prose paragraph.
  para: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.text,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: colors.primary,
    fontFamily: "Helvetica-Bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
  },
  // Pricing table.
  pricingHeader: {
    flexDirection: "row",
    backgroundColor: colors.navy,
    padding: 8,
  },
  pricingHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pricingRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
    padding: 8,
  },
  pricingCell: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.4,
  },
  pricingCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
  },
  // Milestone rail on last page.
  milestoneRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  milestonePeriod: {
    width: 80,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  milestoneText: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
  },
  // Sign-off block on the final page.
  signoff: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  signoffLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  signoffName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
  },
  signoffRole: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

const SectionHead = ({ num, title }: { num: string; title: string }) => (
  <View>
    <View style={styles.sectionHead}>
      <Text style={styles.sectionNumber}>{num}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionHeadRule} />
  </View>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const GridCell = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.gridCell}>
    <Text style={styles.gridLabel}>{label}</Text>
    <Text style={styles.gridValue}>{value}</Text>
  </View>
);

interface Props {
  generatedAt: string;
  asOfDate: string; // e.g. "April 2026"
}

export function BusinessPlanPdf({ generatedAt, asOfDate }: Props) {
  return (
    <Document
      title="Seentrix — Business Plan"
      author="Seentrix Ltd"
      creator="Seentrix"
      producer="Seentrix"
    >
      {/* =========================================================== */}
      {/* PAGE 1 — Cover + executive summary + company + product       */}
      {/* =========================================================== */}
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title="Business plan" />
        <PdfFooter generatedAt={generatedAt} />

        <View style={styles.cover}>
          <Text style={styles.coverEyebrow}>Seentrix Ltd · Business plan</Text>
          <Text style={styles.coverTitle}>
            Compliance infrastructure for the EU Cyber Resilience Act
          </Text>
          <Text style={styles.coverSubtitle}>
            A B2B SaaS platform that helps European manufacturers of
            connected products evidence, document, and maintain compliance
            with Regulation (EU) 2024/2847 (the EU CRA) before enforcement
            becomes mandatory in December 2027.
          </Text>
          <View style={styles.coverMeta}>
            <View style={styles.coverMetaCol}>
              <Text style={styles.coverMetaLabel}>As of</Text>
              <Text style={styles.coverMetaValue}>{asOfDate}</Text>
            </View>
            <View style={styles.coverMetaCol}>
              <Text style={styles.coverMetaLabel}>Jurisdiction</Text>
              <Text style={styles.coverMetaValue}>England &amp; Wales</Text>
            </View>
            <View style={styles.coverMetaCol}>
              <Text style={styles.coverMetaLabel}>Companies House</Text>
              <Text style={styles.coverMetaValue}>17169165</Text>
            </View>
            <View style={styles.coverMetaCol}>
              <Text style={styles.coverMetaLabel}>Stage</Text>
              <Text style={styles.coverMetaValue}>Pre-revenue · bootstrapped</Text>
            </View>
          </View>
        </View>

        <View style={styles.execCallout}>
          <Text style={styles.execLabel}>Executive summary</Text>
          <Text style={styles.execBody}>
            Seentrix is a SaaS compliance platform targeted at European
            manufacturers of hardware, software, and IoT products that fall
            under the EU Cyber Resilience Act (CRA). The platform replaces
            the ad-hoc spreadsheets and Word templates most manufacturers
            currently use with a workflow that generates CRA-ready
            Declarations of Conformity, technical documentation, SBOMs,
            vulnerability disclosure pages, and audit-grade evidence.
            Revenue is subscription-based, billed in EUR via Stripe, with
            four tiers (Free, Professional, Business, Enterprise). The
            company is incorporated in England and Wales, registered for
            VAT-exemption under the threshold, and self-funded by its sole
            director. First paying customers are targeted for Q3 2026.
          </Text>
        </View>

        <SectionHead num="01" title="Company" />
        <View style={styles.grid}>
          <GridCell label="Legal name" value="Seentrix Ltd" />
          <GridCell label="Company type" value="Private company limited by shares" />
          <GridCell
            label="Companies House number"
            value="17169165"
          />
          <GridCell label="Incorporated" value="England and Wales, 2026" />
          <GridCell
            label="Registered office"
            value="167-169 Great Portland Street, London W1W 5PF, United Kingdom"
          />
          <GridCell label="Trading name" value="Seentrix" />
          <GridCell label="Director" value="Samuel Voltolini (sole director, British citizen)" />
          <GridCell
            label="SIC codes"
            value="62012 (Business software development), 63110 (Data processing, hosting)"
          />
          <GridCell label="Website" value="https://seentrix.com" />
          <GridCell label="Support contact" value="support@seentrix.com" />
        </View>

        <SectionHead num="02" title="Product" />
        <Text style={styles.para}>
          Seentrix is a multi-tenant web application used by product teams at
          manufacturers to track and evidence their Cyber Resilience Act
          obligations across each product they place on the EU market. The
          platform produces the legally-required artefacts automatically from
          structured inputs the customer provides, so a manufacturer does not
          have to draft them from scratch or maintain them manually.
        </Text>
        <Bullet>
          <Text>
            <Text style={styles.pricingCellBold}>
              Declaration of Conformity (DoC).
            </Text>{" "}
            Generated per product, signed electronically, versioned, and
            retained for the CRA-mandated ten years after the last unit is
            placed on the market.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            <Text style={styles.pricingCellBold}>Software bill of materials (SBOM).</Text>{" "}
            Ingested in CycloneDX 1.6 JSON format; every component is
            enriched against the OSV.dev vulnerability database and scored
            by CVSS so risk surfaces automatically in the dashboard.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            <Text style={styles.pricingCellBold}>
              Coordinated vulnerability disclosure.
            </Text>{" "}
            Each customer gets a public intake page (security.txt +
            branded report form) meeting the CRA Article 13(1)(c)
            "single point of contact" requirement.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            <Text style={styles.pricingCellBold}>
              Incident reporting workflow.
            </Text>{" "}
            Guides the customer through the CRA Article 14 24-hour early
            warning, 72-hour intermediate report, and 14-day final report
            to ENISA — with timestamps, audit log, and draft narrative
            auto-generated.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            <Text style={styles.pricingCellBold}>Academy and training.</Text>{" "}
            In-app courses (per role) that satisfy the CRA "demonstrable
            cybersecurity awareness" expectation for staff involved in
            product development.
          </Text>
        </Bullet>
      </Page>

      {/* =========================================================== */}
      {/* PAGE 2 — Regulatory context + market + revenue                */}
      {/* =========================================================== */}
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title="Business plan" />
        <PdfFooter generatedAt={generatedAt} />

        <SectionHead num="03" title="Regulatory context" />
        <Text style={styles.para}>
          The EU Cyber Resilience Act (Regulation (EU) 2024/2847) entered
          into force on 10 December 2024. Key reporting obligations apply
          from 11 September 2026, and the full conformity-assessment regime
          including CE-marking of products with digital elements becomes
          mandatory on 11 December 2027. Non-compliance is enforceable by
          national market-surveillance authorities with administrative
          fines up to €15 million or 2.5% of global annual turnover — the
          higher of the two. The CRA affects an estimated 10+ million
          products placed on the EU market each year, from industrial
          sensors to consumer electronics. Virtually every hardware company
          selling into the EU is in scope.
        </Text>

        <SectionHead num="04" title="Target market" />
        <Text style={styles.para}>
          The initial customer profile is a European mid-market
          manufacturer (20–500 employees) with one or more connected
          products shipped into the EU — typically an electronics OEM,
          industrial-automation vendor, or IoT startup that does not have
          a dedicated compliance department and cannot justify hiring an
          in-house CRA specialist. Secondary markets include contract
          manufacturers preparing documentation on behalf of brand owners,
          distributors of third-country products who become the "importer"
          under CRA Article 20, and software-only vendors now classified
          as manufacturers of "products with digital elements" under
          Article 3(1).
        </Text>
        <View style={styles.grid}>
          <GridCell
            label="Primary geography"
            value="DACH (Germany, Austria, Switzerland) and Benelux — highest density of regulated manufacturers"
          />
          <GridCell
            label="Secondary geography"
            value="Nordics + UK (UK CE equivalence discussions ongoing)"
          />
          <GridCell
            label="Addressable companies"
            value="~50,000 EU manufacturers in scope of the CRA (EU Commission impact-assessment estimate)"
          />
          <GridCell
            label="Entry price point"
            value="€59/month — deliberately below the hourly cost of compliance consultancy (€180+/hour)"
          />
        </View>

        <SectionHead num="05" title="Revenue model" />
        <Text style={styles.para}>
          Seentrix is a subscription-based SaaS. Customers self-serve
          online, pay monthly or annually in EUR through Stripe, and can
          cancel at any time via the billing portal. There is a permanent
          free tier sized to let a single engineer evaluate the platform
          with one product. VAT is not yet applied — Seentrix Ltd is
          below the UK VAT registration threshold; registration will be
          triggered once turnover approaches £90,000 annualised.
        </Text>
        <View style={styles.pricingHeader}>
          <Text style={[styles.pricingHeaderCell, { width: "24%" }]}>Plan</Text>
          <Text style={[styles.pricingHeaderCell, { width: "18%" }]}>Monthly</Text>
          <Text style={[styles.pricingHeaderCell, { width: "18%" }]}>Annual</Text>
          <Text style={[styles.pricingHeaderCell, { width: "15%" }]}>Products</Text>
          <Text style={[styles.pricingHeaderCell, { width: "12%" }]}>Users</Text>
          <Text style={[styles.pricingHeaderCell, { width: "13%" }]}>Support</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={[styles.pricingCellBold, { width: "24%" }]}>Free</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€0</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€0</Text>
          <Text style={[styles.pricingCell, { width: "15%" }]}>1</Text>
          <Text style={[styles.pricingCell, { width: "12%" }]}>1</Text>
          <Text style={[styles.pricingCell, { width: "13%" }]}>Community</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={[styles.pricingCellBold, { width: "24%" }]}>Professional</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€59</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€590 (2 months free)</Text>
          <Text style={[styles.pricingCell, { width: "15%" }]}>3</Text>
          <Text style={[styles.pricingCell, { width: "12%" }]}>3</Text>
          <Text style={[styles.pricingCell, { width: "13%" }]}>Email</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={[styles.pricingCellBold, { width: "24%" }]}>Business</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€199</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€1,990 (2 months free)</Text>
          <Text style={[styles.pricingCell, { width: "15%" }]}>15</Text>
          <Text style={[styles.pricingCell, { width: "12%" }]}>10</Text>
          <Text style={[styles.pricingCell, { width: "13%" }]}>Priority</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={[styles.pricingCellBold, { width: "24%" }]}>Enterprise</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€749</Text>
          <Text style={[styles.pricingCell, { width: "18%" }]}>€7,490 (2 months free)</Text>
          <Text style={[styles.pricingCell, { width: "15%" }]}>Unlimited</Text>
          <Text style={[styles.pricingCell, { width: "12%" }]}>Unlimited</Text>
          <Text style={[styles.pricingCell, { width: "13%" }]}>Dedicated</Text>
        </View>

        <Text style={[styles.para, { marginTop: 12 }]}>
          Payments are processed by Stripe Payments Europe Ltd., settled to
          the company's UK business account at Revolut. Refund policy is
          pro-rated per the Terms of Service. Enterprise customers can be
          invoiced annually via bank transfer on request. The expected
          blended ARPA (average revenue per account) is €120/month once
          the mix stabilises between Professional and Business tiers.
        </Text>

        <SectionHead num="06" title="Competitive context" />
        <Text style={styles.para}>
          The closest adjacent category is SOC 2 / ISO 27001 automation
          (Vanta, Drata, Thoropass) — similar workflow, different
          regulation. None of those platforms covers the CRA specifically
          today. The incumbent substitute is "a consultant plus Microsoft
          Word," which is slow, expensive, and does not produce machine-
          readable SBOMs or continuous evidence. Seentrix's moat is
          purpose-built depth: one regulation, every artefact the
          regulation actually asks for, generated from the customer's own
          data with version history.
        </Text>
      </Page>

      {/* =========================================================== */}
      {/* PAGE 3 — Ops + UK relationship + milestones + sign-off       */}
      {/* =========================================================== */}
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader title="Business plan" />
        <PdfFooter generatedAt={generatedAt} />

        <SectionHead num="07" title="Team and operations" />
        <Text style={styles.para}>
          Seentrix Ltd is currently run by a single director and founder,
          Samuel Voltolini. The company operates as a lean, remote-first
          business: day-to-day development and operations are performed by
          the director from the UK and from the director's home office
          abroad, using tooling that is fully remote-accessible (GitHub
          for source, Vercel for deployments, Supabase for data,
          Linear/Notion for planning, Slack for customer support). No
          physical premises are required, no employees have been hired,
          and the burn rate is limited to hosting and tooling
          subscriptions until a sustainable paid-user base is established.
          Contractors (legal review, localisation, design accents) are
          engaged on an as-needed basis and paid through Stripe/Revolut.
        </Text>

        <SectionHead num="08" title="Technology and data residency" />
        <Text style={styles.para}>
          All customer data is hosted in the European Union to comply with
          EU/EEA data-residency expectations of Seentrix's target
          customers:
        </Text>
        <Bullet>
          <Text>
            Database, authentication, and file storage are provided by
            Supabase in region{" "}
            <Text style={styles.pricingCellBold}>eu-west-2 (London)</Text>.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            The web application is served by Vercel from{" "}
            <Text style={styles.pricingCellBold}>fra1 (Frankfurt)</Text>.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            Error monitoring is hosted on{" "}
            <Text style={styles.pricingCellBold}>de.sentry.io</Text>{" "}
            (Germany) with session replays masked and PII disabled.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            Transactional email is delivered by Resend, signed with
            DMARC/SPF/DKIM from the seentrix.com domain.
          </Text>
        </Bullet>
        <Bullet>
          <Text>
            Payment data is tokenised by Stripe (PCI-DSS Level 1); the
            company never sees cardholder data.
          </Text>
        </Bullet>

        <SectionHead num="09" title="UK relationship and director operations" />
        <Text style={styles.para}>
          Seentrix Ltd was incorporated in England and Wales because the
          sole director is a British citizen, because English commercial
          law is well understood by international customers and banking
          partners, and because a UK entity preserves access to both the
          EU market (through CRA-compliant product sales) and the UK
          market (subject to any UK post-CRA equivalence). The registered
          office is at 167-169 Great Portland Street, London W1W 5PF; the
          statutory registers, PSC register, and director's service
          address are maintained there. Statutory filings (annual
          confirmation statement, accounts, Corporation Tax return) are
          filed with Companies House and HMRC online within their
          respective deadlines.
        </Text>
        <Text style={styles.para}>
          The director fulfils day-to-day obligations from abroad using
          remote-access tooling: Companies House WebFiling and HMRC online
          services for statutory filings, a UK business bank account for
          all company receipts and disbursements, a cloud accounting
          package for bookkeeping, and email plus video conferencing with
          customers and partners. The director travels to the UK
          periodically for statutory meetings, tax-residency compliance,
          and in-person banking where required. No UK employees are on
          the payroll at this stage.
        </Text>

        <SectionHead num="10" title="Key milestones" />
        <View style={styles.milestoneRow}>
          <Text style={styles.milestonePeriod}>Dec 2024</Text>
          <Text style={styles.milestoneText}>
            EU CRA enters into force — regulatory runway established.
          </Text>
        </View>
        <View style={styles.milestoneRow}>
          <Text style={styles.milestonePeriod}>Q1 2026</Text>
          <Text style={styles.milestoneText}>
            Seentrix Ltd incorporated in England and Wales (Companies
            House 17169165).
          </Text>
        </View>
        <View style={styles.milestoneRow}>
          <Text style={styles.milestonePeriod}>Q2 2026</Text>
          <Text style={styles.milestoneText}>
            Public beta of the platform (Declarations of Conformity,
            SBOM, vulnerability disclosure, Academy). Domain migration to
            seentrix.com. Stripe billing live. UK business bank account
            opened.
          </Text>
        </View>
        <View style={styles.milestoneRow}>
          <Text style={styles.milestonePeriod}>Q3 2026</Text>
          <Text style={styles.milestoneText}>
            First paying customers (Professional and Business tiers).
            Translations live in German. ICO registration and EU Art. 27
            representative appointed.
          </Text>
        </View>
        <View style={styles.milestoneRow}>
          <Text style={styles.milestonePeriod}>Sep 2026</Text>
          <Text style={styles.milestoneText}>
            CRA Article 14 reporting obligations apply — major go-to-
            market trigger.
          </Text>
        </View>
        <View style={styles.milestoneRow}>
          <Text style={styles.milestonePeriod}>Dec 2027</Text>
          <Text style={styles.milestoneText}>
            CRA full conformity-assessment regime mandatory. Target: 300+
            paying organisations by this milestone.
          </Text>
        </View>

        <View style={styles.signoff}>
          <Text style={styles.signoffLabel}>Signed for and on behalf of Seentrix Ltd</Text>
          <Text style={styles.signoffName}>Samuel Voltolini</Text>
          <Text style={styles.signoffRole}>
            Director · Seentrix Ltd · Companies House 17169165
          </Text>
        </View>
      </Page>
    </Document>
  );
}
