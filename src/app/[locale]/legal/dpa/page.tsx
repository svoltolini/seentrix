/* eslint-disable react/no-unescaped-entities */
import { Link } from "@/i18n/navigation";

export default function DpaPage() {
  return (
    <>
      <h1>Data Processing Agreement</h1>
      <p className="text-xs text-muted-foreground/70">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <p>
        This Data Processing Agreement ("DPA") forms part of the{" "}
        <Link href="/legal/terms">Terms of Service</Link> between{" "}
        <strong>Seentrix Ltd</strong> (company number 17169165, registered in
        England and Wales at 167-169 Great Portland Street, London W1W 5PF;
        "Processor", "Seentrix") and you or the entity you represent
        ("Controller", "Customer"). It applies whenever Seentrix processes
        personal data on behalf of the Controller in connection with the
        Service.
      </p>

      <h2>1. Definitions</h2>
      <p>
        Terms such as "personal data", "processing", "controller",
        "processor", and "sub-processor" have the meanings given to them
        in Regulation (EU) 2016/679 (the "GDPR").
      </p>

      <h2>2. Subject matter and duration</h2>
      <p>
        Seentrix processes personal data as a processor for the purpose of
        providing the Service, for the duration of the Controller's
        subscription. Upon termination the data is retained for 30 days
        then deleted, except records required by law (e.g. CRA 10-year
        DoC retention).
      </p>

      <h2>3. Nature and purpose of processing</h2>
      <p>
        Seentrix processes personal data to: authenticate users, organise
        compliance artefacts (products, SBOMs, incidents, DoCs), generate
        regulatory documents, deliver transactional communications, and
        record audit-grade activity logs.
      </p>

      <h2>4. Categories of data subjects and data</h2>
      <ul>
        <li>
          <strong>Data subjects:</strong> Customer's employees and
          contractors who use the Service; individuals named as signatories
          or signatories on Declarations of Conformity; researchers who
          submit reports through the public PSIRT page; affected end users
          named in incident notifications.
        </li>
        <li>
          <strong>Personal data:</strong> names, business email addresses,
          roles, avatar images, signatures (typed name + title), optional
          reporter contact details.
        </li>
      </ul>

      <h2>5. Processor obligations</h2>
      <p>Seentrix will:</p>
      <ul>
        <li>Process personal data only on documented instructions from the Controller.</li>
        <li>Ensure all personnel authorised to process personal data have committed to confidentiality.</li>
        <li>Implement appropriate technical and organisational measures (TOMs) as described in Schedule A.</li>
        <li>Assist the Controller in responding to data-subject requests.</li>
        <li>Notify the Controller of any personal-data breach without undue delay and in any event within 72 hours.</li>
      </ul>

      <h2>6. Sub-processors</h2>
      <p>
        The Controller authorises Seentrix to engage the sub-processors
        listed at <a href="#subprocessors">Schedule B</a>. We will give at
        least 30 days' notice (via email to the account admin) before
        adding or replacing a sub-processor. The Controller may object to
        a change; if we cannot accommodate the objection, either party
        may terminate the affected portion of the Service.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Where a transfer outside the EEA occurs, the Standard Contractual
        Clauses (Commission Implementing Decision (EU) 2021/914) apply as
        incorporated by this DPA. Additional safeguards are applied based
        on Transfer Impact Assessments ("TIAs") we perform per
        sub-processor.
      </p>

      <h2>8. Controller obligations</h2>
      <p>
        The Controller warrants that it has a valid legal basis for every
        data-subject's data uploaded to the Service, and will not upload
        special-category data (GDPR Art. 9) unless a specific data-class
        addendum has been signed.
      </p>

      <h2>9. Return and deletion</h2>
      <p>
        Upon termination of the Service the Controller may export all
        processed data in a machine-readable format within 30 days. After
        that period, Seentrix will delete the data from live systems within
        14 days and from backups within the next rolling backup cycle
        (up to 30 days).
      </p>

      <h2>10. Audits</h2>
      <p>
        Seentrix will respond to a reasonable data-processing-related audit
        inquiry from the Controller once per calendar year, by providing a
        current SOC 2 Type II report (when available) or completing the
        Controller's security questionnaire. On-site audits are limited to
        when strictly necessary and the Controller bears the cost.
      </p>

      <h2 id="schedule-a">Schedule A — Technical and organisational measures</h2>
      <ul>
        <li>TLS 1.3 for data in transit; AES-256 for data at rest.</li>
        <li>Role-based access control (admin / compliance officer / CTO / editor / viewer) with row-level security in the database.</li>
        <li>Multi-factor authentication available; administrator MFA required.</li>
        <li>Annual penetration testing (external); vulnerability scanning on every deployment.</li>
        <li>Incident response plan with 72-hour data-breach notification.</li>
        <li>Least-privilege access to production; all production access audit-logged.</li>
        <li>Data segregation: one Postgres schema with org-scoped RLS; no cross-customer queries possible at the database layer.</li>
      </ul>

      <h2 id="subprocessors">Schedule B — Sub-processors</h2>
      <table>
        <thead>
          <tr>
            <th>Processor</th>
            <th>Purpose</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase, Inc.</td>
            <td>Database + authentication</td>
            <td>EU (Frankfurt)</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Web application hosting</td>
            <td>EU (Frankfurt) edge + US-based control plane</td>
          </tr>
          <tr>
            <td>Stripe Payments Europe Ltd.</td>
            <td>Billing + payments</td>
            <td>Ireland + US</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Transactional email delivery</td>
            <td>US</td>
          </tr>
          <tr>
            <td>Sentry (Functional Software, Inc.)</td>
            <td>Error monitoring</td>
            <td>US</td>
          </tr>
          <tr>
            <td>Mistral AI SAS</td>
            <td>Seentrix AI — LLM inference + embeddings</td>
            <td>France (EU)</td>
          </tr>
          <tr>
            <td>Upstash, Inc.</td>
            <td>Rate-limit store for Seentrix AI quotas</td>
            <td>Ireland (EU)</td>
          </tr>
        </tbody>
      </table>

      <p>
        Sign a counter-signed copy of this DPA by emailing{" "}
        <a href="mailto:support@seentrix.com">support@seentrix.com</a>.
      </p>
      <p className="mt-6 text-xs text-muted-foreground/70">
        Seentrix Ltd · Company number 17169165 · Registered in England and Wales ·
        167-169 Great Portland Street, London W1W 5PF, United Kingdom
      </p>
    </>
  );
}

export const metadata = { title: "Data Processing Agreement" };
