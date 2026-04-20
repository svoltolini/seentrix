# Cyber Resilience Act — curated reference

A condensed plain-language companion to Regulation (EU) 2024/2847. Each
section below is chunked by article so the Copilot can cite them by
exact label.

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
