"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type Severity = "Critical" | "Warning" | "Review";
type Filter = "All" | Severity;

type PayrollRow = {
  sourceIndex: number;
  employeeId: string;
  employeeName: string;
  bankAccount: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  previousNetPay: number;
  status: string;
  terminationDate: string;
  payPeriodEnd: string;
};

type Finding = {
  id: string;
  severity: Severity;
  employeeIds: string[];
  employee: string;
  rule: string;
  evidence: string;
  action: string;
};

const DEMO_ROWS: PayrollRow[] = [
  { sourceIndex: 1, employeeId: "EMP-1001", employeeName: "Aisha Al-Dossari", bankAccount: "SA-1101", grossPay: 18500, deductions: 2100, netPay: 16400, previousNetPay: 16350, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 2, employeeId: "EMP-1002", employeeName: "Khalid Al-Mutairi", bankAccount: "SA-1102", grossPay: 14000, deductions: 1400, netPay: 12600, previousNetPay: 12600, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 3, employeeId: "EMP-1003", employeeName: "Sara Al-Qahtani", bankAccount: "SA-1103", grossPay: 12000, deductions: 1200, netPay: 10800, previousNetPay: 10750, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 4, employeeId: "EMP-1004", employeeName: "Fahad Karim", bankAccount: "SA-1104", grossPay: 9500, deductions: 950, netPay: 8550, previousNetPay: 8500, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 5, employeeId: "EMP-1005", employeeName: "Nora Salem", bankAccount: "SA-1105", grossPay: 11000, deductions: 1100, netPay: 9900, previousNetPay: 9800, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 6, employeeId: "EMP-1006", employeeName: "Majed Youssef", bankAccount: "SA-1105", grossPay: 20000, deductions: 2500, netPay: 17500, previousNetPay: 17400, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 7, employeeId: "EMP-1007", employeeName: "Huda Aziz", bankAccount: "SA-1107", grossPay: 8000, deductions: 800, netPay: 7200, previousNetPay: 7200, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 8, employeeId: "EMP-1007", employeeName: "Huda Aziz", bankAccount: "SA-1113", grossPay: 8000, deductions: 800, netPay: 7200, previousNetPay: 7200, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 9, employeeId: "EMP-1008", employeeName: "Yousef Saleh", bankAccount: "SA-1108", grossPay: 10500, deductions: 1000, netPay: 11000, previousNetPay: 9500, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 10, employeeId: "EMP-1009", employeeName: "Lina Faris", bankAccount: "SA-1109", grossPay: 13000, deductions: 1400, netPay: -500, previousNetPay: 11550, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 11, employeeId: "EMP-1010", employeeName: "Rana Nasser", bankAccount: "SA-1110", grossPay: 21000, deductions: 2900, netPay: 18100, previousNetPay: 8100, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 12, employeeId: "EMP-1011", employeeName: "Maha Al-Harbi", bankAccount: "SA-1111", grossPay: 16000, deductions: 1800, netPay: 14200, previousNetPay: 14100, status: "Terminated", terminationDate: "2026-06-30", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 13, employeeId: "EMP-1012", employeeName: "Ziad Omar", bankAccount: "", grossPay: 12500, deductions: 1200, netPay: 11300, previousNetPay: 11200, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
];

const RULES = [
  ["01", "Duplicate identity", "Flags repeated employee IDs before totals are approved."],
  ["02", "Shared bank account", "Finds one account assigned to different employees."],
  ["03", "Net pay integrity", "Reconciles gross pay, deductions, and net pay."],
  ["04", "Period variance", "Surfaces movement of 35% or more from the previous payroll."],
  ["05", "Employment status", "Checks payments against termination dates and status."],
  ["06", "Payment readiness", "Catches missing destination bank-account details."],
];

const HEADERS = [
  "employee_id",
  "employee_name",
  "bank_account",
  "gross_pay",
  "deductions",
  "net_pay",
  "previous_net_pay",
  "status",
  "termination_date",
  "pay_period_end",
];

const ALIASES: Record<string, string[]> = {
  employeeId: ["employee_id", "employee_number", "employee_no", "emp_id", "employeeid"],
  employeeName: ["employee_name", "full_name", "name", "employeename"],
  bankAccount: ["bank_account", "iban", "account_number", "bankaccount"],
  grossPay: ["gross_pay", "gross_salary", "gross", "grosspay"],
  deductions: ["deductions", "total_deductions", "deduction"],
  netPay: ["net_pay", "net_salary", "net", "netpay"],
  previousNetPay: ["previous_net_pay", "prior_net_pay", "last_net_pay", "previousnetpay"],
  status: ["status", "employee_status", "employment_status"],
  terminationDate: ["termination_date", "end_date", "separation_date"],
  payPeriodEnd: ["pay_period_end", "period_end", "payroll_date"],
};

function formatSar(value: number) {
  return "SAR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function csvCell(value: string | number) {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

function rowsToCsv(rows: PayrollRow[]) {
  const lines = rows.map((row) =>
    [
      row.employeeId,
      row.employeeName,
      row.bankAccount,
      row.grossPay,
      row.deductions,
      row.netPay,
      row.previousNetPay,
      row.status,
      row.terminationDate,
      row.payPeriodEnd,
    ].map(csvCell).join(",")
  );
  return HEADERS.join(",") + "\n" + lines.join("\n");
}

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function tokenizeCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function toAmount(value: string) {
  const normalized = value.replace(/[^0-9.-]+/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePayrollCsv(text: string) {
  const rawRows = tokenizeCsv(text);
  if (rawRows.length < 2) throw new Error("The CSV needs a header row and at least one payroll record.");

  const normalizedHeaders = rawRows[0].map(normalizeHeader);
  const indexFor = (field: string) => {
    const aliases = ALIASES[field] ?? [];
    return normalizedHeaders.findIndex((header) => aliases.includes(header));
  };

  const indexes = {
    employeeId: indexFor("employeeId"),
    employeeName: indexFor("employeeName"),
    bankAccount: indexFor("bankAccount"),
    grossPay: indexFor("grossPay"),
    deductions: indexFor("deductions"),
    netPay: indexFor("netPay"),
    previousNetPay: indexFor("previousNetPay"),
    status: indexFor("status"),
    terminationDate: indexFor("terminationDate"),
    payPeriodEnd: indexFor("payPeriodEnd"),
  };

  const missing = [
    ["employee_id", indexes.employeeId],
    ["gross_pay", indexes.grossPay],
    ["deductions", indexes.deductions],
    ["net_pay", indexes.netPay],
  ].filter(([, index]) => Number(index) < 0).map(([name]) => name);

  if (missing.length) throw new Error("Missing required columns: " + missing.join(", ") + ".");

  const valueAt = (row: string[], index: number) => (index >= 0 ? (row[index] ?? "").trim() : "");

  return rawRows.slice(1).map((row, position) => {
    const employeeId = valueAt(row, indexes.employeeId);
    if (!employeeId) throw new Error("Row " + (position + 2) + " is missing employee_id.");
    return {
      sourceIndex: position + 1,
      employeeId,
      employeeName: valueAt(row, indexes.employeeName) || employeeId,
      bankAccount: valueAt(row, indexes.bankAccount),
      grossPay: toAmount(valueAt(row, indexes.grossPay)),
      deductions: toAmount(valueAt(row, indexes.deductions)),
      netPay: toAmount(valueAt(row, indexes.netPay)),
      previousNetPay: indexes.previousNetPay >= 0
        ? toAmount(valueAt(row, indexes.previousNetPay))
        : toAmount(valueAt(row, indexes.netPay)),
      status: valueAt(row, indexes.status) || "Active",
      terminationDate: valueAt(row, indexes.terminationDate),
      payPeriodEnd: valueAt(row, indexes.payPeriodEnd),
    };
  });
}

function analyzePayroll(rows: PayrollRow[]) {
  const findings: Finding[] = [];
  const add = (finding: Finding) => findings.push(finding);
  const byEmployee = new Map<string, PayrollRow[]>();
  const byBank = new Map<string, PayrollRow[]>();

  rows.forEach((row) => {
    byEmployee.set(row.employeeId, [...(byEmployee.get(row.employeeId) ?? []), row]);
    if (row.bankAccount) {
      byBank.set(row.bankAccount, [...(byBank.get(row.bankAccount) ?? []), row]);
    }
  });

  byEmployee.forEach((group, employeeId) => {
    if (group.length > 1) {
      add({
        id: "duplicate-" + employeeId,
        severity: "Critical",
        employeeIds: [employeeId],
        employee: group[0].employeeName + " · " + employeeId,
        rule: "Duplicate employee ID",
        evidence: group.length + " payroll rows use the same employee ID",
        action: "Confirm the valid row and remove the duplicate",
      });
    }
  });

  byBank.forEach((group, bankAccount) => {
    const ids = [...new Set(group.map((row) => row.employeeId))];
    if (ids.length > 1) {
      add({
        id: "bank-" + bankAccount,
        severity: "Warning",
        employeeIds: ids,
        employee: group.map((row) => row.employeeName).join(" / "),
        rule: "Shared bank account",
        evidence: bankAccount + " is assigned to " + ids.length + " employees",
        action: "Verify ownership and obtain payroll approval",
      });
    }
  });

  rows.forEach((row) => {
    const expectedNet = row.grossPay - row.deductions;
    const mismatch = row.netPay - expectedNet;
    if (row.netPay <= 0) {
      add({
        id: "non-positive-" + row.sourceIndex,
        severity: "Critical",
        employeeIds: [row.employeeId],
        employee: row.employeeName + " · " + row.employeeId,
        rule: "Non-positive net pay",
        evidence: "Calculated net pay is " + formatSar(row.netPay),
        action: "Stop payment and review deductions or recovery amounts",
      });
    }
    if (Math.abs(mismatch) > 1) {
      add({
        id: "mismatch-" + row.sourceIndex,
        severity: "Critical",
        employeeIds: [row.employeeId],
        employee: row.employeeName + " · " + row.employeeId,
        rule: "Net pay mismatch",
        evidence: "Net pay differs from gross minus deductions by " + formatSar(Math.abs(mismatch)),
        action: "Recalculate the payroll result",
      });
    }
    if (row.previousNetPay !== 0) {
      const variance = ((row.netPay - row.previousNetPay) / Math.abs(row.previousNetPay)) * 100;
      if (Math.abs(variance) >= 35) {
        add({
          id: "variance-" + row.sourceIndex,
          severity: "Warning",
          employeeIds: [row.employeeId],
          employee: row.employeeName + " · " + row.employeeId,
          rule: "Month-over-month variance",
          evidence: "Net pay changed " + Math.abs(variance).toFixed(1) + "% from the prior period",
          action: "Validate one-time earnings, deductions, and approvals",
        });
      }
    }

    const statusClosed = /terminated|inactive|separated/i.test(row.status);
    const paidAfterEnd = Boolean(
      row.terminationDate &&
      row.payPeriodEnd &&
      new Date(row.terminationDate).getTime() <= new Date(row.payPeriodEnd).getTime()
    );
    if (row.netPay > 0 && (statusClosed || paidAfterEnd)) {
      add({
        id: "status-" + row.sourceIndex,
        severity: "Critical",
        employeeIds: [row.employeeId],
        employee: row.employeeName + " · " + row.employeeId,
        rule: "Post-termination payment",
        evidence: formatSar(row.netPay) + " is scheduled for an inactive or terminated employee",
        action: "Confirm final settlement or remove the employee from payroll",
      });
    }

    if (!row.bankAccount) {
      add({
        id: "bank-missing-" + row.sourceIndex,
        severity: "Review",
        employeeIds: [row.employeeId],
        employee: row.employeeName + " · " + row.employeeId,
        rule: "Missing bank account",
        evidence: "No destination account is present",
        action: "Complete banking details before release",
      });
    }
  });

  const severityOrder: Record<Severity, number> = { Critical: 0, Warning: 1, Review: 2 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const counts = findings.reduce(
    (result, finding) => ({ ...result, [finding.severity]: result[finding.severity] + 1 }),
    { Critical: 0, Warning: 0, Review: 0 } as Record<Severity, number>
  );
  const flaggedIds = new Set(findings.flatMap((finding) => finding.employeeIds));
  const totalNet = rows.reduce((sum, row) => sum + row.netPay, 0);
  const decision = counts.Critical > 0 ? "HOLD" : counts.Warning > 0 ? "REVIEW" : "READY";

  return {
    findings,
    counts,
    uniqueEmployees: new Set(rows.map((row) => row.employeeId)).size,
    flaggedEmployees: flaggedIds.size,
    totalNet,
    decision,
  };
}

export default function Home() {
  const [rows, setRows] = useState<PayrollRow[]>(DEMO_ROWS);
  const [fileName, setFileName] = useState("payroll_demo_july.csv");
  const [isDemo, setIsDemo] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const analysis = useMemo(() => analyzePayroll(rows), [rows]);
  const filteredFindings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return analysis.findings.filter((finding) => {
      const matchesFilter = filter === "All" || finding.severity === filter;
      const haystack = [finding.employee, finding.rule, finding.evidence, finding.action].join(" ").toLowerCase();
      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [analysis.findings, filter, query]);

  const loadFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose a CSV file. Download the sample to see the expected format.");
      return;
    }
    try {
      const parsed = parsePayrollCsv(await file.text());
      setRows(parsed);
      setFileName(file.name);
      setIsDemo(false);
      setFilter("All");
      setQuery("");
      setError("");
      window.setTimeout(() => document.getElementById("audit")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The CSV could not be read.");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void loadFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void loadFile(event.dataTransfer.files?.[0]);
  };

  const loadDemo = () => {
    setRows(DEMO_ROWS);
    setFileName("payroll_demo_july.csv");
    setIsDemo(true);
    setFilter("All");
    setQuery("");
    setError("");
    document.getElementById("audit")?.scrollIntoView({ behavior: "smooth" });
  };

  const exportFindings = () => {
    const header = ["severity", "employee", "rule", "evidence", "recommended_action"];
    const lines = analysis.findings.map((finding) =>
      [finding.severity, finding.employee, finding.rule, finding.evidence, finding.action]
        .map(csvCell)
        .join(",")
    );
    downloadText("payroll-preflight-findings.csv", header.join(",") + "\n" + lines.join("\n"));
  };

  const copyReviewNote = async () => {
    const topFindings = analysis.findings.slice(0, 5).map((finding) =>
      "- [" + finding.severity + "] " + finding.employee + ": " + finding.rule + ". " + finding.action + "."
    );
    const note = [
      "Subject: Payroll Preflight review — " + analysis.decision,
      "",
      "The pre-transfer review found " + analysis.findings.length + " item(s): " +
        analysis.counts.Critical + " critical, " + analysis.counts.Warning + " warning, and " +
        analysis.counts.Review + " review.",
      "",
      ...topFindings,
      "",
      "Please document the resolution and re-run the preflight before releasing payroll.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("The review note could not be copied in this browser.");
    }
  };

  const totalFindings = analysis.findings.length;
  const flaggedPercent = analysis.uniqueEmployees
    ? (analysis.flaggedEmployees / analysis.uniqueEmployees) * 100
    : 0;
  const decisionClass = analysis.decision.toLowerCase();
  const decisionMessage =
    analysis.decision === "HOLD"
      ? "Resolve critical findings before release."
      : analysis.decision === "REVIEW"
        ? "Complete warning reviews before release."
        : "No blocking findings detected.";

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Payroll Preflight home">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Payroll Preflight</strong>
            <small>Pre-transfer assurance</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#audit">Live audit</a>
          <a href="#rules">Audit rules</a>
          <span className="privacy-chip">Browser-only review</span>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Payroll assurance · Before release</p>
          <h1>Catch payroll risks before the bank transfer.</h1>
          <p className="hero-text">
            Turn a payroll CSV into a clear, explainable review: what needs
            attention, why it was flagged, and what to do before money moves.
          </p>
          <div
            className="upload-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept=".csv,text/csv"
              aria-label="Upload payroll CSV"
              onChange={handleFileChange}
            />
            <div className="hero-actions">
              <button className="button primary" type="button" onClick={() => fileInput.current?.click()}>
                Audit a CSV
              </button>
              <button className="button secondary" type="button" onClick={loadDemo}>
                Load synthetic demo
              </button>
            </div>
            <p className="drop-note">Drop a CSV here · use synthetic or anonymized data only</p>
          </div>
          {error ? <p className="error-banner" role="alert">{error}</p> : null}
        </div>

        <aside className={"decision-card " + decisionClass} aria-label="Payroll transfer decision">
          <div className="decision-topline">
            <span>Transfer decision</span>
            <span className="live-dot">Preflight complete</span>
          </div>
          <div className="decision-status">
            <span className="status-mark">{analysis.decision === "READY" ? "✓" : "!"}</span>
            <div>
              <strong>{analysis.decision}</strong>
              <p>{decisionMessage}</p>
            </div>
          </div>
          <div className="decision-stats">
            <div><span>Critical</span><strong>{analysis.counts.Critical}</strong></div>
            <div><span>Warnings</span><strong>{analysis.counts.Warning}</strong></div>
            <div><span>Review</span><strong>{analysis.counts.Review}</strong></div>
          </div>
          <div
            className="risk-bar"
            aria-label={
              "Risk mix: " + analysis.counts.Critical + " critical, " +
              analysis.counts.Warning + " warnings, " + analysis.counts.Review + " review"
            }
          >
            {analysis.counts.Critical ? <span className="risk-critical" style={{ flex: analysis.counts.Critical }} /> : null}
            {analysis.counts.Warning ? <span className="risk-warning" style={{ flex: analysis.counts.Warning }} /> : null}
            {analysis.counts.Review ? <span className="risk-review" style={{ flex: analysis.counts.Review }} /> : null}
            {!totalFindings ? <span className="risk-clear" /> : null}
          </div>
          <p className="decision-footnote">
            {totalFindings} finding{totalFindings === 1 ? "" : "s"} across {analysis.flaggedEmployees} of {analysis.uniqueEmployees} employees
          </p>
        </aside>
      </section>

      <section className="audit-section" id="audit">
        <div className="section-heading audit-heading">
          <div>
            <p className="eyebrow">{isDemo ? "Synthetic demo" : "Uploaded payroll"} · {fileName}</p>
            <h2>A decision-ready payroll review</h2>
          </div>
          <div className="dataset-actions">
            <button className="text-button" type="button" onClick={() => downloadText("payroll-preflight-sample.csv", rowsToCsv(DEMO_ROWS))}>
              Download sample CSV
            </button>
            <span className="run-meta">{rows.length} records · processed locally</span>
          </div>
        </div>

        <div className="metric-grid">
          <article>
            <span>Employees reviewed</span>
            <strong>{analysis.uniqueEmployees}</strong>
            <small>{rows.length} payroll rows processed</small>
          </article>
          <article>
            <span>Total net payroll</span>
            <strong>{formatSar(analysis.totalNet)}</strong>
            <small>Before flagged corrections</small>
          </article>
          <article>
            <span>Flagged employees</span>
            <strong>{analysis.flaggedEmployees}</strong>
            <small>{flaggedPercent.toFixed(1)}% need attention</small>
          </article>
          <article className={analysis.counts.Critical ? "metric-alert" : "metric-clear"}>
            <span>Critical findings</span>
            <strong>{analysis.counts.Critical}</strong>
            <small>{analysis.counts.Critical ? "Transfer should remain on hold" : "No blocking issue detected"}</small>
          </article>
        </div>

        <div className="findings-panel">
          <div className="panel-header findings-header">
            <div>
              <p className="eyebrow">Priority queue</p>
              <h3>Findings that need action</h3>
            </div>
            <span className="count-chip">{filteredFindings.length} shown of {totalFindings}</span>
          </div>

          <div className="table-tools">
            <div className="filter-group" aria-label="Filter findings">
              {(["All", "Critical", "Warning", "Review"] as Filter[]).map((option) => (
                <button
                  className={"filter-button " + (filter === option ? "active" : "")}
                  type="button"
                  key={option}
                  aria-pressed={filter === option}
                  onClick={() => setFilter(option)}
                >
                  {option}
                  <span>{option === "All" ? totalFindings : analysis.counts[option]}</span>
                </button>
              ))}
            </div>
            <label className="search-field">
              <span className="visually-hidden">Search findings</span>
              <input
                type="search"
                value={query}
                placeholder="Search employee or rule"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          {filteredFindings.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Employee</th>
                    <th>Finding</th>
                    <th>Evidence</th>
                    <th>Recommended action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFindings.map((finding) => (
                    <tr key={finding.id}>
                      <td><span className={"severity " + finding.severity.toLowerCase()}>{finding.severity}</span></td>
                      <td className="employee-cell">{finding.employee}</td>
                      <td>{finding.rule}</td>
                      <td>{finding.evidence}</td>
                      <td>{finding.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <strong>No matching findings</strong>
              <p>Adjust the filter or search term to see other results.</p>
            </div>
          )}
        </div>

        <div className="review-pack">
          <div>
            <p className="eyebrow">Release workflow</p>
            <h3>Turn findings into a controlled decision.</h3>
            <p>
              Export the audit trail or copy a concise review note for the
              payroll owner. Resolve findings, document approval, then run the
              file again before release.
            </p>
          </div>
          <ol className="review-steps">
            <li><span>1</span>Investigate critical findings</li>
            <li><span>2</span>Document corrections and approvals</li>
            <li><span>3</span>Re-run the corrected payroll</li>
            <li><span>4</span>Release only when the decision is ready</li>
          </ol>
          <div className="review-actions">
            <button className="button primary" type="button" onClick={exportFindings} disabled={!totalFindings}>
              Export findings CSV
            </button>
            <button className="button secondary" type="button" onClick={() => void copyReviewNote()}>
              {copied ? "Review note copied" : "Copy review note"}
            </button>
          </div>
        </div>
      </section>

      <section className="rules-section" id="rules">
        <div className="section-heading rules-heading">
          <div>
            <p className="eyebrow">Explainable by design</p>
            <h2>Six checks. One release decision.</h2>
          </div>
          <p>
            Payroll Preflight uses transparent audit rules instead of an
            unexplained risk score. Every finding shows its evidence and next action.
          </p>
        </div>
        <div className="rules-grid">
          {RULES.map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <div>
          <strong>Payroll Preflight</strong>
          <p>Built from 13 years of payroll operations experience.</p>
        </div>
        <p>All sample data is synthetic. Uploaded CSV files are processed in the browser.</p>
      </footer>
    </main>
  );
}
