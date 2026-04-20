export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className="text-xs text-muted-foreground/70">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <h2>What cookies we use</h2>
      <p>
        Seentrix uses a small number of cookies, all of them necessary for
        the Service to function. We do not currently run advertising
        trackers.
      </p>

      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Retention</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sb-access-token</code>
            </td>
            <td>Authenticated session</td>
            <td>1 hour (rolling)</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>
              <code>sb-refresh-token</code>
            </td>
            <td>Session renewal</td>
            <td>7 days</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>
              <code>NEXT_LOCALE</code>
            </td>
            <td>Remember language preference (en / de)</td>
            <td>1 year</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>
              <code>stb:*</code>
            </td>
            <td>Dismissable training banner state (per screen)</td>
            <td>Indefinite (localStorage)</td>
            <td>Strictly necessary</td>
          </tr>
        </tbody>
      </table>

      <h2>Consent</h2>
      <p>
        All the cookies above are strictly necessary for the platform to
        work (authentication, language, user preferences). Under the ePrivacy
        Directive these may be set without explicit consent — the banner
        that appears on your first visit is informational. If we later add
        analytics or marketing cookies they will require explicit opt-in.
      </p>

      <h2>Managing cookies</h2>
      <p>
        Most browsers let you block or delete cookies in their settings.
        Blocking strictly-necessary cookies will prevent you from logging
        in.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies:{" "}
        <a href="mailto:support@seentrix.com">support@seentrix.com</a>.
      </p>
      <p className="mt-6 text-xs text-muted-foreground/70">
        Seentrix Ltd · Company number 17169165 · Registered in England and Wales ·
        167-169 Great Portland Street, London W1W 5PF, United Kingdom
      </p>
    </>
  );
}

export const metadata = { title: "Cookie policy" };
