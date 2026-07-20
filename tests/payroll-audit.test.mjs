import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzePayroll,
  DEMO_ROWS,
  excelCompatibleCsv,
  parsePayrollCsv,
  parsePayrollTable,
} from "../lib/payroll-audit.ts";

function cleanRow(overrides = {}) {
  return {
    sourceIndex: 1,
    employeeId: "EMP-CLEAN",
    employeeName: "Clean Employee",
    bankAccount: "SA-CLEAN",
    grossPay: 10000,
    deductions: 1000,
    netPay: 9000,
    previousNetPay: 9000,
    status: "Active",
    terminationDate: "",
    payPeriodEnd: "2026-07-31",
    varianceReason: "",
    ...overrides,
  };
}

test("synthetic demo exercises every audit severity", () => {
  const result = analyzePayroll(DEMO_ROWS);

  assert.equal(result.decision, "HOLD");
  assert.deepEqual(result.counts, { Critical: 5, Warning: 2, Review: 2 });
  assert.equal(result.findings.length, 9);
  assert.match(
    result.findings.find((finding) => finding.rule === "Documented payroll variance")?.evidence ?? "",
    /Annual leave salary paid in advance/,
  );
});

test("clean payroll is ready for release", () => {
  const result = analyzePayroll([cleanRow()]);

  assert.equal(result.decision, "READY");
  assert.equal(result.findings.length, 0);
});

test("review findings prevent a ready decision", () => {
  const result = analyzePayroll([cleanRow({ bankAccount: "" })]);

  assert.equal(result.decision, "REVIEW");
  assert.equal(result.counts.Review, 1);
});

test("documented variance remains reviewable instead of being auto-cleared", () => {
  const result = analyzePayroll([
    cleanRow({ netPay: 15000, grossPay: 16000, varianceReason: "Approved leave salary advance" }),
  ]);

  assert.equal(result.decision, "REVIEW");
  assert.equal(result.findings[0].severity, "Review");
  assert.equal(result.findings[0].rule, "Documented payroll variance");
});

test("unexplained variance produces a warning", () => {
  const result = analyzePayroll([
    cleanRow({ netPay: 15000, grossPay: 16000 }),
  ]);

  assert.equal(result.decision, "REVIEW");
  assert.equal(result.findings[0].severity, "Warning");
  assert.equal(result.findings[0].rule, "Unexplained payroll variance");
});

test("CSV parser accepts aliases and accounting negatives", () => {
  const rows = parsePayrollCsv([
    "employee_number,full_name,iban,gross_salary,total_deductions,net_salary,last_net_pay,payroll_note",
    "E-1,Example Employee,SA-1,10000,10500,(500),9000,Recovery adjustment",
  ].join("\n"));

  assert.equal(rows[0].employeeId, "E-1");
  assert.equal(rows[0].netPay, -500);
  assert.equal(rows[0].varianceReason, "Recovery adjustment");
});

test("Excel-friendly CSV opens in columns and can be uploaded again", () => {
  const csv = excelCompatibleCsv([
    "employee_id,gross_pay,deductions,net_pay",
    "E-EXCEL,10000,1000,9000",
  ].join("\n"));

  assert.match(csv, /^\uFEFFsep=,\r\n/);
  assert.equal(parsePayrollCsv(csv)[0].employeeId, "E-EXCEL");
});

test("Excel-style table parser normalizes dates, numeric cells, and blanks", () => {
  const rows = parsePayrollTable([
    ["employee_id", "employee_name", "gross_pay", "deductions", "net_pay", "pay_period_end"],
    ["E-2", null, 12000, 1200, 10800, new Date("2026-07-31T00:00:00.000Z")],
  ]);

  assert.equal(rows[0].employeeName, "E-2");
  assert.equal(rows[0].grossPay, 12000);
  assert.equal(rows[0].payPeriodEnd, "2026-07-31");
});

test("parser reports missing required columns", () => {
  assert.throws(
    () => parsePayrollCsv("employee_id,net_pay\nE-3,1000"),
    /Missing required columns: gross_pay, deductions/,
  );
});
