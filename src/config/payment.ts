/**
 * Customer-facing payment policy. Bump `version` whenever any wording here changes: the version a
 * customer accepted is stored with their project as evidence.
 */
export const paymentTerms = {
  version: "2026-09-29",
  /** Shown before Checkout, next to the acceptance checkbox, for packages with a later balance. */
  authorizationSplit:
    "By placing this order, you authorize the initial project payment shown today. You also authorize Northframe to securely save your payment method with Stripe and attempt to charge the remaining balance after the included revision stage is completed. Launch, transfer, or delivery happens only after the remaining balance has been paid.",
  /** Same, for a package paid in full. */
  authorizationFull:
    "By placing this order, you authorize the project payment shown today. Your card details are handled by Stripe and are never stored by Northframe.",
  /** Short version shown on the Stripe-hosted Checkout page. */
  checkoutSplit:
    "You authorize this payment now and a charge of the remaining balance to this saved payment method after the included revision stage. Launch or delivery happens only after the balance is paid.",
  checkoutFull: "You authorize this payment now.",
  cancellation: {
    title: "3-Day Project Cancellation Policy",
    body: "You may request cancellation within three calendar days of your initial payment, according to the terms on the Terms page. After that period, or once work has progressed beyond what the policy allows, the initial payment may be non-refundable. Any refund is issued back through Stripe.",
    windowDays: 3,
  },
} as const;
