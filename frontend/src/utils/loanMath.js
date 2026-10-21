export const FREQUENCY_OPTIONS = [
  { value: 1, label: "Monthly" },
  { value: 3, label: "Every 3 Months" },
  { value: 6, label: "Every 6 Months" },
  { value: 12, label: "Yearly" },
];

export function calculateEmi(principal, annualRatePct, tenureYears, frequencyMonths = 1) {
  const P = parseFloat(principal);
  const annualRate = parseFloat(annualRatePct);
  const years = parseFloat(tenureYears);
  const freq = parseInt(frequencyMonths, 10) || 1;
  if (!P || P <= 0 || !years || years <= 0 || !annualRate || annualRate < 0) {
    return { emi: 0, totalPayment: 0, totalInterest: 0, months: Math.round((years || 0) * 12), numPayments: 0 };
  }
  const months = Math.round(years * 12);
  const numPayments = Math.max(Math.round(months / freq), 1);
  const monthlyRate = annualRate / 12 / 100;
  const periodRate = Math.pow(1 + monthlyRate, freq) - 1;
  const emi =
    periodRate === 0
      ? P / numPayments
      : (P * periodRate * Math.pow(1 + periodRate, numPayments)) /
        (Math.pow(1 + periodRate, numPayments) - 1);
  const totalPayment = emi * numPayments;
  const totalInterest = totalPayment - P;
  return { emi, totalPayment, totalInterest, months, numPayments };
}

/** The interest-only payment over one period — the floor an installment must clear to amortize at all. */
export function periodInterestOnly(principal, annualRatePct, frequencyMonths = 1) {
  const P = parseFloat(principal) || 0;
  const annualRate = parseFloat(annualRatePct) || 0;
  const freq = parseInt(frequencyMonths, 10) || 1;
  const monthlyRate = annualRate / 12 / 100;
  const periodRate = Math.pow(1 + monthlyRate, freq) - 1;
  return P * periodRate;
}

// Backwards-compatible alias for monthly-only call sites.
export function monthlyInterestOnly(principal, annualRatePct) {
  return periodInterestOnly(principal, annualRatePct, 1);
}
