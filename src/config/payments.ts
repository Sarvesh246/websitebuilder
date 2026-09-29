/** Payment terms shown at checkout and in the legal pages. Bump the version whenever the wording changes. */
export const PAYMENT_TERMS_VERSION = "2026-09-30";

/** Days after the initial payment during which a cancellation can be requested. */
export const CANCELLATION_WINDOW_DAYS = 3;

export const cancellationPolicy = {
  title: "3-Day Project Cancellation Policy",
  body: [
    "You may request to cancel a project within three calendar days of the initial purchase, as set out in the published terms.",
    "After that window, or once work has progressed beyond what the terms allow, the initial payment may become non-refundable.",
    "Any approved refund is processed back through Stripe to the original payment method. Requesting cancellation does not refund anything automatically.",
  ],
  note: "This is a studio policy set out in the published terms. It is not a statutory right of withdrawal.",
} as const;

/** Consent line at checkout. Split packages authorize the saved card and the later charge; Launch does not. */
export const paymentAuthorizationCopy = {
  full: "I authorize Northframe to charge the payment shown today through Stripe. I have read the payment terms and the 3-Day Project Cancellation Policy.",
  split:
    "I authorize the initial payment shown today. I also authorize Northframe to securely save my payment method with Stripe and to attempt to charge the remaining balance after the included revision stage is completed. Launch, transfer, and delivery happen only after the remaining balance is paid. I have read the payment terms and the 3-Day Project Cancellation Policy.",
} as const;

export const paymentAuthorization = (splitPayment: boolean): string =>
  splitPayment ? paymentAuthorizationCopy.split : paymentAuthorizationCopy.full;
