import assert from "node:assert/strict";
import test from "node:test";

import readXlsxFile from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";

import { buildExcelAuditReport } from "../lib/excel-report.ts";
import { analyzePayroll, DEMO_ROWS } from "../lib/payroll-audit.ts";

const generatedAt = new Date("2026-07-20T09:30:45.000Z");
const AUDIT_RULE_COUNT = 7;

test("Excel audit report contains summary, annual findings log, and audit rules", async () => {
  const analysis = analyzePayroll(DEMO_ROWS);
  const report = buildExcelAuditReport({
    rows: DEMO_ROWS,
    analysis,
    sourceFile: "payroll-preflight-sample.xlsx",
    generatedAt,
  });

  assert.equal(report.fileName, "payroll-preflight-audit-2026-07-31.xlsx");
  assert.equal(report.sheets.length, 3);
  assert.deepEqual(report.sheets.map((sheet) => sheet.sheet), ["Summary", "Findings Log", "Audit Rules"]);
  assert.deepEqual(report.sheets.map((sheet) => sheet.zoomScale), [0.95, 0.75, 0.9]);
  assert.ok(report.sheets.every((sheet) => sheet.zoomScale >= 0.1 && sheet.zoomScale <= 4));

  const buffer = await writeExcelFile(report.sheets).toBuffer();
  assert.ok(buffer.byteLength > 5_000);

  const workbook = await readXlsxFile(buffer, { trim: false });
  const summary = workbook.find(({ sheet }) => sheet === "Summary")?.data;
  const findings = workbook.find(({ sheet }) => sheet === "Findings Log")?.data;
  const rules = workbook.find(({ sheet }) => sheet === "Audit Rules")?.data;

  assert.ok(summary);
  assert.ok(findings);
  assert.ok(rules);

  assert.equal(summary[0][0], "Payroll Preflight Audit Report");
  assert.ok(summary.flat().includes("HOLD"));
  assert.ok(summary.flat().includes(144250));

  assert.equal(findings[0][0], "Audit ID");
  assert.equal(findings[0][13], "Resolution Status");
  assert.equal(findings[0][15], "Approval Reference");
  assert.equal(findings.length, analysis.findings.length + 1);
  assert.ok(findings.slice(1).every((row) => row[13] === "Open"));
  assert.ok(findings.slice(1).some((row) => row[6] === "Critical"));

  assert.equal(rules.length, AUDIT_RULE_COUNT + 1);
  assert.equal(rules[0][0], "Rule Number");
});
