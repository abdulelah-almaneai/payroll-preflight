# Payroll Preflight

**Catch payroll risks before the bank transfer.**

Payroll Preflight is a browser-based payroll assurance tool built for OpenAI
Build Week 2026. It reviews a payroll CSV before release, identifies
explainable risks, and turns each finding into a practical next action.

Live demo: https://payroll-preflight.afafm1979.chatgpt.site

## Why this project

Payroll errors are unusually expensive because a small data problem can become
a bank transfer, employee complaint, recovery case, or audit issue within
hours. The project is grounded in 13 years of hands-on payroll and HR systems
experience. It focuses on the final control point: the review immediately
before payroll is released.

## What it does

- Uploads and reviews a payroll CSV entirely in the browser.
- Loads a synthetic demonstration dataset with deliberate payroll risks.
- Produces a clear transfer decision: **HOLD**, **REVIEW**, or **READY**.
- Detects duplicate employee IDs and bank accounts shared by multiple employees.
- Reconciles gross pay, deductions, and net pay.
- Flags non-positive net pay and large period-over-period changes.
- Checks payments against employee status and termination date.
- Identifies missing bank-account details.
- Filters and searches findings by employee, rule, or severity.
- Exports a findings CSV and copies a concise review note for the payroll owner.

## Audit rules

| Rule | Severity | What is checked |
| --- | --- | --- |
| Duplicate employee ID | Critical | More than one payroll row uses the same employee ID. |
| Net pay mismatch | Critical | Net pay differs from gross pay minus deductions. |
| Non-positive net pay | Critical | Net pay is zero or negative. |
| Post-termination payment | Critical | A positive payment exists for an inactive or terminated employee. |
| Shared bank account | Warning | Different employee IDs use the same bank account. |
| Period variance | Warning | Net pay moves by 35% or more from the previous period. |
| Missing bank account | Review | No destination account is present. |

The rules are deterministic and explainable. The product does not present an
opaque AI risk score as payroll truth.

## How Codex and GPT-5.6 were used

OpenAI Codex and GPT-5.6 were the primary development environment and
collaborator for the project:

1. Translated payroll control knowledge into a scoped product and six
   explainable audit checks.
2. Designed the review workflow, transfer-decision model, and payroll-specific
   interface.
3. Implemented the CSV parser, audit engine, filters, search, local export, and
   review-note workflow in React and TypeScript.
4. Created synthetic test cases for duplicate identity, shared accounts,
   mismatched net pay, negative pay, unusual variance, terminated employees,
   and missing banking data.
5. Tested the live interface with both a clean payroll and a deliberately
   risky payroll, then documented the implementation and limitations.

The app itself deliberately performs payroll checks locally and
deterministically. Codex and GPT-5.6 were used to build, test, explain, and
iterate on the working product rather than to hide payroll decisions behind a
runtime model.

## CSV format

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

Use the **Download sample CSV** action in the app or
`public/payroll-preflight-sample.csv`.

## Privacy and safety

- CSV processing happens in the browser.
- No uploaded payroll file is sent to a database or external service.
- The public demo contains synthetic data only.
- The tool supports review; it does not replace payroll approval, legal review,
  or bank controls.

## Technology

- OpenAI Codex
- GPT-5.6
- React 19
- TypeScript
- Next.js / Vinext
- OpenAI Sites
- Browser File and Blob APIs

## Run locally

```bash
npm install
npm run dev
```

Then open the local address displayed by the development server.

## Current limitations

- CSV is supported; native Excel workbooks are not yet parsed.
- Column aliases cover common English payroll labels.
- Thresholds are intentionally fixed for the hackathon prototype.
- The prototype does not connect to HRMS, banking, or production payroll data.

## Next steps

- Add configurable audit thresholds and organization-specific rules.
- Support Excel workbooks and reusable column mapping.
- Compare multiple payroll periods and show explainable trend analysis.
- Add approval evidence, exception ownership, and audit-history workflows.
- Create controlled connectors for HRMS and payroll systems.

## Submission

Built as an individual submission for **OpenAI Build Week 2026** in the
**Work & Productivity** category. All demonstration names, accounts, and
payroll values are synthetic.
