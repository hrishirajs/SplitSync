import { LandingExperience } from "@/components/landing-experience";

export async function generateMetadata() {
  return {
    title: "SplitSync | Shared money, styled like a premium product",
    description:
      "Split expenses, approve group spends, upload receipts, save favorites, automate recurring costs, and settle balances in a polished finance experience.",
  };
}

export default function LandingPage() {
  return <LandingExperience />;
}
