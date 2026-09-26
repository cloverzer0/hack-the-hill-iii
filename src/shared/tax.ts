// 2024 tax year estimate. Every number here is sourced in VERIFIED_SOURCES.md.
// Assumes all income is employment income and ignores credits other than the ones below.

type Bracket = { upTo: number; rate: number }

export type TaxEstimate = { federal: number; provincial: number; total: number; effectiveRate: number }

type ProvinceRules = { brackets: Bracket[]; basicPersonalAmount: number }

const federalBrackets: Bracket[] = [
  { upTo: 55_867, rate: 0.15 },
  { upTo: 111_733, rate: 0.205 },
  { upTo: 173_205, rate: 0.26 },
  { upTo: 246_752, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
]

// The federal basic personal amount shrinks from max to min between these two incomes.
const federalBpa = { max: 15_705, min: 14_156, phaseStart: 173_205, phaseEnd: 246_752 }
const canadaEmploymentAmount = 1_433

// CPP is charged on earnings between the exemption and the YMPE; CPP2 on earnings between the YMPE and the YAMPE.
const cpp = { exemption: 3_500, ympe: 68_500, yampe: 73_200, baseRate: 0.0495, enhancedRate: 0.01, cpp2Rate: 0.04 }
const ei = { rate: 0.0166, maxInsurable: 63_200 }

// Only provinces verified so far. Others are added once checked against their T4032 page.
export const provinces: Record<string, ProvinceRules> = {
  ON: {
    basicPersonalAmount: 12_399,
    brackets: [
      { upTo: 51_446, rate: 0.0505 },
      { upTo: 102_894, rate: 0.0915 },
      { upTo: 150_000, rate: 0.1116 },
      { upTo: 220_000, rate: 0.1216 },
      { upTo: Infinity, rate: 0.1316 },
    ],
  },
}

/**
 * Purpose:
 *	Keep a number inside a range.
 *
 * Args:
 *	- value: the number to limit
 *	- min: the lowest allowed value
 *	- max: the highest allowed value
 *
 * Returns:
 *	number: value, raised to min or lowered to max if it falls outside the range
 */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Purpose:
 *	Apply progressive brackets, where each rate only taxes the slice of income inside its bracket.
 *
 * Args:
 *	- income: taxable income in dollars
 *	- brackets: brackets sorted from lowest to highest, the last one ending at Infinity
 *
 * Returns:
 *	number: tax in dollars before any credits
 */
function taxFromBrackets(income: number, brackets: Bracket[]) {
  let tax = 0
  let lower = 0
  for (const { upTo, rate } of brackets) {
    tax += Math.max(0, Math.min(income, upTo) - lower) * rate
    lower = upTo
  }
  return tax
}

/**
 * Purpose:
 *	Work out the CPP and EI an employee pays, split by how each one lowers income tax.
 *
 * Args:
 *	- income: yearly employment income in dollars
 *
 * Returns:
 *	object: cppBase (becomes a credit), cppDeduction (enhanced CPP + CPP2, comes off income), ei (becomes a credit)
 */
function payrollContributions(income: number) {
  const pensionable = clamp(income, cpp.exemption, cpp.ympe) - cpp.exemption
  return {
    cppBase: pensionable * cpp.baseRate,
    cppDeduction: pensionable * cpp.enhancedRate + (clamp(income, cpp.ympe, cpp.yampe) - cpp.ympe) * cpp.cpp2Rate,
    ei: Math.min(income, ei.maxInsurable) * ei.rate,
  }
}

/**
 * Purpose:
 *	Get the federal basic personal amount, which shrinks for high incomes.
 *
 * Args:
 *	- income: yearly income in dollars
 *
 * Returns:
 *	number: the basic personal amount in dollars, between 14,156 and 15,705
 */
function federalBasicPersonalAmount(income: number) {
  const phase = clamp((income - federalBpa.phaseStart) / (federalBpa.phaseEnd - federalBpa.phaseStart), 0, 1)
  return federalBpa.max - (federalBpa.max - federalBpa.min) * phase
}

/**
 * Purpose:
 *	Estimate 2024 federal and provincial income tax for an employee. Runs in the browser so income never leaves the device.
 *
 * Args:
 *	- income: yearly employment income in dollars
 *	- province: two-letter province or territory code, e.g. 'ON'
 *
 * Returns:
 *	TaxEstimate: federal, provincial and total tax in whole dollars, and effectiveRate as total ÷ income (0.17 = 17%)
 */
export function estimateTax(income: number, province: string): TaxEstimate {
  const rules = provinces[province]
  if (!rules) throw new Error(`No 2024 tax rules for province "${province}" yet`)
  if (!(income > 0)) return { federal: 0, provincial: 0, total: 0, effectiveRate: 0 }

  const { cppBase, cppDeduction, ei } = payrollContributions(income)
  const taxable = income - cppDeduction

  // Non-refundable credits are worth the lowest bracket rate times the credit amount.
  const federalCredits = federalBrackets[0].rate * (federalBasicPersonalAmount(income) + Math.min(canadaEmploymentAmount, income) + cppBase + ei)
  const federal = Math.max(0, taxFromBrackets(taxable, federalBrackets) - federalCredits)

  const provincialCredits = rules.brackets[0].rate * (rules.basicPersonalAmount + cppBase + ei)
  const provincial = Math.max(0, taxFromBrackets(taxable, rules.brackets) - provincialCredits)

  const total = federal + provincial
  return { federal: Math.round(federal), provincial: Math.round(provincial), total: Math.round(total), effectiveRate: total / income }
}
