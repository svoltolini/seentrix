# Cyber Resilience Act — curated reference

A condensed plain-language companion to Regulation (EU) 2024/2847. Each
section below is chunked by article so Seentrix AI can cite them by
exact label.

> **Verify against the official text.** The article + paragraph numbers
> in this summary follow the regulation as adopted in 2024, but
> numbering in earlier Commission proposals and member-state
> transpositions may differ. When a user needs the exact legal
> reference (e.g. for a regulatory filing), point them to the
> authoritative text on EUR-Lex rather than relying on the numbers
> below alone.

The authoritative text is on EUR-Lex:
https://eur-lex.europa.eu/eli/reg/2024/2847/oj

---

## Article 3 — Definitions

**Product with digital elements**: any software or hardware product and
its remote data-processing solutions, including software or hardware
components placed on the market separately. Nearly every connected
device or piece of software shipped into the EU qualifies.

**Placing on the market**: the first making available of a product with
digital elements on the Union market. The obligations trigger at this
moment.

**Manufacturer**: any natural or legal person who develops or
manufactures products with digital elements, or who has products
designed, developed, or manufactured, and markets them under its name
or trademark.

**Importer / Distributor**: parties further down the supply chain that
bring a third-country product into the EU or make it available on the
EU market. Each has duties under Articles 19 and 20.

**Support period**: the period during which a manufacturer must ensure
vulnerabilities are handled effectively. Must be at least five years
unless the expected product use is shorter (Article 13(8)).

---

## Article 6 — Scope and classification

Products with digital elements fall into three risk classes:

1. **Default class** — most products. Self-assessment is allowed.
2. **Important — Class I** (Annex III) — products with a higher risk
   profile such as identity management systems, password managers,
   routers, firewalls. Requires either harmonised standards or
   third-party conformity assessment.
3. **Important — Class II** (Annex III) — higher-risk products such as
   operating systems, HSMs, public-key infrastructure products. Always
   requires third-party conformity assessment by a Notified Body.

**Critical products** (Annex IV) are subject to additional requirements
including European cybersecurity certification.

---

## Article 13 — Obligations of manufacturers

The core manufacturer obligations. Paragraph by paragraph:

**13(1)** — When placing a product on the market, manufacturers must
ensure it is designed, developed, and produced in accordance with the
essential cybersecurity requirements in Annex I, Part I.

**13(2)** — Manufacturers must handle vulnerabilities effectively and
in accordance with the requirements in Annex I, Part II, throughout
the support period. A process to handle and remediate
vulnerabilities must exist before the product is placed on the market.

**13(3)** — Manufacturers must perform a cybersecurity risk
assessment and document it. This informs the choice of security
measures. The assessment must be updated during the support period if
the risk profile changes.

**13(4)** — Manufacturers must exercise due diligence when integrating
components from third parties, including open-source components.
Vulnerabilities in those components are the manufacturer's
responsibility to address.

**13(8)** — Manufacturers must determine the support period based on
the expected product use; it cannot be shorter than five years unless
reasonably expected otherwise. Security updates must be provided free
of charge and without undue delay throughout the support period.

**13(19)** — Before placing a product on the market, manufacturers
must draw up technical documentation (Annex VII) and a Declaration of
Conformity (Annex IV) and affix the CE marking.

**13(20)** — The Declaration of Conformity and technical documentation
must be kept for ten years after the last unit of the product was
placed on the market and made available to the market surveillance
authority on request.

---

## Article 14 — Reporting obligations

Manufacturers must report actively exploited vulnerabilities and severe
incidents. Three deadlines:

**14(1)(a) — 24-hour early warning**. Within 24 hours of becoming aware
of an actively exploited vulnerability or a severe incident, the
manufacturer submits an early warning notification to the CSIRT
designated as coordinator and to ENISA.

**14(1)(b) — 72-hour incident report**. Within 72 hours, the
manufacturer submits a vulnerability notification or incident
notification including an initial assessment and mitigating measures.

**14(1)(c) — 14-day final report**. Within 14 days (for
vulnerabilities) or one month (for incidents), the manufacturer
submits the final report including root cause, remediation, and impact
assessment.

**14(3) — User notification**. When an actively exploited vulnerability
or severe incident affects users, the manufacturer must inform them
without undue delay and provide mitigations.

**14(8) — Coordinated vulnerability disclosure**. Manufacturers must
have a coordinated vulnerability disclosure policy publicly available
and maintain a single point of contact for vulnerability reports.

**The Single Reporting Platform (SRP)**. Article 14 notifications are
filed through a single reporting platform established by ENISA: one
electronic entry point that routes the early warning, the intermediate
report and the final report to the CSIRT designated as coordinator and
onward to the relevant authorities. The clock starts the moment the
manufacturer becomes aware. Practically, each stage is a structured
submission (organisation + contact, the report type and severity, the
affected products, when you became aware, and the stage narrative), and
the platform returns a reference number you should retain with the case.

