# Wallet Admin installment amounts

Finance winnings can contain historical split payments. For PS-616, the two
installments are $2,760 and $920, while each installment repeats the full $3,680
in `totalAmount`.

Wallet Admin uses the winning-level `grossAmount` supplied by Finance for the
list, payment details summary and edit form. If that field is unavailable, it
sums the returned installment `grossAmount` values, rounded to cents. It never
adds the repeated `totalAmount` fields or billing markup. Finance returns all
current installment rows, ordered with installment 1 first. Separate payment
rows sharing an installment number are preserved because versions protect
in-place updates rather than identifying historical copies.

The General Info tab displays each installment's amount and status when there
is more than one installment. The amount is the historical gross face value,
including any cancelled installments; individual statuses remain visible in
the breakdown. Primary-installment status/date behavior and payment mutations
are unchanged. Member Wallet already displays the full `totalAmount`; its
withdrawal flow is unchanged by this display correction.

Deploy the companion Finance PS-616 change before the platform-ui change to
provide the complete installment data. An older API that only returns the first
installment cannot supply the omitted amount to the UI fallback. Finance CSV
exports use the same winning-level gross summary.

Regression tests cover the $2,760 + $920 split with and without the summary field,
the amount passed to the details modal, single-installment amounts with billing
markup, and paid/cancelled installment breakdowns.
