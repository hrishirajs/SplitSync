import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata = {
  title: "Privacy Policy | SplitSync",
  description: "How SplitSync collects, uses, shares, and protects information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="This policy explains how SplitSync collects, uses, stores, and protects information when you use the app, the website, or related services."
      effectiveDate="May 2, 2026"
      sections={[
        {
          title: "Information we collect",
          description: "We collect only what the product needs to function well.",
          paragraphs: [
            "When you create an account or sign in, we may collect your name, email address, profile image, and authentication identifiers from our identity provider.",
            "When you use SplitSync, we store the expenses, settlements, groups, receipts, favorites, recurring templates, budget goals, and other content you enter.",
            "We may also collect device, browser, and usage data to help keep the app reliable and secure.",
          ],
        },
        {
          title: "How we use information",
          paragraphs: [
            "We use data to provide the core product experience, including shared expense tracking, balance calculations, approvals, reminders, monthly insights, receipts, and recurring automation.",
            "We use email and background jobs to send payment reminders, monthly spending insights, and operational messages related to your account or activity.",
            "We may use automated analysis and AI-assisted features to categorize expenses, summarize spending, and power product functionality you choose to use.",
          ],
        },
        {
          title: "How we share information",
          paragraphs: [
            "We do not sell your personal data.",
            "We may share information with service providers that help us run SplitSync, including authentication, database, email, background processing, analytics, and AI services.",
            "Shared expenses are visible to the people you explicitly invite or include in a group, because that is the core behavior of the app.",
          ],
        },
        {
          title: "Receipts, templates, and shared data",
          paragraphs: [
            "If you upload a receipt, save a favorite, or create a recurring template, that content is stored so the product can reuse it later.",
            "Anything linked to a group or a shared expense may be visible to other members of that group, depending on the feature and your role in the group.",
          ],
        },
        {
          title: "Security",
          paragraphs: [
            "We use access checks in the app and backend to limit data to the right users and groups.",
            "No system is perfectly secure, but we aim to keep the product lightweight, access-controlled, and privacy-aware by design.",
          ],
        },
        {
          title: "Your choices",
          bullets: [
            "You can stop using the app at any time.",
            "You can delete expenses or templates where the app allows it.",
            "You can contact us to ask about your data or request help with your account.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "If you have questions about this Privacy Policy, contact us at hello@splitsync.app.",
          ],
        },
      ]}
    />
  );
}
