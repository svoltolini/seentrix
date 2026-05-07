/* eslint-disable react/no-unescaped-entities */
import { Link } from "@/i18n/navigation";

/**
 * Impressum / Legal notice.
 *
 * German law (§5 TMG, §18 MStV) requires an Impressum on every commercial
 * website accessible in Germany, regardless of the company's country of
 * incorporation. Seentrix Ltd is a UK company but the page is kept here
 * (in English only) so the regulatory entries are still discoverable for
 * any DE-based visitor who lands on the site.
 *
 * The page doubles as the UK "registered office" notice under the
 * Companies (Trading Disclosures) Regulations 2008 — same data, one place.
 */
export default function ImpressumPage() {
  return (
    <>
      <h1>Legal notice (Impressum)</h1>
      <p className="text-xs text-muted-foreground">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <h2>Provider of this website</h2>
      <p>
        <strong>Seentrix Ltd</strong>
        <br />
        167-169 Great Portland Street
        <br />
        London, England, W1W 5PF
        <br />
        United Kingdom
      </p>

      <h2>Company registration</h2>
      <p>
        Private limited company registered in England and Wales at Companies
        House under number <strong>17169165</strong>.
      </p>

      <h2>Contact</h2>
      <p>
        Email: <a href="mailto:support@seentrix.com">support@seentrix.com</a>
        <br />
        Web: <a href="https://seentrix.com">seentrix.com</a>
      </p>

      <h2>Responsible for content</h2>
      <p>
        Samuel Voltolini, Director — Seentrix Ltd, at the address above.
        Responsible in the sense of §18 Abs. 2 MStV (Germany).
      </p>

      <h2>EU representative (GDPR Art. 27)</h2>
      <p>
        As a UK-established controller of personal data belonging to
        individuals in the EU, Seentrix Ltd acts as its own point of
        contact for GDPR matters while its customer base remains within
        the scope of Art. 27(2) (occasional processing, no large-scale
        special-category data). Data subjects and supervisory
        authorities can reach us at{" "}
        <a href="mailto:support@seentrix.com">support@seentrix.com</a>.
        Where a formal Art. 27 representative is required we will
        designate one and update this page.
      </p>

      <h2>Data protection</h2>
      <p>
        See our <Link href="/legal/privacy">Privacy Policy</Link> for details
        on how we process personal data, including the legal bases, data
        locations (EU hosting: Supabase eu-west-2 in London, Vercel fra1 in
        Frankfurt), and how to contact the UK Information Commissioner's
        Office (ICO) or your local EU data-protection authority.
      </p>

      <h2>VAT</h2>
      <p>
        Seentrix Ltd is below the UK VAT-registration threshold and is
        therefore not VAT-registered. Invoices issued via Stripe do not
        include VAT. We will register once turnover approaches the
        £90,000 statutory threshold.
      </p>

      <h2>Dispute resolution</h2>
      <p>
        The European Commission provides an online dispute-resolution
        platform at{" "}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noreferrer"
        >
          ec.europa.eu/consumers/odr
        </a>
        . Seentrix does not participate in dispute-resolution proceedings
        before a consumer conciliation board.
      </p>

      <h2>Liability for content and links</h2>
      <p>
        The content of this website has been prepared with care but we
        assume no liability for its completeness, accuracy, or timeliness.
        Our pages may contain links to external websites operated by third
        parties over whose content we have no control; responsibility for
        that content lies solely with the respective operators.
      </p>

      <h2>Copyright</h2>
      <p>
        © {new Date().getFullYear()} Seentrix Ltd. All content on this
        website, including the Seentrix wordmark and mark, is protected by
        copyright and trade-mark law. Duplication or use requires prior
        written consent.
      </p>

      <p className="mt-6 text-xs text-muted-foreground">
        Seentrix Ltd · Companies House 17169165 · 167-169 Great Portland
        Street, London W1W 5PF, United Kingdom
      </p>
    </>
  );
}

export const metadata = { title: "Impressum" };
