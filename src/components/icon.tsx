import * as Iconsax from "iconsax-react";
import type { ComponentType, SVGAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Map of legacy HugeIcon names + lucide-react names → iconsax-react component
 * names. Single source of truth — every <Icon name="..." /> call resolves
 * through this. Names from /public/icons/* (HugeIcon set) and lucide-react
 * imports across the codebase are listed here so dynamic indexers
 * (e.g. <Icon name={item.icon} />) keep working after the rewrite.
 */
const NAME_MAP = {
  // --- legacy HugeIcon names (every file from public/icons/) ---
  "add-01": "Add",
  "ai-magic-stroke-rounded": "MagicStar",
  "alert-02": "Warning2",
  "arrow-right-01-stroke-rounded": "ArrowRight2",
  "bubble-chat-question-stroke-rounded": "MessageQuestion",
  "building-06": "Building",
  "calendar-03": "Calendar",
  "calendar-03-stroke-rounded": "Calendar",
  "cancel-circle-half-dot-stroke-rounded": "CloseCircle",
  "checkmark-badge-01-stroke-rounded": "Verify",
  "checkmark-circle-01-stroke-rounded": "TickCircle",
  "chip-stroke-rounded": "Cpu",
  "circle-arrow-right-double-stroke-rounded": "ArrowCircleRight2",
  "circle-stroke-rounded": "RecordCircle",
  "circuit-board-stroke-rounded": "Cpu",
  "comment-remove-02-stroke-rounded": "MessageRemove",
  "crown-stroke-rounded": "Crown",
  "description": "DocumentText",
  "elearning-exchange-stroke-rounded": "Teacher",
  "email": "Sms",
  "glasses-stroke-rounded": "Eye",
  "global": "Global",
  "image": "Image",
  "language": "Translate",
  "locale": "Global",
  "lock-password-stroke-rounded": "LockCircle",
  "mail-remove-02-stroke-rounded": "SmsTracking",
  "menu-02": "HambergerMenu",
  "name": "Profile",
  "one-circle-stroke-rounded": "RecordCircle",
  "package": "Box",
  "package-open-stroke-rounded": "Box1",
  "pdf-01-stroke-rounded": "DocumentText",
  "pencil-edit-02-stroke-rounded": "Edit",
  "plus-sign-square-stroke-rounded": "AddSquare",
  "route-01": "Routing",
  "search-02-stroke-rounded": "SearchNormal1",
  "sent-stroke-rounded": "Send",
  "settings-02": "Setting2",
  "shield-check": "ShieldTick",
  "sparkles-stroke-rounded": "MagicStar",
  "stop-circle-stroke-rounded": "StopCircle",
  "task-done-02-stroke-rounded": "TaskSquare",
  "terminal-stroke-rounded": "Code",
  "thumbs-down-stroke-rounded": "Dislike",
  "thumbs-up-stroke-rounded": "Like1",
  "time-quarter-02-stroke-rounded": "Clock",
  "two-circle-stroke-rounded": "RecordCircle",
  "type": "TextBlock",
  "visual-studio-code-stroke-rounded": "Code1",

  // --- lucide-react names (so codemodded call-sites still resolve) ---
  "ArchiveIcon": "Archive",
  "ArchiveRestoreIcon": "ArchiveAdd",
  "ArrowLeft": "ArrowLeft",
  "ArrowLeftIcon": "ArrowLeft",
  "ArrowRightIcon": "ArrowRight",
  "ArrowUpDownIcon": "ArrowSwapVertical",
  "Calendar": "Calendar",
  "Camera": "Camera",
  "CheckIcon": "TickCircle",
  "ChevronDown": "ArrowDown2",
  "ChevronDownIcon": "ArrowDown2",
  "ChevronLeft": "ArrowLeft2",
  "ChevronLeftIcon": "ArrowLeft2",
  "ChevronRight": "ArrowRight2",
  "ChevronRightIcon": "ArrowRight2",
  "Clock": "Clock",
  "CopyIcon": "Copy",
  "Download": "DocumentDownload",
  "ExternalLinkIcon": "ExportSquare",
  "Eye": "Eye",
  "EyeOff": "EyeSlash",
  "FileIcon": "DocumentText",
  "ImageIcon": "Gallery",
  "Loader2": "Refresh",
  "PencilIcon": "Edit",
  "PlusIcon": "Add",
  "RefreshCwIcon": "Refresh",
  "RotateCcwIcon": "Refresh",
  "SearchIcon": "SearchNormal1",
  "Trash2Icon": "Trash",
  "UploadIcon": "DocumentUpload",
  "XIcon": "CloseCircle",

  // --- direct Vuesax / iconsax-react names (identity passthroughs) ---
  // Lets call-sites use the canonical name without going through a legacy alias.
  "Add": "Add",
  "AddSquare": "AddSquare",
  "AttachCircle": "AttachCircle",
  "Archive": "Archive",
  "ArchiveAdd": "ArchiveAdd",
  "ArrowDown2": "ArrowDown2",
  "ArrowLeft2": "ArrowLeft2",
  "ArrowRight": "ArrowRight",
  "ArrowRight2": "ArrowRight2",
  "ArrowSwapVertical": "ArrowSwapVertical",
  "ArrowUp2": "ArrowUp2",
  "Box": "Box",
  "Box1": "Box1",
  "Building": "Building",
  "Category": "Category",
  "Code": "Code",
  "Code1": "Code1",
  "Copy": "Copy",
  "Cpu": "Cpu",
  "Crown": "Crown",
  "Dislike": "Dislike",
  "DocumentDownload": "DocumentDownload",
  "DocumentText": "DocumentText",
  "DocumentUpload": "DocumentUpload",
  "Edit": "Edit",
  "EyeSlash": "EyeSlash",
  "FolderMinus": "FolderMinus",
  "Gallery": "Gallery",
  "Global": "Global",
  "Grid2": "Grid2",
  "HambergerMenu": "HambergerMenu",
  "Image": "Image",
  "Kanban": "Kanban",
  "Like1": "Like1",
  "Link1": "Link1",
  "LockCircle": "LockCircle",
  "LogoutCurve": "LogoutCurve",
  "MagicStar": "MagicStar",
  "Message": "Message",
  "MessageQuestion": "MessageQuestion",
  "MessageRemove": "MessageRemove",
  "More": "More",
  "Notification": "Notification",
  "Profile": "Profile",
  "Record": "Record",
  "RecordCircle": "RecordCircle",
  "Refresh": "Refresh",
  "RowVertical": "RowVertical",
  "Routing": "Routing",
  "SearchNormal1": "SearchNormal1",
  "Send": "Send",
  "Setting2": "Setting2",
  "ShieldTick": "ShieldTick",
  "Sms": "Sms",
  "SmsTracking": "SmsTracking",
  "StopCircle": "StopCircle",
  "TaskSquare": "TaskSquare",
  "Teacher": "Teacher",
  "TextBlock": "TextBlock",
  "TickCircle": "TickCircle",
  "Translate": "Translate",
  "Trash": "Trash",
  "UserAdd": "UserAdd",
  "Verify": "Verify",
  "VideoCircle": "VideoCircle",
  "Warning2": "Warning2",
} as const satisfies Record<string, keyof typeof Iconsax>;

export type IconName = keyof typeof NAME_MAP;

type IconsaxVariant = "Linear" | "Outline" | "Broken" | "Bold" | "Bulk" | "TwoTone";

type IconsaxComponentProps = {
  size?: string | number;
  variant?: IconsaxVariant;
  color?: string;
  className?: string;
} & SVGAttributes<SVGElement>;

type IconProps = {
  /** Legacy HugeIcon or lucide-react name. Maps to a Vuesax/iconsax component. */
  name: IconName | (string & {});
  /** Pixel size — defaults to 24 (Nask sidebar/topbar standard). */
  size?: number;
  /** Stroke variant — `Linear` for default state, `Bold` for active/selected. */
  variant?: IconsaxVariant;
  className?: string;
} & Omit<SVGAttributes<SVGElement>, "name">;

/**
 * Drop-in replacement for the legacy `<Icon />` and direct `lucide-react`
 * imports. Renders an iconsax-react component that inherits its color from the
 * surrounding `text-*` class via `currentColor`.
 *
 * @example
 *   <Icon name="package" size={20} className="text-foreground" />
 *   <Icon name="settings-02" variant="Bold" />  // active sidebar state
 */
export function Icon({
  name,
  size = 24,
  variant = "Linear",
  className,
  ...rest
}: IconProps) {
  // Resolve through NAME_MAP first; otherwise fall through to direct Iconsax
  // export (so callers can use `<Icon name="FolderMinus" />` natively without
  // adding an alias). Falsy lookup → render placeholder.
  const iconsaxName =
    (NAME_MAP as Record<string, keyof typeof Iconsax>)[name] ??
    ((name in Iconsax) ? (name as keyof typeof Iconsax) : undefined);
  const Component = iconsaxName
    ? (Iconsax[iconsaxName] as ComponentType<IconsaxComponentProps>)
    : null;

  if (!Component) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<Icon name="${name}" /> — no mapping found in NAME_MAP`);
    }
    // Render a transparent square so layout stays stable.
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Component
      size={size}
      variant={variant}
      color="currentColor"
      className={cn("shrink-0", className)}
      {...rest}
    />
  );
}
