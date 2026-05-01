/**
 * Healthcare cost projection — pure math used by the retirement page.
 *
 * Methodology (Thai context):
 *   - Take user's current monthly health expense baseline
 *   - Inflate at `inflationPct` per year between now and retirement (drug
 *     prices + procedure costs in TH have run ~5-7%/yr historically)
 *   - Apply an "age multiplier" that ramps spending up after 65 — empirical
 *     studies show retirees spend 1.5-2× their 50-yr-old baseline
 *   - Sum monthly projected spend over expected lifespan past retirement
 *
 * Returns the present-value lump sum needed at retirement to cover those
 * costs, assuming a `realReturnPct` post-retirement portfolio yield.
 */

export interface HealthcareInput {
  currentAge: number;
  retirementAge: number;
  expectedLifespan: number; // assumed end-of-life age (TH avg ~78)
  currentMonthlyHealthExpense: number;
  inflationPct: number; // annual, default 5 if user doesn't supply
  realReturnPct: number; // post-retirement real return, default 2
}

export interface HealthcareProjection {
  projectedMonthlyAtRetirement: number;
  totalLifetimeCost: number; // nominal, undiscounted
  presentValueAtRetirement: number; // discounted using realReturnPct
  yearsOfRetirement: number;
}

const POST_65_AGE_MULTIPLIER = 1.7; // empirical Thai healthcare ramp

export function projectHealthcare(input: HealthcareInput): HealthcareProjection {
  const {
    currentAge,
    retirementAge,
    expectedLifespan,
    currentMonthlyHealthExpense,
    inflationPct,
    realReturnPct,
  } = input;

  if (
    !Number.isFinite(currentAge) ||
    !Number.isFinite(retirementAge) ||
    !Number.isFinite(expectedLifespan) ||
    retirementAge <= currentAge ||
    expectedLifespan <= retirementAge ||
    currentMonthlyHealthExpense < 0
  ) {
    return {
      projectedMonthlyAtRetirement: 0,
      totalLifetimeCost: 0,
      presentValueAtRetirement: 0,
      yearsOfRetirement: 0,
    };
  }

  const yearsToRetirement = retirementAge - currentAge;
  const yearsOfRetirement = expectedLifespan - retirementAge;

  // Inflate the baseline forward to retirement
  const infl = (inflationPct || 0) / 100;
  const inflatedBase =
    currentMonthlyHealthExpense * Math.pow(1 + infl, yearsToRetirement);

  // Ramp post-65 spending; if retirement age >= 65 we apply right away
  const projectedMonthlyAtRetirement =
    retirementAge >= 65
      ? inflatedBase * POST_65_AGE_MULTIPLIER
      : inflatedBase;

  // Sum monthly inflated spend over yearsOfRetirement, then discount
  // back to retirement-day at realReturnPct (an annuity present value).
  const realRate = (realReturnPct || 0) / 100;
  const months = yearsOfRetirement * 12;
  const monthlyReal = realRate / 12;

  let totalLifetimeCost = 0;
  let presentValueAtRetirement = 0;
  for (let m = 1; m <= months; m++) {
    // Each month inflate further at infl/12 from retirement onwards
    const monthlyAtMonthM =
      projectedMonthlyAtRetirement * Math.pow(1 + infl / 12, m - 1);
    totalLifetimeCost += monthlyAtMonthM;
    presentValueAtRetirement +=
      monthlyAtMonthM / Math.pow(1 + monthlyReal, m - 1);
  }

  return {
    projectedMonthlyAtRetirement: round2(projectedMonthlyAtRetirement),
    totalLifetimeCost: round2(totalLifetimeCost),
    presentValueAtRetirement: round2(presentValueAtRetirement),
    yearsOfRetirement,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
