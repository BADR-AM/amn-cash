"""Synthetic/reference fee implementation. Not a production ledger or proof of funds."""
from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal('0.01')

def money(value):
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)

def cashout_fee(amount_egp, fee_per_1000_egp='50', cost_per_1000_egp='10'):
    amount = Decimal(str(amount_egp))
    if not amount.is_finite() or amount <= 0:
        raise ValueError('Amount must be positive and finite')
    fee_rate, cost_rate = Decimal(str(fee_per_1000_egp)), Decimal(str(cost_per_1000_egp))
    if any((not d.is_finite() or d < 0) for d in (fee_rate, cost_rate)):
        raise ValueError('Rates must be non-negative and finite')
    factor = amount / Decimal('1000')
    fee, cost = money(factor * fee_rate), money(factor * cost_rate)
    return {'fee': fee, 'estimated_cost': cost, 'estimated_profit': fee - cost}
