# Test data

Files used to exercise Seentrix features during QA. Not shipped to
production; gitignore-safe to keep under `docs/`.

## `test-sbom.cdx.json`

A synthetic CycloneDX 1.5 JSON SBOM listing ten real-world packages
with well-known CVEs across the severity range. On upload, Seentrix's
scanner calls OSV.dev for each PURL and records real vulnerabilities,
so the dashboard KPIs, Vulnerability Aging chart, and severity pills
render across critical, high, medium, and low severities.

### What each component triggers (rough severity expectations)

| Component | Version | PURL | Headline CVE(s) |
|---|---|---|---|
| log4j-core | 2.14.1 | maven | CVE-2021-44228 (Log4Shell) — **Critical** |
| minimist | 0.0.8 | npm | CVE-2020-7598 (prototype pollution) — **Critical** |
| serialize-javascript | 3.0.0 | npm | CVE-2020-7660 (XSS) — **High** |
| axios | 0.21.0 | npm | CVE-2020-28168 (SSRF) / 2023-45857 — **Medium/High** |
| node-forge | 0.10.0 | npm | CVE-2022-24771..73 (signature verification) — **High** |
| lodash | 4.17.15 | npm | CVE-2020-8203, CVE-2021-23337 — **High/Medium** |
| handlebars | 4.7.6 | npm | CVE-2021-23369 (RCE) — **High** |
| jquery | 1.12.4 | npm | CVE-2020-11022, CVE-2020-11023 (XSS) — **Medium** |
| marked | 0.6.0 | npm | CVE-2022-21680 (ReDoS) — **Medium** |
| express | 4.16.0 | npm | CVE-2024-29041, CVE-2022-24999 — **Low/Medium** |

Exact classifications depend on how OSV.dev reports CVSS back at scan
time — severities can shift as CVEs get re-scored. Count on seeing at
least one of each bucket.

### How to use

1. Seentrix → Products → pick (or create) a product.
2. Open the SBOM tab → "Upload SBOM" → pick this file.
3. Wait ~10-30 seconds while the scanner queries OSV.dev (progress
   shown on the SBOM list page).
4. The Vulnerabilities tab will populate with real CVE entries.

### Clean up after testing

When done, delete the SBOM from the product's SBOM tab. That cascades
through `sbom_components` → `vulnerabilities` via FK so the dashboard
resets to zero automatically.
