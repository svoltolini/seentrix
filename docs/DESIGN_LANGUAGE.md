# Seentrix Design Language

The canonical design language for the entire Seentrix product — landing, app,
emails, PDFs, every screen. Derived from the Figma source of truth
("Project Management" / Nask template, file `1klruL0srDXAWQQBkk7qID`) and
already encoded in `src/app/globals.css`. **Anything created or edited must
match this exactly.** Prefer the CSS tokens/Tailwind classes over raw hex.

## Foundations

### Color
| Role | Token | Hex |
|---|---|---|
| Page background | `--background` / `bg-background` | `#F6F7FA` |
| Card / surface | `--card` / `bg-card` | `#FFFFFF` |
| Heading / body text | `--foreground` | `#2C3659` (dark navy) |
| Muted text | `--muted-foreground` | `#A7AEC1` |
| Primary (brand blue) | `--primary` | `#066DE6` |
| Primary tints | `--primary-2` / `--primary-3` | `#599EEE` / `#ACCEF7` |
| Accent (orange) | `--accent` | `#FF6D00` |
| Accent tints | `--accent-2` / `--accent-3` | `#FF9E55` / `#FFCEAA` |
| Border (light) | `--border` | `#F5F5F5` |
| Input fill | `--black-3` | `#EFF2F3` |
| Dark CTA panel | `--dark-cta` | dark navy (e.g. Help Centre card) |

Greys: `#A7AEC1`, `#C4C9D6`, `#E2E4EA`, `#F5F5F5`, `#F9F9F9`, `#F6F8FB`.

**Rules**
- Never hardcode a hex that has a token. Use `bg-primary`, `text-foreground`,
  `bg-muted`, etc.
- Blue is the primary action color. Orange is an accent only (progress,
  charts, callouts, the Help-Centre style card) — never the main CTA.
- Light theme is the default and dominant mode. Dark surfaces are used
  sparingly as deliberate accents (CTA panels), not as the page base.

### Typography
- Font: Plus Jakarta Sans (`--font-sans` / `--font-heading`), system fallback.
- Headings: bold (700-800), navy, slightly tight letter-spacing, large and
  friendly (the dashboard "Welcome, …" headline sets the tone).
- Body: regular weight, navy; secondary copy in muted grey.

### Geometry (radii)
| Token | px | Use |
|---|---|---|
| `--radius-sm` | 8 | chips, in-card CTAs |
| `--radius-md` | 10 | cards, sidebar items, inputs, buttons |
| `--radius-xl` | 15 | progress pills |
| `--radius-2xl` | 16 | message bubbles, large cards |

### Shadows
Soft, wide, low-opacity grey shadows (no hard drop shadows):
`--shadow-card-sm/md/lg` = `0 4px 60-120px rgba(169,173,180,0.15)`.

## Components

- **Cards**: white, `rounded-2xl` (16px), soft `shadow-card-*`, generous
  padding (~24-40px). Section title top-left in bold navy; optional small
  control (dropdown/"See All" link in blue) top-right.
- **Primary button**: solid blue `#066DE6`, white text, `rounded-md` (10px),
  ~14px×26px padding, bold label. Hover slightly darker.
- **Secondary button**: light grey fill (`#E2E4EA`), navy text.
- **Sidebar**: white background; active item = solid blue pill with white
  icon+label; inactive = grey icon + muted label. A dark navy "Help Centre"
  style promo card can sit at the bottom.
- **Inputs / selects**: light grey fill (`#EFF2F3`), no harsh border,
  `rounded-md`, grey placeholder, label in navy above the field. Two-column
  on desktop, single column on mobile.
- **Eyebrow label**: small (11px), uppercase, letter-spaced, blue — used
  above headlines (also used in the email templates).
- **Progress**: thin orange bar with a navy "x / y" and a right-aligned
  percentage.
- **Badges/pills**: small rounded chips; status colors from the status
  tokens (success/warning/destructive/info).
- **Avatars**: circular, overlapping stacks for teams; colored fallback.

## Layout
- Max content width for marketing sections ~1200px, centered.
- App shell: fixed left sidebar + top bar (search, primary action, profile),
  scrollable content with a right rail where useful (calendar/activity).
- Desktop frames are 1440px wide in Figma; everything must remain responsive
  down to mobile (single-column, sidebar collapses).

## Source
Figma: https://www.figma.com/design/1klruL0srDXAWQQBkk7qID/Project-Management
Tokens implemented in `src/app/globals.css` (`:root`).
