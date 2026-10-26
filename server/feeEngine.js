/**
 * Deterministic Fee Engine for AMN Cash
 * Base financial unit is piaster (1 EGP = 100 piasters) to prevent IEEE 754 floating point issues.
 * Complies with tests/test_fee_reference.py and finance/FEE_POLICY.md
 */

export function calculateFees(amountPiasters, rates = { feePer1000Piasters: 5000, costPer1000Piasters: 1000 }) {
  if (typeof amountPiasters !== 'number' || amountPiasters <= 0 || !Number.isInteger(amountPiasters)) {
    throw new Error('Amount must be a positive integer in piasters');
  }

  const { feePer1000Piasters, costPer1000Piasters } = rates;

  // Pro-rata rounding half-up
  const feePiasters = Math.round((amountPiasters * feePer1000Piasters) / 100000);
  const costPiasters = Math.round((amountPiasters * costPer1000Piasters) / 100000);
  const profitPiasters = feePiasters - costPiasters;

  return {
    amountPiasters,
    feePiasters,
    costPiasters,
    profitPiasters,
    // Human readable EGP values
    amountEGP: amountPiasters / 100,
    feeEGP: feePiasters / 100,
    costEGP: costPiasters / 100,
    profitEGP: profitPiasters / 100,
  };
}
