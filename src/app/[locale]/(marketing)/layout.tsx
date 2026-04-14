import { GsapProvider } from "@/components/gsap-provider";
import { LandingHeader } from "./_components/landing-header";
import { LandingFooter } from "./_components/landing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <GsapProvider>{children}</GsapProvider>
      </main>
      <LandingFooter />
    </div>
  );
}