In Seentrix this lives on each incident's detail page. The three phase
countdowns are trigger-aware — the final-report window is 14 days for an
actively-exploited vulnerability and one month for a severe incident.
Each submitted stage can be exported as a structured submission package
(PDF + copyable fields) to file into the SRP, and you record the SRP
reference number back against the stage so the submission log is complete.
Use the `getOpenReportingDeadlines` tool to tell the user which reporting
clocks are open and when each is due.

---

## Article 18 — CE marking

Before affixing the CE marking, the manufacturer must ensure the
product complies with Annex I, Part I, and has a Declaration of
Conformity (Annex IV) in place. The CE marking signals free movement
of the product across the EU market and is the manufacturer's own
declaration that all obligations have been met.

---

## Article 28 — Notified bodies

For products requiring third-party conformity assessment (Class I
without harmonised standards, all of Class II, and critical products),
a Notified Body designated under the CRA is engaged. The manufacturer
provides technical documentation (Annex VII); the Notified Body issues
a certificate once satisfied.

---

## Article 52 — Penalties

Non-compliance is enforceable by national market-surveillance
authorities with administrative fines:

- Up to **€15 million or 2.5% of total worldwide annual turnover** —
  whichever is higher — for non-compliance with the essential
  cybersecurity requirements (Article 13(1), 13(2)) or Annex I.
- Up to **€10 million or 2% of turnover** for other violations.
- Up to **€5 million or 1% of turnover** for supplying incorrect,
  incomplete, or misleading information.

---

## Annex I — Essential cybersecurity requirements

### Part I — Product requirements

Products must be designed, developed, and produced so that they:

1. Are delivered with a secure-by-default configuration, including the
   option to reset the product to its original state.
2. Protect against unauthorised access through appropriate
   authentication, identity, access management, and logging.
3. Protect the confidentiality, integrity, and availability of data
   they store, transmit, or process.
4. Process only personal data that is adequate, relevant, and limited
   to what is necessary.
5. Protect the integrity of stored, transmitted, or processed data,
   personal or other.
6. Ship with only what is necessary for the intended use — reducing
   attack surface.
7. Protect from denial-of-service attacks through resilient design.
8. Minimise the impact of security incidents through isolation and
   segmentation.
9. Provide security-related information by recording and/or monitoring
   internal activity.
10. Allow security updates to be installed, including via automatic
    mechanisms where possible.
11. Support security updates throughout the support period.

### Part II — Vulnerability handling

Manufacturers must:

1. Identify and document vulnerabilities and components, including by
   drawing up a software bill of materials (SBOM) in a commonly-used,
   machine-readable format, covering at least top-level dependencies.
2. Address and remediate vulnerabilities without delay, including by
   providing security updates.
3. Apply effective and regular tests and reviews of product security.
4. Publicly disclose information about fixed vulnerabilities once a
   security update has been made available, including a description,
   impact, and remediation actions.
5. Put in place and enforce a policy on coordinated vulnerability
   disclosure.
6. Facilitate the sharing of information about potential
   vulnerabilities in the product.
7. Provide secure update distribution mechanisms to ensure
   vulnerabilities are fixed or mitigated in a timely manner and,
   where applicable, automatically.
8. Ensure that, where security patches are available, they are
   disseminated without delay and free of charge, accompanied by
   advisory messages with information on actions to be taken.

---

## Annex II — Information and instructions to the user

Each product must be accompanied by clear user-facing information:

1. Manufacturer's name, registered trade name or trade mark, and
   contact address (postal and electronic).
2. The single point of contact for reporting vulnerabilities.
3. Product identification (type, batch, serial number, or similar).
4. Intended use, including the cybersecurity context in which the
   product is to be used.
5. Any known or foreseeable circumstance that may lead to significant
   cybersecurity risks.
6. The point at which technical support ends, expressed as a date.
7. Detailed instructions or an internet address referring to such
   instructions on how secure configuration and installation are
   performed.
8. How security updates are provided and installed.
9. The location of the EU Declaration of Conformity.

---

## Annex IV — EU Declaration of Conformity

The single-page document that attests CE-mark compliance. Must
contain at minimum:

1. Unique identification of the product.
2. Manufacturer's name and address.
3. Statement that the Declaration is issued under the sole
   responsibility of the manufacturer.
4. Object of the Declaration (product identification allowing
   traceability).
5. Statement that the object is in conformity with Regulation (EU)
   2024/2847 and any other Union harmonisation legislation.
6. References to the relevant harmonised standards used or references
   to the other technical specifications in relation to which
   conformity is declared.
