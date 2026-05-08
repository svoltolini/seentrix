"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HelpSheet } from "@/components/help-sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

/**
 * Side panel that introduces Seentrix AI, opened from the sidebar's
 * Help Centre question-mark marker. Marketing-flavoured but
 * lightweight — the goal is "what can I expect from this thing?", not
 * a sales pitch.
 *
 * Composed around the canonical `<HelpSheet />` so the visual language
 * (bg-primary/5 hero, h2 title, p2-r description, bottom-anchored
 * footer) is identical to FieldHelp and every other side panel in the
 * app. The previous build hand-rolled its own Sheet plumbing — that
 * was the very pattern divergence the user asked us to consolidate.
 *
 * Reuses `copilot.marketing.*` translation keys (same source as the
 * public /ai page) so the four capability bullets stay in sync across
 * surfaces.
 */
export function HelpCentreIntroSheet({
  open,
  onOpenChange,
  onStartChat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat: () => void;
}) {
  const t = useTranslations("copilot.marketing");

  // The four capability bullets are keyed in `copilot.marketing.bullets.*`
  // — keep the iteration order so this sheet matches the /ai page.
  const bullets = [
    {
      key: "sovereign",
      icon: "ShieldTick" as const,
      tone: "primary" as const,
    },
    {
      key: "grounded",
      icon: "DocumentText" as const,
      tone: "primary" as const,
    },
    {
      key: "context",
      icon: "Verify" as const,
      tone: "success" as const,
    },
    {
      key: "actionable",
      icon: "MagicStar" as const,
      tone: "accent" as const,
    },
  ];

  function handleStart() {
    onOpenChange(false);
    onStartChat();
  }

  return (
    <HelpSheet
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("lede")}
      body={
        <ul className="flex flex-col gap-5">
          {bullets.map(({ key, icon, tone }) => (
            <li key={key} className="flex items-start gap-4">
              <span
                className={
                  tone === "primary"
                    ? "flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    : tone === "success"
                      ? "flex size-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success"
                      : "flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent"
                }
              >
                <Icon name={icon} size={18} variant="Bold" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-h5 text-foreground">
                  {t(`bullets.${key}.title`)}
                </p>
                <p className="text-p3-r text-muted-foreground">
                  {t(`bullets.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      }
      footer={
        <>
          <Button onClick={handleStart} className="w-full" size="lg">
            <Icon name="MagicStar" size={16} variant="Bold" />
            {t.has("startChatting") ? t("startChatting") : "Start chatting"}
          </Button>
          <Link
            href="/ai"
            onClick={() => onOpenChange(false)}
            className="mt-3 block text-center text-p3 text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("learnMore")}
          </Link>
          <p className="mt-3 text-center text-p4-r leading-relaxed text-muted-foreground">
            {t.has("disclosure")
              ? t("disclosure")
              : "Powered by Mistral AI · hosted in the EU · not legal advice"}
          </p>
        </>
      }
    />
  );
}
