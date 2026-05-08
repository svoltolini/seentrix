"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

/**
 * Side panel that explains what Seentrix AI can do, opened from the
 * sidebar's Help Centre question-mark marker. Marketing-flavoured but
 * lightweight — the goal is "what can I expect from this thing?", not
 * a sales pitch.
 *
 * Reuses `copilot.marketing.*` translation keys (same source as the
 * public /ai page) so the four capability bullets stay in sync across
 * surfaces.
 *
 * Two CTAs at the bottom:
 *   - Primary: "Start chatting" → closes this sheet and opens the
 *     real Copilot chat panel via the parent's `onStartChat` handler.
 *   - Secondary link: "Learn more" → /ai (the full marketing page).
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
    // Close this sheet, then surface the chat panel. The Copilot
    // provider handles its own open state.
    onOpenChange(false);
    onStartChat();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-md"
      >
        {/* Hero header — eyebrow + title + lede over a soft accent
            wash so the panel reads as "intro / orientation" rather
            than "another menu". */}
        <div className="bg-primary/5 px-6 pb-6 pt-8">
          <SheetHeader className="gap-3 p-0 text-left">
            <span className="text-l6-plus uppercase tracking-[2.5px] text-primary">
              {t("eyebrow")}
            </span>
            <SheetTitle className="text-h2 text-foreground">
              {t("title")}
            </SheetTitle>
            <SheetDescription className="text-p2-r text-muted-foreground">
              {t("lede")}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Capability bullets */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
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
        </div>

        {/* Footer — primary CTA + learn-more link + the
            "powered by / hosted in EU / not legal advice" disclosure
            (moved here from the chat sheet's composer footer so the
            chat surface stays focused on the conversation). */}
        <div className="border-t border-border bg-card px-6 py-4">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
