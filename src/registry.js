"use strict";

const path = require("path");

const ROOT = path.join(__dirname, "..");

// Single source of truth: type ID -> template, schema, output naming, page setup.
// Adding a new document type = add one entry here + one template + one schema.
const REGISTRY = {
  "offer-letter": {
    label: "Offer Letter",
    template: "offer-letter.html",
    schema: "offer-letter.schema.json",
    outPrefix: "OfferLetter",
    landscape: false,
  },
  "appointment-letter": {
    label: "Appointment Letter",
    template: "appointment-letter.html",
    schema: "appointment-letter.schema.json",
    outPrefix: "AppointmentLetter",
    landscape: false,
  },
  "joining-letter": {
    label: "Joining Letter",
    template: "joining-letter.html",
    schema: "joining-letter.schema.json",
    outPrefix: "JoiningLetter",
    landscape: false,
  },
  "welcome-kit": {
    label: "Welcome Kit",
    template: "welcome-kit.html",
    schema: "welcome-kit.schema.json",
    outPrefix: "WelcomeKit",
    landscape: false,
  },
  "hike-letter": {
    label: "Hike / Increment Letter",
    template: "hike-letter.html",
    schema: "hike-letter.schema.json",
    outPrefix: "HikeLetter",
    landscape: false,
  },
  "salary-structure": {
    label: "Salary Structure",
    template: "salary-structure.html",
    schema: "salary-structure.schema.json",
    outPrefix: "SalaryStructure",
    landscape: false,
  },
  payslip: {
    label: "Payslip",
    template: "payslip.html",
    schema: "salary-structure.schema.json",
    outPrefix: "Payslip",
    landscape: false,
  },
  "experience-letter": {
    label: "Experience Certificate",
    template: "experience-letter.html",
    schema: "experience-letter.schema.json",
    outPrefix: "ExperienceLetter",
    landscape: false,
  },
  "internship-certificate": {
    label: "Internship Certificate",
    template: "internship-certificate.html",
    schema: "internship-certificate.schema.json",
    outPrefix: "InternshipCertificate",
    landscape: true,
  },
  "course-certificate": {
    label: "Course Completion Certificate",
    template: "course-certificate.html",
    schema: "course-certificate.schema.json",
    outPrefix: "CourseCertificate",
    landscape: true,
  },
  "appreciation-certificate": {
    label: "Appreciation Certificate (A&B)",
    template: "appreciation-certificate.html",
    schema: "appreciation-certificate.schema.json",
    outPrefix: "AppreciationCertificate",
    landscape: true,
  },
};

const ONBOARDING_KIT_TYPES = [
  "offer-letter",
  "appointment-letter",
  "joining-letter",
  "welcome-kit",
];

function getTypeConfig(typeId) {
  const config = REGISTRY[typeId];
  if (!config) {
    const known = Object.keys(REGISTRY).join(", ");
    throw new Error(`Unknown document type "${typeId}". Known types: ${known}`);
  }
  return config;
}

function listTypes() {
  return Object.entries(REGISTRY).map(([id, cfg]) => ({ id, label: cfg.label }));
}

module.exports = {
  REGISTRY,
  ONBOARDING_KIT_TYPES,
  ROOT,
  getTypeConfig,
  listTypes,
};
