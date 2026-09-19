"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateData } = require("../src/validate");

test("valid offer-letter data passes", () => {
  assert.equal(
    validateData("offer-letter", {
      employeeId: "EMP001",
      candidateName: "Rahul Sharma",
      designation: "Software Engineer",
      department: "Engineering",
      dateOfJoining: "2026-08-11",
      workLocation: "Remote",
      annualCtc: 1200000,
      offerValidTill: "2026-08-04",
      letterDate: "2026-07-27",
    }),
    true
  );
});

test("missing required field produces a friendly error message", () => {
  assert.throws(
    () =>
      validateData("offer-letter", {
        employeeId: "EMP001",
        designation: "Software Engineer",
        department: "Engineering",
        dateOfJoining: "2026-08-11",
        workLocation: "Remote",
        annualCtc: 1200000,
        offerValidTill: "2026-08-04",
        letterDate: "2026-07-27",
      }),
    /candidateName is required for offer-letter/
  );
});

test("unknown type throws a clear error", () => {
  assert.throws(
    () => validateData("not-a-real-type", {}),
    /Unknown document type/
  );
});
