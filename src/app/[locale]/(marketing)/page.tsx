import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "./_components/hero-section";
import { ProblemSection } from "./_components/problem-section";
import { FeaturesSection } from "./_components/features-section";
import { AudienceSection } from "./_components/audience-section";
import { PricingPreview } from "./_components/pricing-preview";
import { TimelineSection } from "./_components/timeline-section";
import { NewsletterSection } from "./_components/newsletter-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    title: `Seentrix — ${t("hero.titleLine1")} ${t("hero.titleLine2")}`,
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
      <AudienceSection />
      <PricingPreview />
      <TimelineSection />
      <NewsletterSection />
    </>
  );
}
