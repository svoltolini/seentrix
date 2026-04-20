import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "./_components/hero-section";
import { ProblemSection } from "./_components/problem-section";
import { FeaturesSection } from "./_components/features-section";
import { CopilotSection } from "./_components/copilot-section";
import { HowItWorksSection } from "./_components/how-it-works-section";
import { AudienceSection } from "./_components/audience-section";
import { TrustSection } from "./_components/trust-section";
import { PricingPreview } from "./_components/pricing-preview";
import { TimelineSection } from "./_components/timeline-section";
import { FaqSection } from "./_components/faq-section";
import { NewsletterSection } from "./_components/newsletter-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    // `absolute` skips the root-level "%s — Seentrix" template so the
    // homepage tab / share preview reads as just "Seentrix" instead of
    // "Seentrix — Your CRA Compliance Platform … — Seentrix".
    title: { absolute: "Seentrix" },
    description: t("hero.subtitle"),
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <CopilotSection />
      <HowItWorksSection />
      <AudienceSection />
      <TrustSection />
      <PricingPreview />
      <TimelineSection />
      <FaqSection />
      <NewsletterSection />
    </>
  );
}
