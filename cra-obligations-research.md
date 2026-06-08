# CRA Manufacturer Obligations: Complete Research Report
## Regulation (EU) 2024/2847 — Cyber Resilience Act

**Prepared for:** Seentrix SaaS platform development  
**Primary source:** [Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847), Official Journal of the EU, 20 November 2024  
**Secondary sources:** [EU Commission CRA page](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act), [EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary), [ENISA CRA Standards Mapping](https://www.enisa.europa.eu/publications/cyber-resilience-act-requirements-standards-mapping)

---

## Key Dates / Timeline

| Date | Event |
|---|---|
| 20 November 2024 | Published in Official Journal of the EU |
| 10 December 2024 | Entered into force |
| 11 June 2026 | Member States must designate notifying authorities for conformity assessment bodies |
| **11 September 2026** | **Article 14 reporting obligations apply** (actively exploited vulnerabilities + severe incidents) |
| 11 December 2026 | Member States must ensure sufficient notified bodies exist |
| **11 December 2027** | **Full application of all CRA requirements** (conformity assessment, CE marking, technical documentation, all Annex I requirements) |
| 11 June 2028 | Existing EU type-examination certificates and cybersecurity approval decisions remain valid until this date |

> **Products placed on the market before 11 December 2027** are only subject to the CRA if they undergo a **substantial modification** after that date. However, **Article 14 reporting obligations apply from 11 September 2026 to ALL products already on the market**, not just new ones. ([EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary))

---

## Area 1: Essential Cybersecurity Requirements — Annex I, Part I

**Legal basis:** [Annex I, Part I, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Article 13(1)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

> *"When placing a product with digital elements on the market, manufacturers shall ensure that it has been designed, developed and produced in accordance with the essential cybersecurity requirements set out in Part I of Annex I."* — Article 13(1)

### Part I — Requirement (1): Risk-proportionate security

> *"Products with digital elements shall be designed, developed and produced in such a way that they ensure an appropriate level of cybersecurity based on the risks."* — Annex I, Part I, (1)

This is the overarching principle. All other Part I requirements flow from the cybersecurity risk assessment (Article 13(2)–(3)).

### Part I — Requirement (2): Specific security properties

> *"On the basis of the cybersecurity risk assessment referred to in Article 13(2) and where applicable, products with digital elements shall:"* — Annex I, Part I, (2)

Each sub-requirement applies **where applicable** based on the risk assessment outcome:

| Sub-item | Requirement | Key Compliance Indicator |
|---|---|---|
| **(a)** | Be made available on the market **without known exploitable vulnerabilities** | Vulnerability scan/test report clear at release |
| **(b)** | Be made available with a **secure by default configuration**, unless otherwise agreed with business users for tailor-made products, including the possibility to reset to original state | Secure defaults documented; reset function implemented |
| **(c)** | Ensure vulnerabilities can be addressed through **security updates**, including where applicable automatic security updates installed within an appropriate timeframe enabled as default, with a clear easy-to-use opt-out mechanism, notification of available updates to users, and option to temporarily postpone | Update mechanism documented and tested; opt-out implemented |
| **(d)** | Ensure **protection from unauthorised access** by appropriate control mechanisms including but not limited to authentication, identity or access management systems, and report on possible unauthorised access | Auth/access controls implemented; access logging |
| **(e)** | **Protect confidentiality** of stored, transmitted or otherwise processed data (personal or other), such as by encrypting relevant data at rest or in transit by state-of-the-art mechanisms, and by using other technical means | Encryption implementation documentation |
| **(f)** | **Protect integrity** of stored, transmitted or otherwise processed data, commands, programs and configuration against any manipulation or modification not authorised by the user, and report on corruptions | Integrity protection and tamper detection |
| **(g)** | Process only data adequate, relevant and limited to what is necessary in relation to the intended purpose (**data minimisation**) | Data flow map showing minimisation |
| **(h)** | **Protect availability** of essential and basic functions, also after an incident, including through resilience and mitigation measures against denial-of-service attacks | DoS resilience testing |
| **(i)** | **Minimise negative impact** by the products themselves or connected devices on the availability of services provided by other devices or networks | Impact analysis of external connectivity |
| **(j)** | Be designed, developed and produced to **limit attack surfaces**, including external interfaces | Attack surface analysis; interface minimisation |
| **(k)** | Be designed, developed and produced to **reduce the impact of an incident** using appropriate exploitation mitigation mechanisms and techniques | Exploit mitigation techniques documented |
| **(l)** | **Provide security-related information** by recording and monitoring relevant internal activity, including access to or modification of data, services or functions, **with an opt-out mechanism for the user** | Security logging implemented; user opt-out mechanism |
| **(m)** | Provide the possibility for users to **securely and easily remove on a permanent basis all data and settings** and, where data can be transferred to other products, ensure this is done securely | Secure deletion/factory reset function |

**Note on (a):** This does not require products to be free from *all* vulnerabilities — only known *exploitable* ones at time of release. The assessment is case-by-case. ([EC Commission Guidance, March 2026](https://www.cyberresilienceact.eu/commission-guidance-on-regulation-eu-2024-2847/))

### Timing

| Phase | Obligation |
|---|---|
| **Before placing on market** | All Part I requirements must be met and demonstrated via conformity assessment |
| **Throughout support period** | Updated risk assessment; continued compliance where product design changes |

### Required Artifacts Checklist — Annex I Part I

- [ ] Cybersecurity risk assessment documenting which sub-requirements (a)–(m) apply and how they are implemented
- [ ] Evidence that no known exploitable vulnerabilities exist at release (vulnerability scan/pen test report)
- [ ] Secure default configuration documentation
- [ ] Update mechanism design and test documentation
- [ ] Authentication/access control architecture documentation
- [ ] Encryption specification (data at rest and in transit)
- [ ] Integrity protection design documentation
- [ ] Data minimisation / data flow map
- [ ] DoS resilience design and test evidence
- [ ] Attack surface analysis and mitigation documentation
- [ ] Security logging specification with user opt-out mechanism
- [ ] Secure data deletion / factory reset feature documentation

---

## Area 2: Vulnerability Handling Requirements — Annex I, Part II

**Legal basis:** [Annex I, Part II, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Article 13(8)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

> *"Manufacturers of products with digital elements shall:"* — Annex I, Part II (preamble)

These are **ongoing obligations** applying *when placing on market* and throughout the *support period*.

| Item | Requirement | Concrete Obligation |
|---|---|---|
| **(1)** | **Identify and document vulnerabilities and components** contained in products with digital elements, including by drawing up a **software bill of materials (SBOM)** in a commonly used and machine-readable format covering at the very least the top-level dependencies of the products | Maintain current machine-readable SBOM; update when components change |
| **(2)** | In relation to the risks posed, **address and remediate vulnerabilities without delay**, including by providing security updates; where technically feasible, new security updates shall be provided separately from functionality updates | Patch management process; separate security/feature update channels where feasible |
| **(3)** | **Apply effective and regular tests and reviews** of the security of the product with digital elements | Scheduled security testing programme; test records kept |
| **(4)** | Once a security update is available, **share and publicly disclose information about fixed vulnerabilities**, including: description of the vulnerability; information allowing users to identify the affected product; impacts; severity; and clear accessible information helping users remediate; (delay in justified cases where security risks of publication outweigh benefits until users have had opportunity to apply patch) | Public vulnerability advisory / security bulletin process |
| **(5)** | **Put in place and enforce a policy on coordinated vulnerability disclosure (CVD)** | Published CVD policy (ISO/IEC 29147-aligned) |
| **(6)** | Take measures to **facilitate sharing of information about potential vulnerabilities** in their product and third-party components, including by providing a **contact address** for reporting vulnerabilities discovered in the product | Publicly accessible vulnerability reporting contact/page |
| **(7)** | Provide for **mechanisms to securely distribute updates** for products to ensure vulnerabilities are fixed or mitigated in a timely manner and, where applicable for security updates, in an **automatic** manner | Secure update delivery infrastructure; code signing; update integrity checks |
| **(8)** | Ensure security updates, where available to address identified security issues, are **disseminated without delay** and, unless otherwise agreed with a business user for a tailor-made product, **free of charge**, accompanied by advisory messages providing users with relevant information including on potential action to be taken | Free security update delivery mechanism; advisory messaging |

### Timing

| Phase | Obligation |
|---|---|
| **Before placing on market** | SBOM created; CVD policy established; contact address published; update mechanism operational; initial security test performed |
| **Throughout support period** | Ongoing: vulnerability monitoring, remediation, disclosure, free security updates |
| **Post-support period** | Security updates must remain available for minimum 10 years after issuance or remainder of support period, whichever is longer (Article 13(9)) |

### Required Artifacts Checklist — Annex I Part II

- [ ] SBOM in machine-readable format (e.g., SPDX or CycloneDX), covering at minimum top-level dependencies
- [ ] Vulnerability management procedure / process document
- [ ] Published CVD policy (coordinated vulnerability disclosure)
- [ ] Public vulnerability reporting contact address
- [ ] Security testing schedule and test result records
- [ ] Vulnerability advisory / disclosure record for each fixed vulnerability
- [ ] Secure update distribution mechanism documentation (code signing, integrity checks)
- [ ] Record confirming security updates are provided free of charge

---

## Area 3: Cybersecurity Risk Assessment — Article 13(2)–(4)

**Legal basis:** [Article 13(2)–(4), (7), Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

### What the CRA Requires

> *"Manufacturers shall undertake an assessment of the cybersecurity risks associated with a product with digital elements and take the outcome of that assessment into account during the planning, design, development, production, delivery and maintenance phases of the product with digital elements with a view to minimising cybersecurity risks, preventing incidents and minimising their impact, including in relation to the health and safety of users."* — Article 13(2)

> *"The cybersecurity risk assessment shall be documented and updated as appropriate during a support period... That cybersecurity risk assessment shall comprise at least an analysis of cybersecurity risks based on the intended purpose and reasonably foreseeable use, as well as the conditions of use, of the product with digital elements, such as the **operational environment** or the **assets to be protected**, taking into account the length of time the product is expected to be in use. The cybersecurity risk assessment shall indicate whether and, if so in what manner, the security requirements set out in Part I, point (2), of Annex I are applicable to the relevant product with digital elements and how those requirements are implemented as informed by the cybersecurity risk assessment. It shall also indicate how the manufacturer is to apply Part I, point (1), of Annex I and the vulnerability handling requirements set out in Part II of Annex I."* — Article 13(3)

> *"When placing a product with digital elements on the market, the manufacturer shall include the cybersecurity risk assessment referred to in paragraph 3 of this Article in the technical documentation required pursuant to Article 31 and Annex VII. For products... also subject to other Union legal acts, the cybersecurity risk assessment may be part of the risk assessment required by those Union legal acts. Where certain essential cybersecurity requirements are not applicable to the product with digital elements, the manufacturer shall include a clear justification to that effect in that technical documentation."* — Article 13(4)

### Mandatory Contents of the Risk Assessment

The risk assessment must at minimum address:

1. **Intended purpose and reasonably foreseeable use** — the context in which the product will be used
2. **Operational environment** — what systems, networks, and users the product interacts with
3. **Assets to be protected** — data, functions, services at risk
4. **Length of time the product is expected to be in use** — informs support period determination
5. **Mapping to Annex I Part I, item (2)**: For each sub-requirement (a)–(m), whether it applies and how it is implemented — or a clear justification if not applicable
6. **Mapping to Annex I Part I, item (1)**: How the overall appropriate level of cybersecurity is ensured
7. **Mapping to Annex I Part II**: How each vulnerability handling requirement is applied

### Ongoing Updates (Article 13(3) and (7))

> *"Manufacturers shall systematically document, in a manner that is proportionate to the nature and the cybersecurity risks, relevant cybersecurity aspects concerning the products with digital elements, including vulnerabilities of which they become aware and any relevant information provided by third parties, and shall, where applicable, update the cybersecurity risk assessment of the products."* — Article 13(7)

The risk assessment must be updated:
- When new vulnerabilities are discovered
- After security tests and reviews (Part II, item (3)) yield new information
- When the operational environment changes
- When new information from third parties affects the risk profile
- Where the user instructions address certain risks, those instructions must be updated accordingly ([Hogan Lovells CRA FAQ](https://www.hoganlovells.com/-/media/project/english-site/our-thinking/publication-pdfs/faqs_on_the_cra__v12_6qbciptphhzxljscvbcere4yibo_122331.pdf))

### Due Diligence for Third-Party Components (Article 13(5)–(6))

> *"Manufacturers shall exercise due diligence when integrating components sourced from third parties so that those components do not compromise the cybersecurity of the product with digital elements, including when integrating components of free and open-source software..."* — Article 13(5)

> *"Manufacturers shall, upon identifying a vulnerability in a component, including in an open source-component, which is integrated in the product with digital elements report the vulnerability to the person or entity manufacturing or maintaining the component, and address and remediate the vulnerability..."* — Article 13(6)

### Timing

| Phase | Obligation |
|---|---|
| **Before placing on market** | Complete initial risk assessment; include in technical documentation |
| **Throughout support period** | Update as new vulnerabilities, threat intelligence, or use-case changes occur |

### Required Artifacts Checklist — Article 13 Risk Assessment

- [ ] Documented cybersecurity risk assessment (initial, pre-market)
- [ ] Risk assessment mapping each Annex I Part I (2)(a)–(m) requirement to applicability and implementation
- [ ] Clear justification for any Annex I requirement deemed not applicable
- [ ] Record of risk assessment updates (dated version history)
- [ ] Third-party component due diligence record
- [ ] Record of vulnerability reports sent to upstream component maintainers (where applicable)

---

## Area 4: Technical Documentation — Annex VII

**Legal basis:** [Annex VII, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Article 31](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

> *"The technical documentation shall contain all relevant data or details of the means used by the manufacturer to ensure that the product with digital elements and the processes put in place by the manufacturer comply with the essential cybersecurity requirements set out in Annex I. It shall at least contain the elements set out in Annex VII."* — Article 31(1)

> *"The technical documentation shall be drawn up before the product with digital elements is placed on the market and shall be continuously updated, where appropriate, at least during the support period."* — Article 31(2)

### Annex VII — All 8 Mandatory Elements

| Point | Content Required |
|---|---|
| **1** | **General description** of the product with digital elements, including: intended purpose; product version(s); hardware/software identification information |
| **2** | **Description of the design, development and production** of the product and vulnerability handling processes, including: **(a)** necessary information on the design and development of the product, **including, where applicable, drawings and schemes and a description of the system architecture** explaining how software components build on or feed into each other and integrate into the overall processing; **(b)** necessary information and specifications of the vulnerability handling processes, including the **SBOM**, the **coordinated vulnerability disclosure policy**, evidence of the provision of a **contact address** for vulnerability reporting, and a description of the **technical solutions chosen for the secure distribution of updates**; **(c)** necessary information and specifications of the **production and monitoring processes** of the product with digital elements and the validation of those processes |
| **3** | **Cybersecurity risk assessment** against which the product is designed, developed, produced, delivered and maintained pursuant to Article 13, including how the essential cybersecurity requirements set out in Part I of Annex I are applicable |
| **4** | **Relevant information that was taken into account to determine the support period** pursuant to Article 13(8) |
| **5** | List of **harmonised standards** applied (in full or in part) whose references have been published in the Official Journal, or **common specifications** (Article 27), or **European cybersecurity certification schemes** applied; where not applied, **descriptions of the solutions adopted** to meet each Annex I requirement, including a list of other technical specifications applied; and where standards are only partly applied, specification of which parts were applied |
| **6** | **Reports of tests carried out** to verify conformity of the product and vulnerability handling processes with the applicable essential cybersecurity requirements (Parts I and II of Annex I) |
| **7** | A **copy of the EU declaration of conformity** |
| **8** | Where applicable, the **SBOM**, further to a reasoned request from a market surveillance authority (necessary to check Annex I compliance) |

> **Note on Annex VII point 8:** The SBOM is formally part of the technical documentation (held by manufacturer and available to market surveillance authorities on reasoned request). Manufacturers are free to decide whether to also make the SBOM available to users — if they do, Annex II, item 9 requires a pointer to where users can access it.

### Retention

> *"Manufacturers shall keep the technical documentation and the EU declaration of conformity at the disposal of the market surveillance authorities for at least **10 years** after the product with digital elements has been placed on the market or **for the support period, whichever is longer**."* — Article 13(13)

### Language

> *"The technical documentation and correspondence relating to any conformity assessment procedure shall be drawn up in an official language of the Member State in which the notified body is established or in a language acceptable to that body."* — Article 31(4)

### Timing

| Phase | Obligation |
|---|---|
| **Before placing on market** | Complete technical documentation must exist |
| **Throughout support period** | Continuously updated (especially risk assessment, SBOM, vulnerability handling records) |
| **Minimum 10 years after placement (or support period if longer)** | Kept available to market surveillance authorities |

### Required Artifacts Checklist — Annex VII

- [ ] General product description (Annex VII, point 1)
- [ ] Architecture drawings / system architecture diagrams (Annex VII, point 2(a))
- [ ] Software component descriptions (how components interact) (Annex VII, point 2(a))
- [ ] Vulnerability handling process specifications (Annex VII, point 2(b))
- [ ] SBOM reference in technical documentation (Annex VII, point 2(b))
- [ ] CVD policy reference (Annex VII, point 2(b))
- [ ] Vulnerability contact address evidence (Annex VII, point 2(b))
- [ ] Secure update distribution technical description (Annex VII, point 2(b))
- [ ] Production and monitoring process documentation (Annex VII, point 2(c))
- [ ] Cybersecurity risk assessment (Annex VII, point 3)
- [ ] Support period justification document (Annex VII, point 4)
- [ ] Harmonised standards / common specifications list, or alternative technical measures descriptions (Annex VII, point 5)
- [ ] Conformity test reports (Annex VII, point 6)
- [ ] Copy of EU declaration of conformity (Annex VII, point 7)
- [ ] SBOM (held for market surveillance authority request) (Annex VII, point 8)

---

## Area 5: Information and Instructions to the User — Annex II

**Legal basis:** [Annex II, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Article 13(18)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

> *"Manufacturers shall ensure that products with digital elements are accompanied by the information and instructions to the user set out in Annex II, in paper or electronic form. Such information and instructions shall be provided in a language which can be easily understood by users and market surveillance authorities. They shall be clear, understandable, intelligible and legible. They shall allow for the secure installation, operation and use of products with digital elements."* — Article 13(18)

The manufacturer must keep Annex II information available for **at least 10 years after placing on market or the support period, whichever is longer** (Article 13(18)).

### Complete Annex II Checklist

| Item | Required Information |
|---|---|
| **1** | Name, registered trade name or registered trademark of the manufacturer; postal address; email address or other digital contact; where available, website |
| **2** | **Single point of contact** where information about vulnerabilities can be reported and received, and where the manufacturer's CVD policy can be found |
| **3** | Name and type and any additional information enabling **unique identification** of the product |
| **4** | Intended purpose of the product; the **security environment provided by the manufacturer**; the product's essential functionalities; **information about the security properties** |
| **5** | Any **known or foreseeable circumstance**, related to use in accordance with intended purpose or under reasonably foreseeable misuse, which may lead to **significant cybersecurity risks** |
| **6** | Where applicable, the internet address at which the **EU declaration of conformity** can be accessed |
| **7** | The **type of technical security support** offered by the manufacturer and the **end-date of the support period** (including month and year) during which users can expect vulnerabilities to be handled and security updates |
| **8(a)** | The necessary measures during **initial commissioning and throughout the lifetime** of the product to ensure its secure use |
| **8(b)** | How **changes to the product** can affect the security of data |
| **8(c)** | How **security-relevant updates can be installed** |
| **8(d)** | The **secure decommissioning** of the product, including information on how user data can be securely removed |
| **8(e)** | How the **default setting enabling the automatic installation of security updates** (as required by Annex I Part I, (2)(c)) can be turned off |
| **8(f)** | Where the product is **intended for integration into other products**, the information necessary for the integrator to comply with the Annex I essential cybersecurity requirements and Annex VII documentation requirements |
| **9** | If the manufacturer decides to make the SBOM available to users: **information on where the SBOM can be accessed** |

> **Note on Item 7:** The end-date of the support period (at minimum month and year) must also be clearly and understandably specified **at the time of purchase** in an easily accessible manner and, where applicable, on the product, its packaging, or by digital means (Article 13(19)). Where technically feasible, the manufacturer shall also display a **notification to users** when the product has reached the end of its support period.

### Timing

| Phase | Obligation |
|---|---|
| **At placement on market** | Full Annex II information must accompany the product |
| **Throughout support period / minimum 10 years** | Keep available (online availability must be accessible, user-friendly) |
| **End of support** | Display end-of-support notification to users where technically feasible |

### Required Artifacts Checklist — Annex II

- [ ] User-facing information document / product documentation (covering items 1–9)
- [ ] Published CVD policy URL (referenced in item 2)
- [ ] Single point of contact for vulnerability reporting (item 2)
- [ ] Clear statement of support period end-date (item 7) on product / packaging / at point of purchase
- [ ] Secure installation and use guide (item 8(a))
- [ ] Security update installation instructions (item 8(c))
- [ ] Secure decommissioning / data deletion instructions (item 8(d))
- [ ] Automatic update opt-out instructions (item 8(e))
- [ ] Integrator-facing security instructions (where product is a component) (item 8(f))
- [ ] SBOM access pointer (if SBOM made available to users) (item 9)
- [ ] End-of-support notification mechanism (Article 13(19))

---

## Area 6: EU Declaration of Conformity — Annex V; CE Marking — Article 30 + Annex VIII

**Legal basis:** [Annex V, Annex VI, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Articles 28, 29, 30](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Article 13(12), (13), (20)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

> *"Where compliance of the product with digital elements with the essential cybersecurity requirements set out in Part I of Annex I and of the processes put in place by the manufacturer with the essential cybersecurity requirements set out in Part II of Annex I has been demonstrated by that conformity assessment procedure, manufacturers shall draw up the EU declaration of conformity in accordance with Article 28 and affix the CE marking in accordance with Article 30."* — Article 13(12)

### EU Declaration of Conformity — Annex V Contents

The DoC must contain **all of the following**:

| Field | Content Required |
|---|---|
| **1** | Name and type and any additional information enabling **unique identification** of the product |
| **2** | Name and address of the **manufacturer or its authorised representative** |
| **3** | A statement that the EU declaration of conformity is issued **under the sole responsibility of the provider** |
| **4** | Object of the declaration (identification of the product allowing **traceability**, which may include a photograph where appropriate) |
| **5** | A statement that the object of the declaration is **in conformity with the relevant Union harmonisation legislation** |
| **6** | References to any relevant **harmonised standards** used, or any other **common specification or cybersecurity certification** in relation to which conformity is declared |
| **7** | Where applicable, the **name and number of the notified body**, a description of the conformity assessment procedure performed, and identification of the **certificate issued** |
| **8** | Additional information: signed for and on behalf of; place and date of issue; name, function, signature |

> *"By drawing up the EU declaration of conformity, the manufacturer shall assume responsibility for the compliance of the product with digital elements."* — Article 28(4)

The DoC must be **updated as appropriate** and made available in the languages required by the Member State of placement. (Article 28(2))

### Simplified Declaration of Conformity — Annex VI

The manufacturer may provide a **simplified declaration** in lieu of the full DoC accompanying the product, but it must contain:
- Declaration that the product is in compliance with Regulation (EU) 2024/2847
- The internet address at which the **full text of the DoC can be accessed** (Article 13(20); Annex VI)

### CE Marking — Article 30

> *"The CE marking shall be affixed visibly, legibly and indelibly to the product with digital elements. Where that is not possible or not warranted on account of the nature of the product with digital elements, it shall be affixed to the packaging and to the EU declaration of conformity accompanying the product with digital elements. For products with digital elements which are in the form of software, the CE marking shall be affixed either to the EU declaration of conformity or on the website accompanying the software product."* — Article 30(1)

Key CE marking rules:
- Affixed **before the product is placed on the market** (Article 30(3))
- Minimum height 5 mm on the product (exceptions for small products) (Article 30(2))
- **Followed by the notified body identification number** where a notified body is involved in conformity assessment under module H (Article 30(4))
- For software: can be on DoC or easily accessible section of the manufacturer's website

### Retention

> *"Manufacturers shall keep the technical documentation and the EU declaration of conformity at the disposal of the market surveillance authorities for at least **10 years** after the product with digital elements has been placed on the market or for the **support period, whichever is longer**."* — Article 13(13)

### Timing

| Phase | Obligation |
|---|---|
| **Before placing on market** | Conformity assessment complete; DoC drawn up; CE marking affixed |
| **At placement on market** | Copy of DoC (or simplified DoC with URL to full DoC) provided with product |
| **10 years post-placement or support period** | DoC retained and available to market surveillance authorities |

### Required Artifacts Checklist — Annex V / CE Marking

- [ ] Full EU Declaration of Conformity (per Annex V, 8 fields complete)
- [ ] Simplified EU Declaration of Conformity (per Annex VI) with URL to full DoC (if using simplified version)
- [ ] CE marking affixed to product / packaging / DoC / website (as appropriate to product type)
- [ ] Where notified body involved: CE marking includes notified body ID number
- [ ] DoC retained for minimum 10 years or support period (whichever is longer)
- [ ] DoC made available in languages required by Member States where product is placed on market

---

## Area 7: Conformity Assessment Procedures & Routes — Article 32 + Annex VIII

**Legal basis:** [Article 32, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Annex VIII](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [Annexes III and IV](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

### Product Classification → Conformity Assessment Route

The conformity assessment route required depends on the product's classification:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PRODUCT CLASSIFICATION DETERMINES ROUTE                                  │
├──────────────────────┬──────────────────────────────────────────────────┤
│ DEFAULT (all other)  │ Module A (self-assessment) — mandatory minimum   │
├──────────────────────┼──────────────────────────────────────────────────┤
│ IMPORTANT Class I    │ Module A — IF harmonised standards / common      │
│ (Annex III)          │ specs / EU cybersecurity cert applied           │
│                      │ Module B+C or Module H — if standards NOT applied│
├──────────────────────┼──────────────────────────────────────────────────┤
│ IMPORTANT Class II   │ Module B+C or Module H — mandatory               │
│ (Annex III)          │ OR EU cybersecurity cert scheme (≥ substantial)  │
├──────────────────────┼──────────────────────────────────────────────────┤
│ CRITICAL             │ EU cybersecurity certification scheme (preferred) │
│ (Annex IV)           │ OR Module B+C or Module H (if no cert scheme)    │
└──────────────────────┴──────────────────────────────────────────────────┘
```

([Article 32(1)–(4), Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847))

### Important Products — Class I (Annex III)

Includes (among others):
- Identity management systems, privileged access management, authentication/access control (incl. biometric) hardware
- Standalone and embedded browsers
- Password managers
- Anti-malware software
- VPN products
- Network management systems
- SIEM systems
- Boot managers
- PKI and digital certificate issuance software
- Physical and virtual network interfaces
- Operating systems
- Routers, modems (internet connection), switches
- Microprocessors, microcontrollers with security-related functionalities
- ASICs, FPGAs with security-related functionalities
- Smart home general purpose virtual assistants
- Smart home security products (smart door locks, security cameras, baby monitors, alarm systems)
- Internet-connected toys with social interactive or location tracking features
- Personal health-monitoring wearables (where not covered by medical device regulations)

### Important Products — Class II (Annex III)

- Hypervisors and container runtime systems supporting virtualised execution of OS
- Firewalls, intrusion detection and prevention systems
- Tamper-resistant microprocessors
- Tamper-resistant microcontrollers

### Critical Products (Annex IV)

- Hardware Devices with Security Boxes
- Smart meter gateways within smart metering systems and other devices for advanced security purposes, including secure cryptoprocessors
- Smartcards or similar devices, including secure elements

### Conformity Assessment Modules — Annex VIII

#### Module A — Internal Control (Self-Assessment)
Available for: **Default products**; Important Class I (if harmonised standards applied); FOSS Important Class I/II if tech docs made public

The manufacturer:
1. Draws up technical documentation (Annex VII)
2. Takes all measures necessary to ensure design, development, production, and vulnerability handling comply with Annex I
3. Draws up EU declaration of conformity
4. Affixes CE marking

No third-party involvement required.

#### Module B — EU-Type Examination (Notified Body)
Required for: **Important Class I** (where standards not applied), **Important Class II**, and **Critical products** (if no cert scheme)

A notified body:
- Examines the technical design and development, and vulnerability handling processes
- Examines the technical documentation submitted by the manufacturer
- Examines product specimens (critical parts)
- Issues an **EU-type examination certificate** naming the manufacturer, conclusions, conditions, and approved type
- Conducts **periodic audits** to ensure ongoing compliance of vulnerability handling processes (Annex VIII, Part II, point 8)

The manufacturer keeps a copy of the certificate for **10 years or the support period, whichever is longer** (Annex VIII, Part II, point 10).

#### Module C — Conformity to Type (follows Module B)
The manufacturer:
- Takes all measures necessary so production conforms to the approved type (B certificate)
- Draws up EU declaration of conformity
- Affixes CE marking

#### Module H — Full Quality Assurance (Notified Body)
Available as alternative to B+C for: **Important Class I** (without standards), **Important Class II**, **Critical products**

The manufacturer:
- Operates an **approved quality management system** covering design, development, final inspection, testing, and vulnerability handling
- Submits to notified body **surveillance** (periodic audits, product assessments)
- Draws up EU declaration of conformity
- Affixes CE marking (followed by notified body ID number)
- Keeps quality system documentation for **10 years or support period, whichever is longer** (Annex VIII, Part IV, point 6)

### FOSS Exception (Article 32(5))
Manufacturers of free and open-source software products in important/critical categories may use **Module A** (self-assessment), provided the **technical documentation is made available to the public** at the time of placing on the market.

### SME Fee Reduction (Article 32(6))
> *"The specific interests and needs of microenterprises and small and medium-sized enterprises, including start-ups, shall be taken into account when setting the fees for conformity assessment procedures and those fees shall be reduced proportionately to their specific interests and needs."*

### Timing

| Phase | Obligation |
|---|---|
| **Before placing on market** | Conformity assessment procedure must be complete |
| 11 June 2026 | Member States must ensure sufficient notified bodies are available |
| **Throughout support period** | Module B/H: notified body conducts periodic audits of vulnerability handling |

### Required Artifacts Checklist — Conformity Assessment

- [ ] Product classification determination (default / important class I / important class II / critical)
- [ ] Conformity assessment route selection and documentation
- [ ] Module A (internal): Completed technical documentation + self-assessment record
- [ ] Module B+C (if applicable): Notified body application; EU-type examination certificate; production control records
- [ ] Module H (if applicable): Quality management system documentation; notified body QMS approval; surveillance audit records
- [ ] Copies of notified body certificates held for 10 years or support period
- [ ] Record of harmonised standards / common specifications applied (triggers Module A eligibility for Class I)

---

## Area 8: Reporting Obligations to ENISA / CSIRT — Article 14

**Legal basis:** [Article 14, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

**Applies from: 11 September 2026** ([EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary))

### What Must Be Reported

**Two distinct triggers** (both must be notified):

**Trigger 1 — Actively Exploited Vulnerability** (Article 14(1)–(2)):
> *"A manufacturer shall notify any actively exploited vulnerability contained in the product with digital elements that it becomes aware of..."*

**Trigger 2 — Severe Incident** (Article 14(3)–(5)):
> *"A manufacturer shall notify any severe incident having an impact on the security of the product with digital elements that it becomes aware of..."*

**Definition of "severe incident"** (Article 14(5)):
An incident is severe where:
- (a) it negatively affects or is capable of negatively affecting the ability of a product to protect the availability, authenticity, integrity or confidentiality of sensitive or important data or functions; OR
- (b) it has led or is capable of leading to the introduction or execution of malicious code in a product or in the network and information systems of a user

### Notification Deadlines

#### For Actively Exploited Vulnerabilities (Article 14(2)):

| Stage | Deadline | Content |
|---|---|---|
| **Early warning** | **Within 24 hours** of becoming aware | Indication of the actively exploited vulnerability; where applicable, which Member States' territory the product has been made available in |
| **Vulnerability notification** | **Within 72 hours** of becoming aware | General information about the product concerned; general nature of the exploit and the vulnerability; any corrective or mitigating measures taken; corrective/mitigating measures users can take; sensitivity level of the information |
| **Final report** | **No later than 14 days** after a corrective or mitigating measure is available | At minimum: (i) detailed description of the vulnerability including severity and impact; (ii) where available, information about any malicious actor that exploited or is exploiting the vulnerability; (iii) details of the security update or other corrective measures provided to address the vulnerability |

#### For Severe Incidents (Article 14(4)):

| Stage | Deadline | Content |
|---|---|---|
| **Early warning** | **Within 24 hours** of becoming aware | Including at least whether the incident is suspected of being caused by unlawful or malicious acts; where applicable, which Member States the product has been made available in |
| **Incident notification** | **Within 72 hours** of becoming aware | General information about the nature of the incident; initial assessment; any corrective/mitigating measures taken; measures users can take; sensitivity level of information |
| **Final report** | **Within 1 month** after submission of the 72h incident notification | At minimum: (i) detailed description of the incident; (ii) type of threat or root cause; (iii) all applied and ongoing mitigation measures |

> Intermediate status reports may be requested by the CSIRT coordinator (Article 14(6)).

### Notification Channel — Single Reporting Platform

> *"The notifications referred to in paragraphs 1 and 3 of this Article shall be submitted via the **single reporting platform** referred to in Article 16..."* — Article 14(7)

- The **Single Reporting Platform (SRP)** is established and maintained by **ENISA**
- Notifications are submitted using the electronic notification end-point of the **CSIRT designated as coordinator of the Member State where the manufacturer has its main establishment** in the Union
- The notification is **simultaneously accessible to ENISA**
- Where the manufacturer has no main establishment in the Union, the applicable CSIRT is determined by a priority list: authorised representative's Member State → importer's Member State → distributor's Member State → Member State with most users

### Notification to Users (Article 14(8))

> *"After becoming aware of an actively exploited vulnerability or a severe incident... the manufacturer shall **inform the impacted users**... of that vulnerability or incident and, where necessary, of any risk mitigation and corrective measures that the users can deploy to mitigate the impact..., where appropriate in a structured, machine-readable format that is easily automatically processable."*

### Scope of Reporting Obligations

Reporting obligations apply from **11 September 2026** and cover **ALL products with digital elements made available on the Union market, including those placed on the market before 11 December 2027**. ([EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary))

> **Note for SMEs:** Manufacturers that qualify as microenterprises or small enterprises may not be fined for failures to meet the **24-hour deadline** specifically (Chapter VII, CRA). The obligation still exists; only the fine for the 24h deadline is excluded.

### Required Artifacts Checklist — Article 14 Reporting

- [ ] Incident / vulnerability response process (internal SOP with 24h/72h/14-day/1-month trigger points)
- [ ] Registration and access to ENISA Single Reporting Platform
- [ ] Early warning notification template (vulnerability and incident variants)
- [ ] 72-hour notification template (vulnerability and incident variants)
- [ ] Final report template (vulnerability: 14-day; incident: 1-month)
- [ ] Record of all Article 14 notifications submitted (with timestamps)
- [ ] User notification process / mechanism for impacted users
- [ ] CSIRT coordinator identification (based on manufacturer's main EU establishment)

---

## Area 9: Support Period Determination and Obligations — Article 13(8)–(9)

**Legal basis:** [Article 13(8)–(11), (19), Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

### Support Period Determination

> *"Manufacturers shall ensure, when placing a product with digital elements on the market, and for the support period, that vulnerabilities of that product, including its components, are handled effectively and in accordance with the essential cybersecurity requirements set out in Part II of Annex I."* — Article 13(8)

> *"Manufacturers shall determine the support period so that it reflects the length of time during which the product is expected to be in use, taking into account, in particular, reasonable user expectations, the nature of the product, including its intended purpose, as well as relevant Union law determining the lifetime of products with digital elements."* — Article 13(8)

**Factors to consider when determining support period:**
- Reasonable user expectations
- Nature and intended purpose of the product
- Relevant Union law on product lifetime
- Support periods of similar products by other manufacturers
- Availability of the operating environment
- Support periods of integrated third-party components providing core functions
- Guidance from ADCO (Administrative Cooperation Group established under Article 52(15)) and the Commission

**Minimum support period:**
> *"Without prejudice to the second subparagraph, the **support period shall be at least five years**. Where the product with digital elements is expected to be in use for less than five years, the support period shall correspond to the expected use time."* — Article 13(8)

> **ADCO and Commission delegated acts** may specify minimum support periods for specific product categories where market surveillance data suggests inadequate periods.

### Security Updates Retention After Support Period

> *"Manufacturers shall ensure that each security update... which has been made available to users during the support period, **remains available after it has been issued for a minimum of 10 years** or for the **remainder of the support period, whichever is longer**."* — Article 13(9)

### Free Security Updates

> Security updates must be **free of charge**, unless otherwise agreed between a manufacturer and a business user for a tailor-made product (Annex I Part II, item (8); Article 13(8))

### Communication of Support Period

The manufacturer must:
1. Indicate support period end-date (at minimum month and year) **clearly and understandably at the time of purchase** in an easily accessible manner (Article 13(19))
2. Where technically feasible, display a **notification to users when the product reaches end of support** (Article 13(19))
3. Include support period information in **Annex II, item 7** documentation

### Successive Software Versions (Article 13(10))

Where a manufacturer places subsequent substantially modified versions of a software product, it may comply with vulnerability handling requirements (Annex I Part II, item (2)) only for the **last placed version**, provided:
- Users of previous versions can access the new version **free of charge**; AND
- Users do not incur additional costs to adjust their hardware/software environment

### Historical Software Archives (Article 13(11))

Manufacturers **may** maintain public software archives of historical versions. If so:
- Users must be **clearly informed in an easily accessible manner** about risks associated with using unsupported software

### Cessation of Operations (Article 13(23))

> *"A manufacturer that ceases its operations and, as a result, is not able to comply with this Regulation shall inform, before the cessation of operations takes effect, the relevant market surveillance authorities as well as, by any means available and to the extent possible, the users of the relevant products with digital elements placed on the market, of the impending cessation of operations."*

### Required Artifacts Checklist — Support Period

- [ ] Support period determination document (reasoning, factors considered) per product
- [ ] Support period end-date clearly communicated at point of purchase
- [ ] Support period end-date included in Annex II user documentation
- [ ] End-of-support user notification mechanism
- [ ] Security update retention policy (10-year minimum post-issuance)
- [ ] Process for free security update delivery to users
- [ ] Record of all security updates issued during support period

---

## Area 10: Obligations Across the Lifecycle / Post-Market Monitoring

**Legal basis:** [Article 13(7), (8), (14), (21), (22); Article 14, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

### Post-Market Monitoring Obligations

The CRA creates an ongoing duty of active surveillance:

**Systematic documentation (Article 13(7)):**
> *"The manufacturers shall systematically document, in a manner that is proportionate to the nature and the cybersecurity risks, relevant cybersecurity aspects concerning the products with digital elements, including vulnerabilities of which they become aware and any relevant information provided by third parties, and shall, where applicable, update the cybersecurity risk assessment of the products."*

**Conformity maintenance (Article 13(14)):**
> *"Manufacturers shall ensure that procedures are in place for products with digital elements that are part of a series of production to remain in conformity with this Regulation. Manufacturers shall adequately take into account changes in the development and production process or in the design or characteristics of the product with digital elements and changes in the harmonised standards, European cybersecurity certification schemes or common specifications... by reference to which the conformity of the product with digital elements is declared..."*

**Corrective action if non-conformity identified (Article 13(21)):**
> *"From the placing on the market and for the support period, manufacturers who know or have reason to believe that the product with digital elements or the processes put in place by the manufacturer are not in conformity with the essential cybersecurity requirements set out in Annex I shall immediately take the corrective measures necessary to bring that product with digital elements or the manufacturer's processes into conformity, or to withdraw or recall the product, as appropriate."*

**Cooperation with market surveillance authorities (Article 13(22)):**
> Manufacturers shall, upon a reasoned request from a market surveillance authority, provide all information and documentation necessary to demonstrate conformity. They shall cooperate on any measures to eliminate cybersecurity risks.

**Identification of products in the supply chain (Article 23):**
> Economic operators shall, on request, provide market surveillance authorities with the name and address of any upstream supplier and any downstream operator for 10 years.

### Lifecycle Phases and Obligations Summary

| Phase | Key Obligations |
|---|---|
| **Planning** | Begin risk assessment; define operational environment; identify assets |
| **Design** | Apply Annex I Part I requirements; document architecture; minimise attack surface |
| **Development** | Secure coding; integrate SBOM tracking; vulnerability scanning |
| **Production** | Ensure production process maintains conformity; production monitoring documented |
| **Conformity assessment** | Complete chosen module (A/B+C/H); draw up DoC; affix CE marking |
| **Placement on market** | Full Annex II documentation accompanies product; support period clearly stated |
| **Post-market monitoring** | Monitor for new vulnerabilities; update risk assessment; test and review (Part II, item 3) |
| **Vulnerability identified** | Remediate without delay; issue security update free of charge; disclose publicly when fixed |
| **Actively exploited vulnerability** | Article 14: 24h early warning → 72h notification → 14-day final report |
| **Severe incident** | Article 14: 24h early warning → 72h notification → 1-month final report |
| **End of support period** | Notify users; cease obligation to provide new security updates (but existing updates remain available) |
| **Cessation of operations** | Notify market surveillance authority and users before ceasing operations |

### Required Artifacts Checklist — Post-Market Monitoring

- [ ] Post-market vulnerability monitoring process (internal procedure)
- [ ] Vulnerability register / log (documenting vulnerabilities discovered and their remediation status)
- [ ] Security test schedule and test records (ongoing)
- [ ] Updated risk assessment versions (dated)
- [ ] Corrective action / recall procedure
- [ ] Production change monitoring process (tracking changes that could affect conformity)
- [ ] Supply chain traceability records (Article 23: upstream supplier and downstream operator records for 10 years)

---

## Area 11: Record-Keeping and Retention

**Legal basis:** [Article 13(13), (18); Article 23; Annex VIII Part II point 10; Annex VIII Part IV point 6, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847)

### Retention Periods

| Document / Record | Retention Period | Legal Basis |
|---|---|---|
| Technical documentation (Annex VII) | **10 years** from placement on market **or** support period, **whichever is longer** | Article 13(13) |
| EU Declaration of Conformity (Annex V) | **10 years** from placement on market **or** support period, **whichever is longer** | Article 13(13) |
| Information and instructions to user (Annex II) | **10 years** from placement on market **or** support period, **whichever is longer** (must remain accessible, including online where applicable) | Article 13(18) |
| EU-type examination certificate (Module B) | **10 years** from placement on market **or** support period, **whichever is longer** | Annex VIII, Part II, point 10 |
| Full quality assurance records (Module H) | **10 years** from placement on market **or** support period, **whichever is longer** | Annex VIII, Part IV, point 6 |
| Security updates issued during support period | Each update: minimum **10 years** after issuance **or** remainder of support period, **whichever is longer** | Article 13(9) |
| Supply chain traceability records (Article 23) | **10 years** from receipt/supply of the product | Article 23(2) |

> **Practical implication:** For a product with a 5-year support period, the 10-year post-market retention requirement is the binding period. For a product with a 15-year support period, the support period is the binding period.

### Required Artifacts Checklist — Record-Keeping

- [ ] Document management system / archive for technical documentation
- [ ] DoC archive with version history
- [ ] Security update archive (each update available for 10 years post-issuance)
- [ ] Annex II user documentation archive (10 years or support period)
- [ ] Notified body certificates and audit records archive
- [ ] Supply chain contact records (upstream suppliers and downstream operators, 10 years)
- [ ] Vulnerability log / incident report records

---

## Area 12: Key Dates and Timeline

| Date | Obligation | Source |
|---|---|---|
| **10 December 2024** | CRA entered into force | [EUR-Lex OJ L 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847) |
| **11 June 2026** | Member States designate notifying authorities for conformity assessment bodies | [EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary) |
| **11 September 2026** | **Article 14 reporting obligations apply** — manufacturers must report actively exploited vulnerabilities and severe incidents via ENISA Single Reporting Platform | [EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary) |
| **11 December 2026** | Member States must ensure sufficient notified bodies exist | [TXOne CRA Guide](https://www.txone.com/blog/cra-guide-for-manufacturers/) |
| **11 December 2027** | **Full application of all CRA requirements**: Annex I essential requirements, conformity assessment, CE marking, technical documentation, Annex II information, support period obligations | [EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary) |
| **11 June 2028** | Existing EU type-examination certificates and approval decisions expire (unless already expired) | [EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary) |

### Products Already on Market Before 11 December 2027

- **Article 14 reporting obligations** apply from 11 September 2026 regardless of when the product was placed on market
- **All other CRA requirements** apply only if the product undergoes a **substantial modification** after 11 December 2027
- Products designed before 11 December 2027 that continue to be placed on market after that date must comply with all CRA requirements ([EC Commission Guidance, March 2026](https://www.cyberresilienceact.eu/commission-guidance-on-regulation-eu-2024-2847/))

---

## Area 13: Conformity Labelling Specifics and Importer/Distributor Touchpoints

**Legal basis:** [Article 30; Articles 19–22, Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847); [EC CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary)

### CE Marking Placement Rules (Article 30)

| Product Type | CE Marking Location |
|---|---|
| Hardware (where feasible) | On the product itself — visibly, legibly, indelibly |
| Hardware (where not feasible) | On the packaging AND on the EU Declaration of Conformity |
| Software | On the EU Declaration of Conformity OR on an easily and directly accessible section of the manufacturer's website |
| Any product with notified body involvement (Module H) | CE marking followed by notified body identification number |

**Future implementing acts:** The Commission may adopt implementing acts specifying technical specifications for additional **labels, pictograms or marks** related to security, support periods, and public awareness (Article 30(6)).

### Importer Obligations — Touchpoints for Manufacturer-Facing SaaS

Importers (EU-established persons placing non-EU-manufactured products on the EU market) must:
- Verify the manufacturer has **complied with the essential cybersecurity requirements** and has vulnerability handling processes
- Ensure **appropriate conformity assessment procedures** were carried out
- Verify **technical documentation** was drawn up
- Verify the product **bears the CE marking** and the manufacturer's contact details, Annex II information, and support period indication are provided
- Not place non-compliant products on the market; inform the manufacturer of vulnerabilities
- Cooperate with market surveillance authorities
- Keep a copy of the DoC and technical documentation for **10 years** or support period
- Retain supply chain records (Article 23) for 10 years

### Distributor Obligations — Touchpoints for Manufacturer-Facing SaaS

Distributors must verify before making products available:
- Products **bear the CE marking**
- Manufacturer and importer have complied with: contact details on product, Annex II information enclosed, support period indicated
- Not make non-compliant products available; inform manufacturer of vulnerabilities
- Cooperate with market surveillance authorities

### Product Identification Requirements (Article 13(15)–(17))

Manufacturers must ensure:
1. Products bear **type, batch, serial number or other identification element** (or this information on the packaging or accompanying document)
2. **Manufacturer contact details** (name, registered trade name/trademark, postal address, email, website where applicable) on the product, packaging, or accompanying document — and in the Annex II information
3. A **single point of contact** is designated and identifiable by users for vulnerability reporting — allowing users to choose their preferred means of communication (no automated-tool-only restriction)

### Required Artifacts Checklist — Conformity/Labelling

- [ ] CE marking applied in correct location for product type
- [ ] Product type/batch/serial number identification
- [ ] Manufacturer contact details on product/packaging/accompanying document
- [ ] Single point of contact for vulnerability reporting (publicly identifiable)
- [ ] Annex II information provided in appropriate language(s)
- [ ] DoC / simplified DoC provided with product
- [ ] Where acting as importer: verification checklist completed for each product placed on market

---

## Consolidated Master Checklist: Every Distinct Artifact/Record/Process

This master checklist consolidates all CRA compliance artifacts a manufacturer must have. Each item maps to its primary legal basis.

### PRE-MARKET ARTIFACTS (Must exist before first placement on market)

**Risk Assessment**
- [ ] **Cybersecurity risk assessment** — documented, covering: intended purpose, operational environment, assets, use duration, Annex I Part I (1) and (2)(a)–(m) applicability mapping, Annex I Part II applicability — *Art. 13(3), (4)*
- [ ] **Third-party component due diligence records** — *Art. 13(5)*
- [ ] **Clear justification** for any Annex I requirement deemed inapplicable — *Art. 13(4)*

**Technical Documentation (Annex VII)**
- [ ] **General product description** — *Annex VII, point 1*
- [ ] **Architecture drawings / system architecture diagrams** — *Annex VII, point 2(a)*
- [ ] **Software component descriptions** (how components interact) — *Annex VII, point 2(a)*
- [ ] **Vulnerability handling process specifications** — *Annex VII, point 2(b)*
- [ ] **SBOM** (machine-readable, e.g. SPDX/CycloneDX; at minimum top-level dependencies) — *Annex I Part II item (1); Annex VII, point 2(b) and point 8*
- [ ] **CVD policy** (published; referenced in tech docs) — *Annex I Part II item (5); Annex VII, point 2(b)*
- [ ] **Vulnerability contact address** (evidence of provision) — *Annex I Part II item (6); Annex VII, point 2(b)*
- [ ] **Secure update distribution technical description** — *Annex I Part II item (7); Annex VII, point 2(b)*
- [ ] **Production and monitoring process documentation** — *Annex VII, point 2(c)*
- [ ] **Cybersecurity risk assessment** (as included in tech docs) — *Annex VII, point 3*
- [ ] **Support period justification document** — *Annex VII, point 4*
- [ ] **Harmonised standards / common specifications list or alternative technical measures descriptions** — *Annex VII, point 5*
- [ ] **Conformity test reports** — *Annex VII, point 6*
- [ ] **Copy of EU Declaration of Conformity** (within tech docs) — *Annex VII, point 7*

**Conformity Assessment**
- [ ] **Product classification determination** (default / important class I / important class II / critical) — *Art. 32; Annex III; Annex IV*
- [ ] **Conformity assessment route selection and documentation** — *Art. 32*
- [ ] **Module A internal self-assessment record** (default products) — *Annex VIII Part I*
- [ ] **Module B EU-type examination certificate** (important class I without standards; important class II; critical) — *Annex VIII Part II*
- [ ] **Module B+C production control records** (where applicable) — *Annex VIII Parts II–III*
- [ ] **Module H quality management system documentation** (where applicable) — *Annex VIII Part IV*
- [ ] **Notified body surveillance audit records** (Module B or H) — *Annex VIII*

**Declaration of Conformity and CE Marking**
- [ ] **EU Declaration of Conformity** (Annex V, all 8 fields) — *Art. 28; Annex V*
- [ ] **Simplified EU Declaration of Conformity** (Annex VI) with URL (if using simplified version) — *Art. 13(20); Annex VI*
- [ ] **CE marking affixed** to product / packaging / DoC / website — *Art. 30*

**User-Facing Information (Annex II)**
- [ ] **Annex II information document** covering all items 1–9 (manufacturer details; single point of contact; product ID; intended purpose + security properties; known risks; DoC URL; support period end-date; instructions 8(a)–8(f); SBOM access pointer if applicable) — *Art. 13(18); Annex II*
- [ ] **Support period end-date** prominently displayed at point of purchase — *Art. 13(19)*
- [ ] **Single point of contact** for vulnerability reporting (publicly identifiable) — *Art. 13(17)*

**Product Identification**
- [ ] **Type, batch or serial number** on product or packaging — *Art. 13(15)*
- [ ] **Manufacturer contact details** on product, packaging, or accompanying document — *Art. 13(16)*

### ONGOING / POST-MARKET OBLIGATIONS (Throughout Support Period)

**Vulnerability Handling (Annex I Part II)**
- [ ] **Updated SBOM** (kept current as components change) — *Annex I Part II item (1)*
- [ ] **Vulnerability remediation and patch records** — *Annex I Part II item (2)*
- [ ] **Security test schedule and records** (regular testing) — *Annex I Part II item (3)*
- [ ] **Vulnerability advisory / disclosure record** (for each fixed vulnerability, publicly disclosed) — *Annex I Part II item (4)*
- [ ] **Enforced CVD policy** (process in place and operating) — *Annex I Part II item (5)*
- [ ] **Published vulnerability reporting contact** (operational) — *Annex I Part II item (6)*
- [ ] **Secure update delivery mechanism** (operational; free of charge) — *Annex I Part II items (7)–(8)*

**Post-Market Monitoring (Article 13(7))**
- [ ] **Vulnerability / cybersecurity aspects register** (systematically documented) — *Art. 13(7)*
- [ ] **Updated risk assessment versions** (dated; updated as new information received) — *Art. 13(3), (7)*
- [ ] **Production conformity monitoring process** (tracking changes affecting conformity) — *Art. 13(14)*

**Reporting (Article 14) — from 11 September 2026**
- [ ] **Incident/vulnerability response SOP** (with 24h/72h/14-day/1-month trigger points) — *Art. 14*
- [ ] **ENISA Single Reporting Platform access** (registered and operational) — *Art. 14(7)*
- [ ] **Notification templates** (early warning, main notification, final report — for both vulnerability and incident triggers) — *Art. 14(2), (4)*
- [ ] **Record of all Article 14 notifications submitted** (with timestamps and content) — *Art. 14*
- [ ] **User notification process** for impacted users — *Art. 14(8)*

**Supply Chain Traceability (Article 23)**
- [ ] **Upstream supplier records** (name and address; retained 10 years) — *Art. 23*
- [ ] **Downstream operator records** (name and address; retained 10 years) — *Art. 23*

### RETENTION AND ARCHIVAL

- [ ] **Technical documentation archive** (10 years from placement or support period, whichever longer) — *Art. 13(13)*
- [ ] **DoC archive** (10 years from placement or support period, whichever longer) — *Art. 13(13)*
- [ ] **Annex II user documentation archive** (10 years or support period; online availability maintained) — *Art. 13(18)*
- [ ] **Notified body certificates** (10 years or support period) — *Annex VIII*
- [ ] **Security updates archive** (each update: 10 years post-issuance or remainder of support period) — *Art. 13(9)*

### LIFECYCLE / OPERATIONAL PROCEDURES

- [ ] **Support period determination and communication process** — *Art. 13(8), (19)*
- [ ] **End-of-support user notification mechanism** — *Art. 13(19)*
- [ ] **Corrective action / recall procedure** (if non-conformity detected post-market) — *Art. 13(21)*
- [ ] **Market surveillance authority cooperation process** — *Art. 13(22)*
- [ ] **Cessation-of-operations notification procedure** (inform MSA and users before ceasing) — *Art. 13(23)*
- [ ] **CSIRT coordinator identification** (based on main EU establishment) — *Art. 14(7)*

---

## Penalties Reference

Failure to comply with the essential cybersecurity requirements or other key obligations can result in fines of up to **€15 million or 2.5% of total worldwide annual turnover**, whichever is higher. Supply of incorrect or incomplete information to notified bodies or market surveillance authorities can result in fines of up to **€5 million or 1% of turnover**. ([Wikipedia CRA](https://en.wikipedia.org/wiki/Cyber_Resilience_Act))

> Microenterprises and small enterprises are exempt from fines for failures to meet the **24-hour early warning deadline** only. All other obligations apply in full.

---

## Standards and Implementation Support

Key standards with strong alignment to CRA requirements ([ENISA CRA Requirements Standards Mapping](https://www.enisa.europa.eu/publications/cyber-resilience-act-requirements-standards-mapping)):

| Standard | Relevance |
|---|---|
| **ETSI EN 303 645** | Broadest coverage of Annex I Part I product security requirements (consumer IoT) |
| **IEC 62443 series** | Industrial/OT products; strong Annex I coverage |
| **ISO/IEC 29147** | Vulnerability disclosure (Annex I Part II, item 4 and 5) |
| **ISO/IEC 30111** | Vulnerability handling processes (Annex I Part II) |
| **IEC 62443-4-1** | Secure product development lifecycle (technical documentation, risk assessment) |

Where harmonised standards apply and are fully applied, a **presumption of conformity** with the corresponding Annex I requirements is triggered, enabling Module A self-assessment for Important Class I products (Articles 27, 32).

---

*This report is based on the official text of [Regulation (EU) 2024/2847](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202402847) as published in the Official Journal of the EU on 20 November 2024, cross-referenced with the [EU Commission CRA Summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary), the [EC Commission Guidance (March 2026)](https://www.cyberresilienceact.eu/commission-guidance-on-regulation-eu-2024-2847/), and [ENISA CRA Resources](https://www.enisa.europa.eu/publications/cyber-resilience-act-requirements-standards-mapping). For authoritative legal interpretation, always refer to the Official Journal text and, where available, rulings of the Court of Justice of the European Union.*
