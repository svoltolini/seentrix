/* eslint-disable react/no-unescaped-entities */
import { Link } from "@/i18n/navigation";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-xs text-muted-foreground/70">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <h2>1. Who we are</h2>
      <p>
        <strong>Seentrix Ltd</strong> (company number{" "}
        <strong>17169165</strong>, registered in England and Wales at{" "}
        <strong>167-169 Great Portland Street, London, England, W1W 5PF</strong>)
        is the data controller for personal data processed through Seentrix.
        You can reach our privacy team at{" "}
        <a href="mailto:support@seentrix.com">support@seentrix.com</a>.
      </p>

      <h2>2. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email, role, avatar, password
          (hashed by Supabase Auth, never stored in plain text).
        </li>
        <li>
          <strong>Organisation data:</strong> company legal name,
          registration number, address, signatory, product information —
          provided by you during onboarding and product creation.
        </li>
        <li>
          <strong>Compliance artefacts:</strong> SBOMs, vulnerability reports,
          incident records, Declarations of Conformity, Academy completions.
        </li>
        <li>
          <strong>Usage data:</strong> activity log entries (who did what,
          when) retained to meet CRA Article 13 evidence requirements.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, user agent, device
          type — used for security (rate-limiting, audit) and to improve
          the Service.
        </li>
      </ul>

      <h2>3. Legal bases for processing</h2>
      <ul>
        <li>
          <strong>Contract (GDPR Art. 6(1)(b)):</strong> to provide the
          Service you subscribed to.
        </li>
        <li>
          <strong>Legal obligation (Art. 6(1)(c)):</strong> tax records,
          CRA-mandated retention of Declarations of Conformity and
          technical documentation (10 years).
        </li>
        <li>
          <strong>Legitimate interest (Art. 6(1)(f)):</strong> product
          analytics, fraud prevention, security monitoring.
        </li>
        <li>
          <strong>Consent (Art. 6(1)(a)):</strong> marketing newsletter —
          explicit opt-in, revocable any time.
        </li>
      </ul>

      <h2>4. Who we share data with</h2>
      <ul>
        <li>
          <strong>Supabase (database + auth):</strong> EU-based infrastructure.
          Processes all application data on our behalf.
        </li>
        <li>
          <strong>Vercel (hosting):</strong> serves our web application.
          Logs IP and request metadata for 30 days.
        </li>
        <li>
          <strong>Stripe (billing):</strong> processes payment information.
          We never see your card number.
        </li>
        <li>
          <strong>Resend / postal provider:</strong> delivers transactional
          email (password reset, invites).
        </li>
        <li>
          <strong>Sentry (error tracking):</strong> receives anonymised
          error traces when enabled; no PII is intentionally included.
        </li>
      </ul>
      <p>
        Each processor has signed a data-processing agreement. Details and
        transfer mechanisms are listed in our{" "}
        <Link href="/legal/dpa">Data Processing Agreement</Link>.
      </p>

      <h2>5. International transfers</h2>
      <p>
        All data is stored in the EU. Where a sub-processor transfers data
        outside the EEA, we rely on the European Commission's Standard
        Contractual Clauses and conduct transfer-impact assessments.
      </p>

      <h2>6. Retention</h2>
      <ul>
        <li>Account + organisation data: for the life of your account + 90 days after deletion (backups).</li>
        <li>Activity log: 10 years (CRA + audit).</li>
        <li>Declarations of Conformity + technical documentation: 10 years after the last product unit was placed on the market (CRA requirement).</li>
        <li>Backups: 30 days rolling.</li>
        <li>Sentry error traces: 90 days.</li>
      </ul>

      <h2>7. Your rights (GDPR)</h2>
      <ul>
        <li><strong>Access:</strong> request a copy of your data.</li>
        <li><strong>Rectification:</strong> correct inaccurate data.</li>
        <li><strong>Erasure:</strong> delete your account and associated data (subject to legal retention periods).</li>
        <li><strong>Portability:</strong> export your data in a machine-readable format.</li>
        <li><strong>Restriction / objection:</strong> pause or stop specific processing.</li>
        <li><strong>Withdraw consent:</strong> any time, with no impact on past processing.</li>
        <li>
          <strong>Complain:</strong> to the UK Information Commissioner's
          Office (<a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">ico.org.uk</a>)
          or to the data-protection authority in your EU country of residence
          (e.g. the BfDI in Germany, the CNIL in France).
        </li>
      </ul>
      <p>
        Exercise any right by emailing{" "}
        <a href="mailto:support@seentrix.com">support@seentrix.com</a>. We
        respond within 30 days.
      </p>

      <h2>8. Security</h2>
      <p>
        Data is encrypted in transit (TLS 1.3) and at rest. Access is
        role-based with principle-of-least-privilege controls. Admin access
        to the production database is logged and periodically reviewed. We
        maintain an incident response process and will notify affected users
        of any personal-data breach within 72 hours, per Article 33 GDPR.
      </p>

      <h2>9. Cookies</h2>
      <p>
        See our <Link href="/legal/cookies">Cookie Policy</Link> for the list of
        cookies we set and how to manage them.
      </p>

      <h2>10. Children</h2>
      <p>
        Seentrix is a B2B platform and is not intended for children under
        16. We do not knowingly collect data from children.
      </p>

      <h2>11. Changes</h2>
      <p>
        Material changes will be notified by email. We keep a changelog
        below once this policy is reviewed by counsel.
      </p>
      <p className="mt-6 text-xs text-muted-foreground/70">
        Seentrix Ltd · Company number 17169165 · Registered in England and Wales ·
        167-169 Great Portland Street, London W1W 5PF, United Kingdom
      </p>
    </>
  );
}