7. Where applicable, the Notified Body name, identification number,
   and certificate number.
8. Additional information required by specific pieces of EU law.
9. Place and date of issue, signature, name, and function of the
   signatory.

---

## Simplified DoC (Annex VI), CE marking (Article 30) and product identity (Article 13(15)-(16))

The **simplified EU declaration of conformity** (Annex VI) is a short-form
declaration — the product, the manufacturer, and a statement that the full EU
declaration of conformity is available at a stated internet address. It is what
you can print on the product or packaging; the address points to a public page
that hosts the declaration.

**CE marking (Article 30 / Regulation (EC) No 765/2008).** The CE marking is
affixed visibly, legibly and indelibly to the product before it is placed on
the market; where the nature of the product does not allow that, it goes on the
packaging and in the accompanying documents. It expresses conformity with the
CRA and any other applicable Union legislation. Manufacturers should record
where the marking is applied (product / packaging / documentation / website).

**Product identification (Article 13(15)-(16)).** The manufacturer must indicate
on the product — or, where not possible, on its packaging or in an accompanying
document — a type, batch or serial number or other element allowing the product
to be identified, together with the manufacturer's name, registered trade
name/mark, postal address and a single point of contact.

In Seentrix these live on each product's **Identity & CE** tab: the type / batch
/ serial fields, the CE affixing record, and a toggle that publishes the
simplified DoC at a public URL (`/doc/<org-slug>/<product-id>`) once the org has
enabled public pages. The buyer-facing end-user information (Annex II, including
the support-period end-date under Art 13(19)) is generated from the same screen.

---

## Annex VII — Technical documentation

The technical dossier the manufacturer must keep for ten years. At
minimum:

1. General description of the product with digital elements, including
   photographs or drawings showing external features.
2. Design, development, production, and vulnerability handling
   processes.
3. Assessment of the cybersecurity risks the product is designed to
   address (linked to Article 13(3)).
4. Relevant harmonised standards applied in full or in part.
5. Where harmonised standards have not been applied, descriptions of
   the solutions adopted to meet the essential requirements.
6. Reports of the tests carried out to verify conformity with the
   essential requirements and Annex I, Part II, vulnerability
   handling.
7. A copy of the EU Declaration of Conformity.
8. Where applicable, SBOM and vulnerability disclosure policy.

## Architecture and data-flow diagrams (Annex VII 2(a))

Annex VII point 2(a) requires the technical documentation to describe the
design and development of the product, and this is understood to include
the system architecture and how data flows through the product. In
practice manufacturers provide:

- an **architecture diagram** showing the product's components, the
  interfaces between them, and any external systems it talks to;
- a **data-flow diagram** showing how data (especially personal or
  security-relevant data) moves between processes, data stores, and
  external entities, with the trust boundaries marked;
- an **environment / deployment diagram** showing where the product runs
  and what it depends on; and
- for hardware, **photographs or illustrations** of the device (Annex VII
  point 1.3).

These drawings are not optional decoration: a market-surveillance
authority uses them to understand what they are assessing, and they are
the canvas on which threat modelling is performed.

## Threat modelling as a secure-by-design practice

Threat modelling is the expected secure-by-design practice behind a
credible Article 13 risk assessment, even though the CRA does not name it
verbatim. Working over a data-flow diagram, the team identifies the assets
each component protects, the trust boundaries data crosses, the entry
points an attacker could reach, and — for each plausible threat — the
mitigation in place. STRIDE (spoofing, tampering, repudiation, information
disclosure, denial of service, elevation of privilege) is a common
checklist. The mitigations identified feed directly into the Annex I
Part I requirement-by-requirement mapping in the risk assessment.

## Test reports and security-testing evidence (Annex VII point 6)

Annex VII point 6 requires reports of the tests carried out to verify
conformity with the essential requirements (including the Annex I Part II
vulnerability-handling obligations). Acceptable evidence includes
penetration-test reports, fuzzing results, static and dynamic code
analysis output, and third-party security assessments. This evidence,
retained for at least 10 years (or the support period if longer) alongside
the rest of the technical file, is what turns a claim of "we tested this"
into proof an auditor can follow.

## The cybersecurity risk assessment (Article 13(3) and Annex VII point 3)

Article 13(2)-(3) requires the manufacturer to carry out a cybersecurity
risk assessment and to take it into account during planning, design,
development, production, delivery and maintenance. The assessment must
document the intended purpose and reasonably foreseeable use of the
product, the conditions of use (the operational environment), the assets
the product protects, and the expected product lifetime. It is part of the
technical documentation (Annex VII point 3) and must be kept up to date
and dated across the support period.

