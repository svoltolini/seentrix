import { PricingContent } from "./pricing-content";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <PricingContent />;
}

export const metadata = { title: "Pricing" };
