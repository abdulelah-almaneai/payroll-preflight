import type { CellObject, Sheet, SheetData } from "write-excel-file/browser";

import { AUDIT_RULES, type Finding, type PayrollRow, type Severity } from "./payroll-audit.ts";

type AuditAnalysis = {
  findings: Finding[];
  counts: Record<Severity, number>;
  uniqueEmployees: number;
  flaggedEmployees: number;
  totalNet: number;
  decision: "HOLD" | "REVIEW" | "READY";
};

type ExcelAuditReportInput = {
  rows: PayrollRow[];
  analysis: AuditAnalysis;
  sourceFile: string;
  generatedAt?: Date;
};

const teal = "#0D5B52";
const paleTeal = "#E8F1ED";
const ink = "#1B2724";
const line = "#C9D6D1";

const headerCell = (value: string): CellObject => ({
  value,
  fontWeight: "bold",
  textColor: "#FFFFFF",
  backgroundColor: teal,
  align: "center",
  alignVertical: "center",
  wrap: true,
  height: 32,
  borderColor: "#FFFFFF",
  borderStyle: "thin",
});

const sectionCell = (value: string, columnSpan: number): CellObject => ({
  value,
  columnSpan,
  fontWeight: "bold",
  textColor: "#FFFFFF",
  backgroundColor: teal,
  alignVertical: "center",
  height: 28,
});

const labelCell = (value: string): CellObject => ({
  value,
  fontWeight: "bold",
  backgroundColor: paleTeal,
  textColor: ink,
  borderColor: line,
  borderStyle: "thin",
});

const valueCell = (value: string | number | Date, format?: string): CellObject => ({
  value,
  format,
  wrap: true,
  borderColor: line,
  borderStyle: "thin",
});

const severityCell = (severity: Severity): CellObject => ({
  value: severity,
  fontWeight: "bold",
  textColor: severity === "Critical" ? "#8F1D2C" : severity === "Warning" ? "#865300" : "#155A73",
  backgroundColor: severity === "Critical" ? "#F9E1E5" : severity === "Warning" ? "#FFF1CC" : "#DFF0F5",
  align: "center",
  borderColor: line,
  borderStyle: "thin",
});

function twoDigits(value: number) {
  return String(value).padStart(2, "0");
}

function dateStamp(value: Date) {
  return [
    value.getFullYear(),
    twoDigits(value.getMonth() + 1),
    twoDigits(value.getDate()),
  ].join("");
}

function timeStamp(value: Date) {
  return [twoDigits(value.getHours()), twoDigits(value.getMinutes()), twoDigits(value.getSeconds())].join("");
}

function payPeriodLabel(rows: PayrollRow[]) {
  const periods = [...new Set(rows.map((row) => row.payPeriodEnd).filter(Boolean))].sort();
  if (!periods.length) return "Not supplied";
  return periods.join("; ");
}

function reportFilePeriod(rows: PayrollRow[], generatedAt: Date) {
  const periods = [...new Set(rows.map((row) => row.payPeriodEnd).filter(Boolean))];
  if (periods.length === 1 && /^\d{4}-\d{2}-\d{2}$/.test(periods[0])) return periods[0];
  return [generatedAt.getFullYear(), twoDigits(generatedAt.getMonth() + 1), twoDigits(generatedAt.getDate())].join("-");
}

