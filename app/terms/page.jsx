import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata = {
  title: "Terms of Service | SplitSync",
  description: "The terms that govern your use of SplitSync.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle="These terms govern your use of SplitSync. By accessing the app or website, you agree to these terms and to use the service responsibly."
      effectiveDate="May 2, 2026"
      sections={[
        {
          title: "Acceptance of the terms",
          paragraphs: [
            "By using SplitSync, you agree to these Terms of Service and to any updated version we may publish from time to time.",
          ],
        },
        {
          title: "Using the service",
          paragraphs: [
            "You may use SplitSync to manage shared expenses, groups, settlements, receipts, recurring templates, favorites, approvals, and related features.",
            "You are responsible for the accuracy of the information you enter, including amounts, participants, categories, and settlement records.",
          ],
        },
        {
          title: "Accounts and access",
          paragraphs: [
            "You are responsible for safeguarding access to your account and for any activity that happens under your account.",
            "We may suspend or restrict access if we detect abuse, security risks, or violations of these terms.",
          ],
        },
        {
          title: "Acceptable use",
          bullets: [
            "Do not use SplitSync for unlawful, fraudulent, or harmful activity.",
            "Do not attempt to access data that does not belong to you.",
            "Do not abuse the service with automated requests, scraping, or disruptive behavior.",
            "Do not upload content that violates someone else’s rights or privacy.",
          ],
        },
        {
          title: "Shared content",
          paragraphs: [
            "If you add people to a group or share an expense with them, you understand that those users may see the related data according to how the product works.",
            "You are responsible for obtaining the necessary permission before sharing someone’s information in a group or expense.",
          ],
        },
        {
          title: "Receipts, templates, and automation",
          paragraphs: [
            "Receipt uploads, favorites, recurring templates, budget goals, approval mode, reminder emails, and AI insights may rely on background jobs and third-party services.",
            "We may modify, suspend, or improve these features over time without guaranteeing that every detail remains unchanged.",
          ],
        },
        {
          title: "Disclaimers",
          paragraphs: [
            "SplitSync is provided on an as-is and as-available basis.",
            "We do not guarantee that balances, reminders, insights, or automated categorization will always be error-free.",
          ],
        },
        {
          title: "Limitation of liability",
          paragraphs: [
            "To the fullest extent permitted by law, SplitSync is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service.",
          ],
        },
        {
          title: "Changes to these terms",
          paragraphs: [
            "We may update these terms from time to time. Continued use of SplitSync after an update means you accept the revised terms.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Questions about these terms can be sent to hello@splitsync.app.",
          ],
        },
      ]}
    />
  );
}
