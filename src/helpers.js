"use strict";

const ONES = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one === 0 ? TENS[ten] : `${TENS[ten]} ${ONES[one]}`;
}

function threeDigitsToWords(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundred > 0) parts.push(`${ONES[hundred]} Hundred`);
  if (rest > 0) parts.push(twoDigitsToWords(rest));
  return parts.join(" ");
}

// Indian numbering system: crore / lakh / thousand / hundred.
function numberToIndianWords(amount) {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return "Zero";

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts = [];
  if (crore > 0) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh > 0) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred > 0) parts.push(threeDigitsToWords(hundred));

  return parts.join(" ");
}

function amountInWords(amount) {
  return `Rupees ${numberToIndianWords(amount)} Only`;
}

// en-IN grouping (lakh/crore commas): 1200000 -> "12,00,000"
function formatIndianNumber(amount) {
  const n = Math.round(Number(amount) || 0);
  const isNegative = n < 0;
  const s = Math.abs(n).toString();
  let result;
  if (s.length <= 3) {
    result = s;
  } else {
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    result = `${grouped},${last3}`;
  }
  return isNegative ? `-${result}` : result;
}

function formatCurrency(amount) {
  return `₹${formatIndianNumber(amount)}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Accepts "YYYY-MM-DD" and renders "27 July 2026". Parsed manually (not via
// `new Date(str)`) so the date is never shifted by the local timezone offset.
function formatDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = String(isoDate).split("-").map(Number);
  if (!year || !month || !day) return String(isoDate);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

// Accepts "YYYY-MM" and renders "July 2026".
function formatMonthYear(isoMonth) {
  if (!isoMonth) return "";
  const [year, month] = String(isoMonth).split("-").map(Number);
  if (!year || !month) return String(isoMonth);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

module.exports = {
  numberToIndianWords,
  amountInWords,
  formatIndianNumber,
  formatCurrency,
  formatDate,
  formatMonthYear,
};
