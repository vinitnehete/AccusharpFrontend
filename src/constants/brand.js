// ---------------------------------------------------------------------------
// The one place the product's name lives.
//
// "Accusharp" was a client's name used as a working title during development.
// Everything user-visible now reads from here instead: the public site, the
// sign-in screen, the signed-in sidebar and the browser tab. Change these five
// strings and the whole application renames itself.
//
// Deliberately NOT renamed, because none of it is user-visible and renaming it
// would churn tooling or break a live session for no benefit:
//   - the `accusharp` npm package name and the repo/folder names
//   - the `accusharp.lastActivity` localStorage key (a cross-tab contract)
//   - API paths, which carry no brand at all
//
// On the name: a muster roll is the statutory attendance register every Indian
// factory already keeps (Factories Act, Form 12; also required under the
// Contract Labour Act). It is the exact word this product's buyers use for the
// exact thing it produces - short, a real word, and immediately meaningful to
// an HR or payroll team without a single line of explanation.
// ---------------------------------------------------------------------------

export const BRAND = {
  /** Company / brand name on its own. */
  name: 'Muster',
  /** The product, when it needs to be named as a product. */
  productName: 'Muster HRMS',
  /** Registered entity, for the footer's copyright line. Replace when incorporated. */
  legalName: 'Muster Technologies Pvt. Ltd.',
  /** Letter in the round brand mark. */
  initial: 'M',
  /** One line, used under the wordmark and in the footer. */
  tagline: 'Every shift accounted for.',
};

export default BRAND;
