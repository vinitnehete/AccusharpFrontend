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
// ---------------------------------------------------------------------------

export const BRAND = {
  /** Company / brand name on its own. */
  name: 'YuktiHR',
  /** The product, when it needs to be named as a product. */
  productName: 'YuktiHR',
  /** Registered entity, for the footer's copyright line. Replace when incorporated. */
  legalName: 'YuktiHR Technologies Pvt. Ltd.',
  /** Letter in the round brand mark. */
  initial: 'Y',
  /** One line, used under the wordmark and in the footer. */
  tagline: 'Every shift accounted for.',
};

export default BRAND;
