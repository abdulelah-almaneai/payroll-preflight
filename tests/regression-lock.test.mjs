// tests/regression-lock.test.mjs
// ============================================================================
// P0 REGRESSION LOCK — Payroll Preflight V1.0
// ----------------------------------------------------------------------------
// هذا الملف يُثبّت النتائج الأساسية للبيانات التجريبية (DEMO_ROWS) كعقد
// لا يمكن كسره. أي تعديل في المستقبل على:
//   - DEMO_ROWS (البيانات التجريبية)
//   - analyzePayroll (محرك التحليل)
//   - AUDIT_RULES (كتالوج القواعد)
// يجب أن يُبقي هذه الأرقام كما هي، وإلا يفشل الاختبار فوراً.
//
// المتطلبات: Node.js 22.18+ أو 24 (type stripping مفعّل افتراضياً).
// ============================================================================

import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzePayroll,
  AUDIT_RULES,
  DEMO_ROWS,
} from "../lib/payroll-audit.ts";

// ----------------------------------------------------------------------------
// العقد المرجعي — القيم المتوقعة من الـHandover
// أي تغيير هنا = قرار واعٍ، لا صدفة.
// ----------------------------------------------------------------------------
const EXPECTED = {
  rows: 13,
  uniqueEmployees: 12,
  totalNet: 144250,
  flaggedEmployees: 8,
  counts: { Critical: 5, Warning: 2, Review: 2 },
  decision: "HOLD",
  findings: [
    { severity: "Critical", rule: "Duplicate employee ID",        employeeIds: ["EMP-1007"] },
    { severity: "Critical", rule: "Net pay mismatch",             employeeIds: ["EMP-1008"] },
    { severity: "Critical", rule: "Non-positive net pay",         employeeIds: ["EMP-1009"] },
    { severity: "Critical", rule: "Net pay mismatch",             employeeIds: ["EMP-1009"] },
    { severity: "Critical", rule: "Post-termination payment",     employeeIds: ["EMP-1011"] },
    { severity: "Warning",  rule: "Shared bank account",          employeeIds: ["EMP-1005", "EMP-1006"] },
    { severity: "Warning",  rule: "Unexplained payroll variance", employeeIds: ["EMP-1009"] },
    { severity: "Review",   rule: "Documented payroll variance",  employeeIds: ["EMP-1010"] },
    { severity: "Review",   rule: "Missing bank account",         employeeIds: ["EMP-1012"] },
  ],
  ruleCodes: ["01", "02", "03", "04", "05", "06", "07"],
};

// ----------------------------------------------------------------------------
// 1) حجم البيانات التجريبية
// ----------------------------------------------------------------------------
test("P0 lock: synthetic demo has exactly 13 payroll rows", () => {
  assert.equal(DEMO_ROWS.length, EXPECTED.rows);
});

// ----------------------------------------------------------------------------
// 2) عدد الموظفين الفريدين
// ----------------------------------------------------------------------------
test("P0 lock: synthetic demo resolves to 12 unique employees", () => {
  const result = analyzePayroll(DEMO_ROWS);
  assert.equal(result.uniqueEmployees, EXPECTED.uniqueEmployees);
});

// ----------------------------------------------------------------------------
// 3) المجموع الصافي للرواتب
// ----------------------------------------------------------------------------
test("P0 lock: total net payroll equals SAR 144,250", () => {
  const result = analyzePayroll(DEMO_ROWS);
  assert.equal(result.totalNet, EXPECTED.totalNet);
});

// ----------------------------------------------------------------------------
// 4) عدد الموظفين المُعلَّمين (الذين ظهر لهم finding واحد على الأقل)
// ----------------------------------------------------------------------------
test("P0 lock: 8 employees are flagged", () => {
  const result = analyzePayroll(DEMO_ROWS);
  assert.equal(result.flaggedEmployees, EXPECTED.flaggedEmployees);
});

// ----------------------------------------------------------------------------
// 5) العدّادات والقرار النهائي
// ----------------------------------------------------------------------------
test("P0 lock: severity counts and transfer decision are frozen", () => {
  const result = analyzePayroll(DEMO_ROWS);
  assert.deepEqual(result.counts, EXPECTED.counts);
  assert.equal(result.decision, EXPECTED.decision);
  assert.equal(result.findings.length, EXPECTED.findings.length);
});

// ----------------------------------------------------------------------------
// 6) كل finding على حدة — الاسم والدليل والموظف
//    (هذا هو الفراغ الذي كانت الاختبارات السابقة لا تغطيه)
// ----------------------------------------------------------------------------
test("P0 lock: every finding is present with the expected severity, rule, and employee", () => {
  const result = analyzePayroll(DEMO_ROWS);

  const normalize = (finding) => ({
    severity: finding.severity,
    rule: finding.rule,
    employeeIds: [...finding.employeeIds].sort(),
  });

  const actual = result.findings.map(normalize);
  const expected = EXPECTED.findings.map(normalize);

  assert.deepEqual(actual, expected);
});

// ----------------------------------------------------------------------------
// 7) كتالوج القواعد — 7 قواعد بأكواد ثابتة (Rule Codes)
// ----------------------------------------------------------------------------
test("P0 lock: audit rule catalog keeps 7 stable codes", () => {
  assert.equal(AUDIT_RULES.length, 7);
  assert.deepEqual(
    AUDIT_RULES.map(([code]) => code),
    EXPECTED.ruleCodes,
  );
});
