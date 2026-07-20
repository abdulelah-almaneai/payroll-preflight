export type Severity = "Critical" | "Warning" | "Review";

export type PayrollRow = {
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
  varianceReason?: string;
};

export type Finding = {
  id: string;
  severity: Severity;
  employeeIds: string[];
  employee: string;
  rule: string;
  evidence: string;
  action: string;
};

export const DEMO_ROWS: PayrollRow[] = [
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
  { sourceIndex: 11, employeeId: "EMP-1010", employeeName: "Rana Nasser", bankAccount: "SA-1110", grossPay: 21000, deductions: 2900, netPay: 18100, previousNetPay: 8100, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31", varianceReason: "Annual leave salary paid in advance" },
  { sourceIndex: 12, employeeId: "EMP-1011", employeeName: "Maha Al-Harbi", bankAccount: "SA-1111", grossPay: 16000, deductions: 1800, netPay: 14200, previousNetPay: 14100, status: "Terminated", terminationDate: "2026-06-30", payPeriodEnd: "2026-07-31" },
  { sourceIndex: 13, employeeId: "EMP-1012", employeeName: "Ziad Omar", bankAccount: "", grossPay: 12500, deductions: 1200, netPay: 11300, previousNetPay: 11200, status: "Active", terminationDate: "", payPeriodEnd: "2026-07-31" },
];

export const AUDIT_RULES = [
  ["01", "Duplicate identity", "Flags repeated employee IDs before totals are approved."],
  ["02", "Shared bank account", "Finds one account assigned to different employees."],
  ["03", "Net pay mismatch", "Reconciles gross pay, deductions, and net pay."],
  ["04", "Non-positive net pay", "Stops zero or negative employee payments for review."],
  ["05", "Period variance", "Surfaces movements of 35% or more and preserves documented reasons."],
  ["06", "Employment status", "Checks payments against termination dates and status."],
  ["07", "Payment readiness", "Catches missing destination bank-account details."],
] as const;

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
  "variance_reason",
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
  varianceReason: ["variance_reason", "change_reason", "payroll_note", "exception_reason"],
};

export function formatSar(value: number) {
  return "SAR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function csvCell(value: string | number) {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

export function rowsToCsv(rows: PayrollRow[]) {
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
      row.varianceReason ?? "",
    ].map(csvCell).join(",")
  );
  return HEADERS.join(",") + "\n" + lines.join("\n");
}

export function excelCompatibleCsv(text: string) {
  const windowsLines = text.replace(/\r?\n/g, "\r\n");
  return "\uFEFFsep=,\r\n" + windowsLines;
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
  const trimmed = value.trim();
  const negativeByParentheses = /^\(.*\)$/.test(trimmed);
  const normalized = trimmed.replace(/[^0-9.-]+/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return negativeByParentheses ? -Math.abs(parsed) : parsed;
}

function cellToString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

export function parsePayrollTable(inputRows: readonly (readonly unknown[])[]) {
  const rawRows = inputRows
    .map((row) => row.map(cellToString))
    .filter((row) => row.some((cell) => cell !== ""));

  if (rawRows.length < 2) {
    throw new Error("The payroll file needs a header row and at least one payroll record.");
  }

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
    varianceReason: indexFor("varianceReason"),
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
      varianceReason: valueAt(row, indexes.varianceReason),
    } satisfies PayrollRow;
  });
}

export function parsePayrollCsv(text: string) {
  const rows = tokenizeCsv(text);
  const firstCell = rows[0]?.[0]?.replace(/^\uFEFF/, "").trim().toLowerCase();
  if (firstCell === "sep=") rows.shift();
  return parsePayrollTable(rows);
}

export function analyzePayroll(rows: PayrollRow[]) {
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
        const documentedReason = row.varianceReason?.trim();
        add({
          id: "variance-" + row.sourceIndex,
          severity: documentedReason ? "Review" : "Warning",
          employeeIds: [row.employeeId],
          employee: row.employeeName + " · " + row.employeeId,
          rule: documentedReason ? "Documented payroll variance" : "Unexplained payroll variance",
          evidence: "Net pay changed " + Math.abs(variance).toFixed(1) + "% from the prior period" +
            (documentedReason ? ". Reason: " + documentedReason : ""),
          action: documentedReason
            ? "Verify supporting evidence and approval before release"
            : "Identify the cause and validate one-time earnings or deductions",
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
  const decision = counts.Critical > 0
    ? "HOLD"
    : counts.Warning > 0 || counts.Review > 0
      ? "REVIEW"
      : "READY";

  return {
    findings,
    counts,
    uniqueEmployees: new Set(rows.map((row) => row.employeeId)).size,
    flaggedEmployees: flaggedIds.size,
    totalNet,
    decision,
  };
}