export function buildExcelAuditReport({
  rows,
  analysis,
  sourceFile,
  generatedAt = new Date(),
}: ExcelAuditReportInput) {
  const auditId = "PP-" + dateStamp(generatedAt) + "-" + timeStamp(generatedAt);
  const period = payPeriodLabel(rows);
  const reportName = "payroll-preflight-audit-" + reportFilePeriod(rows, generatedAt) + ".xlsx";
  const flaggedPercent = analysis.uniqueEmployees
    ? analysis.flaggedEmployees / analysis.uniqueEmployees
    : 0;

  const summary: SheetData = [
    [{
      value: "Payroll Preflight Audit Report",
      columnSpan: 4,
      fontSize: 18,
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundColor: ink,
      alignVertical: "center",
      height: 38,
    }],
    [{
      value: "Decision-ready payroll review before bank transfer",
      columnSpan: 4,
      fontStyle: "italic",
      textColor: "#49645D",
      height: 24,
    }],
    [sectionCell("Audit information", 4)],
    [labelCell("Audit ID"), valueCell(auditId), labelCell("Audit date"), valueCell(generatedAt, "yyyy-mm-dd hh:mm")],
    [labelCell("Source file"), valueCell(sourceFile), labelCell("Pay period end"), valueCell(period)],
    [labelCell("Decision"), {
      value: analysis.decision,
      fontWeight: "bold",
      align: "center",
      textColor: analysis.decision === "HOLD" ? "#8F1D2C" : analysis.decision === "REVIEW" ? "#865300" : "#19623A",
      backgroundColor: analysis.decision === "HOLD" ? "#F9E1E5" : analysis.decision === "REVIEW" ? "#FFF1CC" : "#DCF2E5",
      borderColor: line,
      borderStyle: "thin",
    }, labelCell("Audit year"), valueCell(generatedAt.getFullYear())],
    [sectionCell("Control totals", 4)],
    [labelCell("Payroll rows"), valueCell(rows.length), labelCell("Employees reviewed"), valueCell(analysis.uniqueEmployees)],
    [labelCell("Total net payroll (SAR)"), valueCell(analysis.totalNet, "#,##0"), labelCell("Flagged employees"), valueCell(analysis.flaggedEmployees)],
    [labelCell("Flagged employee rate"), valueCell(flaggedPercent, "0.0%"), labelCell("Total findings"), valueCell(analysis.findings.length)],
    [sectionCell("Finding mix", 4)],
    [labelCell("Critical"), valueCell(analysis.counts.Critical), labelCell("Warning"), valueCell(analysis.counts.Warning)],
    [labelCell("Review"), valueCell(analysis.counts.Review), labelCell("Release guidance"), valueCell(
      analysis.decision === "READY"
        ? "No blocking findings detected. Complete approval before release."
        : "Resolve, document, approve, and re-run the payroll before release.",
    )],
    [sectionCell("Privacy and use", 4)],
    [{
      value: "This report was generated in the browser. Use synthetic or anonymized data for demonstrations. Findings support review and do not replace payroll-owner approval.",
      columnSpan: 4,
      wrap: true,
      textColor: "#49645D",
      backgroundColor: "#F7F8F5",
      height: 42,
    }],
  ];

  const findingHeaders = [
    "Audit ID",
    "Audit Date",
    "Audit Year",
    "Pay Period End",
    "Source File",
    "Decision",
    "Severity",
    "Employee ID(s)",
    "Employee",
    "Rule",
    "Evidence",
    "Recommended Action",
    "Assigned To",
    "Resolution Status",
    "Corrective Action / Adjustment",
    "Approval Reference",
    "Resolved Date",
    "Notes",
  ];

  const findingsLog: SheetData = [
    findingHeaders.map(headerCell),
    ...analysis.findings.map((finding) => [
      valueCell(auditId),
      valueCell(generatedAt, "yyyy-mm-dd hh:mm"),
      valueCell(generatedAt.getFullYear()),
      valueCell(period),
      valueCell(sourceFile),
      valueCell(analysis.decision),
      severityCell(finding.severity),
      valueCell(finding.employeeIds.join("; ")),
      valueCell(finding.employee),
      valueCell(finding.rule),
      valueCell(finding.evidence),
      valueCell(finding.action),
      valueCell(""),
      valueCell("Open"),
      valueCell(""),
      valueCell(""),
      valueCell(""),
      valueCell(""),
    ]),
  ];

  const auditRules: SheetData = [
    ["Rule Number", "Rule", "Description"].map(headerCell),
    ...AUDIT_RULES.map(([number, title, description]) => [
      valueCell(number),
      valueCell(title),
      valueCell(description),
    ]),
  ];

  const sheets: Sheet<Blob>[] = [
    {
      sheet: "Summary",
      data: summary,
      columns: [{ width: 27 }, { width: 36 }, { width: 27 }, { width: 44 }],
      showGridLines: false,
      zoomScale: 0.95,
    },
    {
      sheet: "Findings Log",
      data: findingsLog,
      columns: [
        { width: 22 }, { width: 19 }, { width: 12 }, { width: 20 }, { width: 30 }, { width: 12 },
        { width: 14 }, { width: 22 }, { width: 30 }, { width: 30 }, { width: 55 }, { width: 44 },
        { width: 22 }, { width: 20 }, { width: 38 }, { width: 24 }, { width: 18 }, { width: 38 },
      ],
      stickyRowsCount: 1,
      showGridLines: false,
      orientation: "landscape",
      zoomScale: 0.75,
    },
    {
      sheet: "Audit Rules",
      data: auditRules,
      columns: [{ width: 16 }, { width: 30 }, { width: 78 }],
      stickyRowsCount: 1,
      showGridLines: false,
      zoomScale: 0.9,
    },
  ];

  return { auditId, fileName: reportName, sheets };
}
