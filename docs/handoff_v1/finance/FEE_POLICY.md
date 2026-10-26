# Fee Rules — User-defined Defaults, Not Vodafone Tariff

Currency: Egyptian pound (EGP), base storage unit **piaster**.

Default pro-rata chargeable service rule **only for explicitly classified cash-out service**:
- `fee_piasters_per_1000 = 5000` (EGP 50).
- `estimated_cost_piasters_per_1000 = 1000` (EGP 10).
- estimated profit per EGP 1000 = EGP 40.
- `PRO_RATA` rounding to nearest piaster, HALF_UP for fee and cost independently.

Example EGP 1500: fee 75.00, cost 15.00, estimated profit 60.00.

Do **not** automatically treat any incoming or outgoing wallet SMS as a cash-out service; categorization needs explicit business event or reviewed proof. Source SMS is an observation not a settlement record.

Each applied chargeable transaction stores the exact immutable version of the rule plus fee, estimated cost and profit snapshot; a rule change takes effect only after explicit user approval and date/time. Cash expenses settled from ATM may differ from the default cost; actual profit is separately derived from verified fees and settled actual expenses.

Financial flow for deposits/withdrawal must be clarified with business owner before implementing double-entry ledger entries. Do not infer it from SMS direction.
