# Payroll Preflight

**Catch payroll risks before the bank transfer.**

Payroll Preflight is a browser-based payroll assurance tool built for OpenAI
Build Week 2026. It reviews a payroll CSV or Excel workbook before release,
identifies explainable risks, and turns each finding into a practical next
action.

Live demo: https://payroll-preflight.afafm1979.chatgpt.site

## Why this project

Payroll systems are not immune to human input and configuration errors. A small
change to a pay element, employee status, or master data can create a hidden
chain effect that is not immediately visible. Payroll teams then lose critical
time manually reviewing and comparing results with the previous month, while
facing the risk of delayed payments, employee complaints, audit findings, or
penalties.

Based on 13 years of payroll and HR systems experience, I learned that accuracy
and time are the two most critical factors before the bank file is released. I
built Payroll Preflight as a pre-transfer payroll review: it analyzes payroll
data, compares current results with prior-period data, and flags explainable
anomalies before money moves.

The goal is not to claim 100% accuracy or replace payroll approval. It is to
reduce risk, shorten manual review, and improve the quality of the final release
decision.

## What it does

- Uploads and reviews a payroll CSV or Excel `.xlsx` workbook entirely in the
  browser.
- Loads a synthetic demonstration dataset with deliberate payroll risks.
- Produces a clear transfer decision: **HOLD**, **REVIEW**, or **READY**.
- Detects duplicate employee IDs and bank accounts shared by multiple employees.
- Reconciles gross pay, deductions, and net pay.
- Flags non-positive net pay and large period-over-period changes.
- Preserves an optional variance reason, so legitimate changes such as advance
  leave salary remain visible for evidence and approval instead of being
  treated as automatically correct or incorrect.
- Checks payments against employee status and termination date.
- Identifies missing bank-account details.
- Filters and searches findings by employee, rule, or severity.
- Exports an Excel-friendly findings CSV and copies a concise review note for
  the payroll owner.

## Audit rules

| Rule | Severity | What is checked |
| --- | --- | --- |
| Duplicate employee ID | Critical | More than one payroll row uses the same employee ID. |
| Net pay mismatch | Critical | Net pay differs from gross pay minus deductions. |
| Non-positive net pay | Critical | Net pay is zero or negative. |
| Post-termination payment | Critical | A positive payment exists for an inactive or terminated employee. |
| Shared bank account | Warning | Different employee IDs use the same bank account. |
| Period variance | Warning or review | Net pay moves by 35% or more; a documented reason remains subject to evidence and approval. |
| Missing bank account | Review | No destination account is present. |

The rules are deterministic and explainable. The product does not present an
opaque AI risk score as payroll truth.

## How Codex and GPT-5.6 were used

OpenAI Codex and GPT-5.6 were the primary development environment and
collaborator for the project:

1. Translated payroll control knowledge into a scoped product and seven
   explainable audit checks.
2. Designed the review workflow, transfer-decision model, and payroll-specific
   interface.
3. Implemented the CSV and Excel ingestion flow, audit engine, filters, search,
   local export, and review-note workflow in React and TypeScript.
4. Created synthetic test cases for duplicate identity, shared accounts,
   mismatched net pay, negative pay, unusual variance, terminated employees,
   and missing banking data.
5. Tested the live interface with both a clean payroll and a deliberately
   risky payroll, then documented the implementation and limitations.

The app itself deliberately performs payroll checks locally and
deterministically. Codex and GPT-5.6 were used to build, test, explain, and
iterate on the working product rather than to hide payroll decisions behind a
runtime model.

## Payroll file format

The app accepts `.csv` and `.xlsx` files. For Excel workbooks, the first
worksheet is reviewed.

Required columns:

- `employee_id`
- `gross_pay`
- `deductions`
- `net_pay`

Recommended columns:

- `employee_name`
- `bank_account`
- `previous_net_pay`
- `status`
- `termination_date`
- `pay_period_end`
- `variance_reason` (also recognizes `change_reason`, `payroll_note`, and
  `exception_reason`)

Use the **Download sample CSV** action in the app or
`public/payroll-preflight-sample.csv`.

## Privacy and safety

- CSV and Excel processing happen in the browser.
- Excel workbooks are limited to the first worksheet.
- No uploaded payroll file is sent to a database or external service.
- The public demo contains synthetic data only.
- The tool supports review; it does not replace payroll approval, legal review,
  or bank controls.

## Technology

- OpenAI Codex
- GPT-5.6
- React 19
- TypeScript
- `read-excel-file`
- Next.js / Vinext
- OpenAI Sites
- Browser File and Blob APIs

## Run locally

```bash
npm install
npm run dev
```

Then open the local address displayed by the development server.

## Test the project

1. Open the live demo or run the project locally.
2. Choose **Load synthetic demo** to see a deliberately risky payroll and a
   **HOLD** decision.
3. Download the sample CSV, optionally save it as an Excel `.xlsx` workbook,
   and upload it through **Audit a payroll file**.
4. Filter the findings, export the findings CSV, and copy the review note.
5. Run the automated audit-rule and production-build checks:

```bash
npm test
```

## Current limitations

- Excel support reads the first worksheet only.
- Column aliases cover common English payroll labels.
- Thresholds are intentionally fixed for the hackathon prototype.
- The prototype does not connect to HRMS, banking, or production payroll data.

## Next steps

- Add configurable audit thresholds and organization-specific rules.
- Compare multiple payroll periods and show explainable trend analysis.
- Add configurable organization policies for allowances, location changes, and
  return-to-work reconciliation.
- Add versioned Saudi payroll controls, including GOSI reconciliation, only
  after policy validation and effective-date handling.
- Add a separately validated end-of-service benefits module.
- Add approval evidence, exception ownership, and audit-history workflows.
- Create controlled connectors for HRMS and payroll systems.

## Submission

Built as an individual submission for **OpenAI Build Week 2026** in the
**Work & Productivity** category. All demonstration names, accounts, and
payroll values are synthetic.

## License

MIT — see `LICENSE`.
