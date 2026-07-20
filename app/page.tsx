"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { buildExcelAuditReport } from "@/lib/excel-report";
import {
  analyzePayroll,
  AUDIT_RULES,
  csvCell,
  DEMO_ROWS,
  excelCompatibleCsv,
  formatSar,
  parsePayrollCsv,
  parsePayrollTable,
  rowsToCsv,
  type PayrollRow,
  type Severity,
} from "@/lib/payroll-audit";

type Filter = "All" | Severity;

function downloadText(filename: string, text: string) {
  const blob = new Blob([excelCompatibleCsv(text)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export default function Home() {
  const [rows, setRows] = useState<PayrollRow[]>(DEMO_ROWS);
  const [fileName, setFileName] = useState("payroll_demo_july.csv");
  const [isDemo, setIsDemo] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
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
    const lowerName = file.name.toLowerCase();
    const isCsv = lowerName.endsWith(".csv");
    const isExcel = lowerName.endsWith(".xlsx");
    if (!isCsv && !isExcel) {
      setError("Please choose a CSV or Excel (.xlsx) payroll file.");
      return;
    }
    try {
      const parsed = isCsv
        ? parsePayrollCsv(await file.text())
        : parsePayrollTable(
          await (await import("read-excel-file/browser")).readSheet(file, { trim: false }),
        );
      setRows(parsed);
      setFileName(file.name);
      setIsDemo(false);
      setFilter("All");
      setQuery("");
      setError("");
      window.setTimeout(() => document.getElementById("audit")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The payroll file could not be read.");
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

  const exportExcelReport = async () => {
    setIsExportingExcel(true);
    setError("");
    try {
      const report = buildExcelAuditReport({ rows, analysis, sourceFile: fileName });
      const writeExcelFile = (await import("write-excel-file/browser")).default;
      await writeExcelFile(report.sheets).toFile(report.fileName);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The Excel audit report could not be created.");
    } finally {
      setIsExportingExcel(false);
    }
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
            Turn a payroll CSV or Excel workbook into a clear, explainable review: what needs
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
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              aria-label="Upload payroll CSV or Excel workbook"
              onChange={handleFileChange}
            />
            <div className="hero-actions">
              <button className="button primary" type="button" onClick={() => fileInput.current?.click()}>
                Audit a payroll file
              </button>
              <button className="button secondary" type="button" onClick={loadDemo}>
                Load synthetic demo
              </button>
            </div>
            <p className="drop-note">Drop a CSV or Excel (.xlsx) file here · first worksheet only · use synthetic or anonymized data</p>
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
              Export a workflow-ready Excel report, a CSV integration file, or
              a concise review note for the payroll owner. Resolve findings,
              document approval, then run the file again before release.
            </p>
          </div>
          <ol className="review-steps">
            <li><span>1</span>Investigate critical findings</li>
            <li><span>2</span>Document corrections and approvals</li>
            <li><span>3</span>Re-run the corrected payroll</li>
            <li><span>4</span>Release only when the decision is ready</li>
          </ol>
          <div className="review-actions">
            <button
              className="button primary"
              type="button"
              onClick={() => void exportExcelReport()}
              disabled={!rows.length || isExportingExcel}
            >
              {isExportingExcel ? "Preparing Excel report…" : "Export Excel report"}
            </button>
            <button className="button secondary" type="button" onClick={exportFindings} disabled={!totalFindings}>
              Export CSV for integration
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
            <h2>Seven checks. One release decision.</h2>
          </div>
          <p>
            Payroll Preflight uses transparent audit rules instead of an
            unexplained risk score. Every finding shows its evidence and next action.
          </p>
        </div>
        <div className="rules-grid">
          {AUDIT_RULES.map(([number, title, description]) => (
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
        <p>All sample data is synthetic. Uploaded CSV and Excel files are processed in the browser.</p>
      </footer>
    </main>
  );
}