Crucially, the assessment is the bridge to Annex I: the manufacturer must
determine which of the Annex I Part I essential requirements (and the Part
II vulnerability-handling requirements) apply to the product, and document
how each applicable requirement is met. Where a requirement is judged not
to apply, Article 13(3) requires a written justification — a bare "not
applicable" is not enough; the reasoning must be recorded so a
market-surveillance authority can follow it.

A credible assessment scores each applicable requirement for risk: how
likely is the threat, how severe is the impact, what mitigating control is
in place, and what risk remains after that control (the residual risk). A
simple qualitative Low/Medium/High likelihood-by-impact matrix is enough
for most products with digital elements; the point is that the reasoning is
explicit, consistent and revisited when the threat landscape or the product
changes. The assessment must be re-evaluated and re-dated over the support
period — it is a living document, not a one-off.

In Seentrix this lives on each product's **Risk Assessment** tab. It maps
all 21 Annex I requirements, enforces a justification on every
not-applicable item before a version can be released, derives the inherent
risk band from the likelihood and impact, and snapshots dated, versioned
PDFs that feed Annex VII point 3 of the technical file.

## The Annex VII technical documentation (Annex VII and Article 13(13))

Annex VII sets out the technical documentation a manufacturer must draw up
before placing a product with digital elements on the market, and keep up
to date. It has eight numbered points: (1) a general description of the
product — its intended purpose, versions, and, for hardware, photographs or
illustrations; (2) a description of the design, development and production,
broken into (2a) the system architecture and how software/hardware
components build on or feed each other, including data-flow diagrams, (2b)
the cybersecurity vulnerability-handling processes — the SBOM, the
coordinated-vulnerability-disclosure policy, the security contact, and the
secure-update mechanism — and (2c) the production and monitoring processes;
(3) the cybersecurity risk assessment (Article 13); (4) the support period
and how the manufacturer determined it; (5) a list of the harmonised
standards or technical specifications applied; (6) reports of the tests
carried out to verify conformity; and (7) a copy of the EU Declaration of
Conformity.

The documentation must be drawn up before the product is placed on the
market and kept current throughout its life. Article 13(13) requires the
manufacturer to keep the technical documentation and the EU Declaration of
Conformity at the disposal of market-surveillance authorities for at least
ten years after the product is placed on the market, or for the support
period, whichever is longer.

In Seentrix this lives on each product's **Technical File** tab. It does not
re-enter data: it compiles what the other tabs already hold (the general
description and software versions, the architecture/data-flow diagrams and
evidence, the SBOM and disclosure policy, the released risk assessment, the
support period, the applied standards, the test reports, and the
Declaration of Conformity) into one branded, versioned Annex VII PDF. A live
coverage panel grades each of the nine sections Present, Partial or Missing
and links to the tab where each gap is fixed; releasing a version stamps the
Article 13(13) retention deadline, and released files are retained
(soft-archived), never hard-deleted.

## Lifecycle & supply-chain records (Art 32 / Annex VIII, Art 23, Art 13(7), Annex I II.3/II.4, Art 13(19)/(21))

The CRA's obligations continue across the whole product life, not just at
launch. Several distinct records matter:

**Conformity-assessment modules (Article 32 + Annex VIII).** Depending on the
product's CRA category the manufacturer follows module A (internal control),
module B+C (EU-type examination plus conformity to type), module H (full
quality assurance) or a European cybersecurity certification scheme. Where a
notified body is involved, keep its name and number, its certificate, and the
notes from any surveillance audit.

**Supply-chain register (Article 23).** Importers and distributors must
exercise due diligence and keep records that let a product be traced both
upstream (to suppliers) and downstream (to the operators they supplied), with
names and addresses, retained for ten years.

**Post-market monitoring (Article 13(7)).** The manufacturer monitors the
product and the third-party components it integrates for vulnerabilities
throughout the support period, and keeps a documented record of the
cybersecurity aspects identified over time.

**Public vulnerability advisories (Annex I Part II(4)).** Once a vulnerability
is fixed, the manufacturer publicly discloses information about it — the
affected and fixed versions and, where it helps users, mitigation guidance.

**Recurring security testing (Annex I Part II(3)).** The manufacturer applies
effective and regular tests and reviews of the product's security (penetration
tests, fuzzing, code analysis) and keeps a schedule and log.

**End-of-support and corrective action (Article 13(19), (21)).** Users are
told when the support period ends; and the manufacturer keeps a corrective-
action / recall procedure to withdraw or remediate a product that presents a
significant cybersecurity risk.

In Seentrix all of these live on each product's **Lifecycle & Supply Chain**
tab: the conformity-module surveillance notes, the supply-chain register (with
the 10-year retention reminder), the post-market monitoring log, per-fix
advisories (with a public toggle), the recurring security-test schedule, and
the end-of-support notice + corrective-action procedure — exportable as one
register PDF. Use the `getLifecycleStatus` tool to summarise what's recorded.
