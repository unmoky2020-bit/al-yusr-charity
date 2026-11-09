/**
 * The public impact report (/impact, /impact/:kind/:key) adds up PAID donations. On 9 Nov 2026 almost
 * all of them were test payments (Kashier test-mode cards and the team's own trial donations), so the
 * report is shown to team members only — visitors get a "coming soon" page, nothing links to it and
 * search engines are told not to index it.
 *
 * After the test donations are cleared (marked refunded/removed), set this to true: the footer and
 * the trust page then link to the report and it becomes indexable.
 */
export const IMPACT_REPORT_PUBLIC = false;
