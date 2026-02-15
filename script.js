const form = document.getElementById('payroll-form');
const resultsSection = document.getElementById('results');

const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function computeTax(income, regime, deductions) {
  const standardDeduction = 50000;
  let taxableIncome = Math.max(0, income - standardDeduction);

  if (regime === 'old') {
    taxableIncome = Math.max(0, taxableIncome - deductions);
  }

  const slabs =
    regime === 'new'
      ? [
          [300000, 0],
          [300000, 0.05],
          [300000, 0.1],
          [300000, 0.15],
          [300000, 0.2],
          [Infinity, 0.3],
        ]
      : [
          [250000, 0],
          [250000, 0.05],
          [500000, 0.2],
          [Infinity, 0.3],
        ];

  let tax = 0;
  let remainder = taxableIncome;

  for (const [slabLimit, rate] of slabs) {
    if (remainder <= 0) break;
    const slabAmount = Math.min(remainder, slabLimit);
    tax += slabAmount * rate;
    remainder -= slabAmount;
  }

  const cess = tax * 0.04;
  return tax + cess;
}

function fill(id, value) {
  document.getElementById(id).textContent = formatter.format(value);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const annualCtc = Number(document.getElementById('annualCtc').value);
  const bonusPct = Number(document.getElementById('bonusPct').value) / 100;
  const regime = document.getElementById('regime').value;
  const deduction80c = Number(document.getElementById('deduction80c').value);
  const otherDeductions = Number(document.getElementById('otherDeductions').value);

  const annualBonus = annualCtc * bonusPct;
  const fixedAnnual = annualCtc - annualBonus;

  const basicAnnual = fixedAnnual * 0.4;
  const hraAnnual = basicAnnual * 0.4;

  const employerPfAnnual = basicAnnual * 0.12;
  const employeePfAnnual = basicAnnual * 0.12;

  const specialAllowanceAnnual = Math.max(0, fixedAnnual - (basicAnnual + hraAnnual + employerPfAnnual));

  const grossAnnualIncome = basicAnnual + hraAnnual + specialAllowanceAnnual + annualBonus;
  const totalDeductions = deduction80c + otherDeductions;
  const annualTax = computeTax(grossAnnualIncome, regime, totalDeductions);

  const monthlyGross = grossAnnualIncome / 12;
  const professionalTaxMonthly = 200;
  const tdsMonthly = annualTax / 12;
  const employeePfMonthly = employeePfAnnual / 12;
  const netMonthly = monthlyGross - employeePfMonthly - professionalTaxMonthly - tdsMonthly;
  const employerMonthlyCost = (fixedAnnual + employerPfAnnual + annualBonus) / 12;

  document.getElementById('employeeHeading').textContent = `For ${name || 'employee'} (${regime.toUpperCase()} regime):`;
  fill('basicMonthly', basicAnnual / 12);
  fill('hraMonthly', hraAnnual / 12);
  fill('specialMonthly', specialAllowanceAnnual / 12);
  fill('employeePf', employeePfMonthly);
  fill('professionalTax', professionalTaxMonthly);
  fill('tdsMonthly', tdsMonthly);
  fill('netMonthly', netMonthly);
  fill('employerMonthly', employerMonthlyCost);

  resultsSection.hidden = false;
});
