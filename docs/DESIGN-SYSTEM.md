# Seentrix Design System — Nask spec

This document is the single source of truth for every visual decision in the
Seentrix UI. Every value below was extracted from the Nask Project Management
Dashboard Figma file (`fileKey 1klruL0srDXAWQQBkk7qID`) via the Figma MCP
`get_design_context` and `get_variable_defs` tools — node IDs are cited next
to each component so anyone can re-verify against the source.

**Live reference frames in Figma**
- Style guide cover: [`3:2`](https://www.figma.com/design/1klruL0srDXAWQQBkk7qID/Nask---Project-Management-Dashboard?node-id=3-2)
- Colours panel: `8:1335`
- Typography panel: `8:1512`
- UI Element panel: `8:1650`
- Icon Source: `8:2084`
- Dashboard reference: `28:1755` / `142:15578`
- Detail Dashboard (gradient hero): `41:1171`
- Settings reference: `85:10431`
- Project Grid card: `67:9949`
- Message bubbles: `58:28682`

If you're tweaking a primitive or a page, **open the matching Figma frame
side-by-side and match values 1:1**. Don't introduce new colours or sizes
without adding them to this doc first.

---

## 1. Foundations

### 1.1 Font

**Plus Jakarta Sans**, weights 400 / 500 / 600 / 700. Loaded via
`next/font/google` in [src/app/layout.tsx](../src/app/layout.tsx) as the
`--font-jakarta` CSS variable; mapped to Tailwind's `--font-sans` and
`--font-heading` in [globals.css](../src/app/globals.css).

Mono: Geist Mono — only for code blocks in MDX content.

### 1.2 Colour palette

The palette is grouped into **semantic** tokens (used everywhere) and **ramps**
(used when the semantic isn't expressive enough — e.g. soft tints for charts).

Every value comes from the Colours panel (Figma `8:1335`).

| Token | Hex | Use |
|---|---|---|
| `--background` | `#F6F7FA` | Page background. `White / Screen Color` |
| `--foreground` | `#2C3659` | Body text. `Black / 01` |
| `--card` | `#FFFFFF` | Card surface. `White / General` |

**Blue ramp (primary)** — sidebar active, in-card CTAs, links

| Token | Hex |
|---|---|
| `--primary` | `#066DE6` `Blue / 01` |
| `--primary-2` | `#599EEE` `Blue / 02` |
| `--primary-3` | `#ACCEF7` `Blue / 03` |

**Orange ramp (accent)** — Help Centre, progress bars, alerts, urgent

| Token | Hex |
|---|---|
| `--accent` | `#FF6D00` `Orange / 01` |
| `--accent-2` | `#FF9E55` `Orange / 02` |
| `--accent-3` | `#FFCEAA` `Orange / 03` |

**Grey ramp** — text, borders, muted surfaces

| Token | Hex | Use |
|---|---|---|
| `--grey-1` (`--muted-foreground`) | `#A7AEC1` | Secondary text |
| `--grey-2` | `#C4C9D6` | Disabled text, light icons |
| `--grey-3` (`--secondary`) | `#E2E4EA` | Secondary button bg, "Add card" tile |
| `--lgrey-1` (`--border`) | `#F5F5F5` | Card / sidebar borders, sidebar bg |
| `--lgrey-2` (`--muted`) | `#F9F9F9` | Meta-chip bg, subtle wash |
| `--lgrey-3` | `#F6F8FB` | Page accent bg (rare, alt to background) |

**Black ramp** — dark CTA + dividers (despite the name, only `Black / 01` is dark; 02/03 are light dividers)

| Token | Hex | Use |
|---|---|---|
| `--black-1` | `#2C3659` | Same as `--foreground` (text + dark CTA bg) |
| `--black-2` (`--border-outline`) | `#E5E6E7` | Chip outlines, filter borders |
| `--black-3` (`--border-strong`, `--input`) | `#EFF2F3` | Filled-input bg, divider lines |

**Status**

| Token | Hex | Ramp |
|---|---|---|
| `--success` | `#4CD964` `Green / 01` | `--success-2` `#88E698`, `--success-3` `#C3F2CB` |
| `--destructive` | `#E60019` `Red / 01` | `--destructive-2` `#EE5566`, `--destructive-3` `#F7AAB2` |
| `--warning` | `#FF6D00` (alias of accent) | — |
| `--info` | `#066DE6` (alias of primary) | — |

**Do NOT use**: any hex that isn't in this list. If you reach for `#3B82F6` /
`#8B5CF6` / `#7C3AED` (the legacy dark-theme blues/purples), that's a smell —
use `--primary` (`#066DE6`) and `--accent` (`#FF6D00`) instead.

### 1.3 Typography scale

All Plus Jakarta Sans. Headings use 1.3 line-height; paragraphs use 1.6.
Each scale is exposed as a Tailwind utility class.

| Class | Size | Weight | LH | Use |
|---|---|---|---|---|
| `.text-h1` | 28 | 700 | 1.3 | Page title (Welcome, Dashboard) |
| `.text-h2` | 22 | 700 | 1.3 | Section title (Projects, Settings) |
| `.text-h3` | 20 | 700 | 1.3 | Sub-section (right-rail "Activities") |
| `.text-h4` | 18 | 700 | 1.3 | Card title, Settings section |
| `.text-h5` | 16 | 700 | 1.3 | Workspace name, task title |
| `.text-h6` | 14 | 700 | 1.3 | Small heading, table column |
| `.text-h6-plus` | 12 | 700 | 1.3 | Smallest emphasised label |
| `.text-l1` | 24 | 600 | 1.3 | Large label |
| `.text-l2` | 22 | 600 | 1.3 | Label |
| `.text-l3` | 20 | 600 | 1.3 | Label |
| `.text-l4` | 18 | 600 | 1.3 | **Settings form-field labels** |
| `.text-l5` | 16 | 600 | 1.3 | **Default button + nav label** |
| `.text-l6` | 14 | 600 | 1.3 | Small button, settings tab |
| `.text-l6-plus` | 12 | 600 | 1.3 | **Badge / chip label, eyebrow uppercase** |
| `.text-p1` | 18 | 400 | 1.6 | Hero subtitle |
| `.text-p1-m` | 18 | 500 | 1.6 | Hero subtitle (medium) |
| `.text-p2` | 16 | 500 | 1.6 | **Body, input value** |
| `.text-p2-r` | 16 | 400 | 1.6 | Body alternative |
| `.text-p3` | 14 | 500 | 1.6 | Subtitle, meta |
| `.text-p3-r` | 14 | 400 | 1.6 | Body alternative |
| `.text-p4` | 12 | 500 | 1.6 | Caption, "%" on progress |
| `.text-p4-r` | 12 | 400 | 1.6 | Smallest caption |

**Rule of thumb:** never use raw `text-[Npx]` — always use one of these classes.
Old `font-heading text-[28px] font-bold tracking-tight` → `text-h1`. Old
`text-sm text-muted-foreground` → `text-p3 text-muted-foreground`.

### 1.4 Geometry — radii, spacing, shadows

**Radii** (Nask is consistent: 8 / 10 / 15 / full)
- `rounded-sm` = **8px** — chips, in-card CTAs, small badges
- `rounded-md` = **10px** — cards, sidebar items, inputs (the workhorse)
- `rounded-lg` = **10px** (alias of md)
- `rounded-xl` = **15px** — progress pills
- `rounded-2xl` = **16px** — message bubbles
- `rounded-full` — avatars, switches

**Shadows** — soft, very wide blur, low opacity. Three scales:
- `--shadow-card-lg` = `0 4px 120px rgba(169, 173, 180, 0.15)` — Settings card, Project Statistics
- `--shadow-card-md` = `0 4px 90px rgba(169, 173, 180, 0.15)` — Project hero card
- `--shadow-card-sm` = `0 4px 60px rgba(169, 173, 180, 0.15)` — Task card

**Borders** — Nask uses **1.5px** for emphasised borders (workspace card, chip
outlines). Use `border-[1.5px]` for those, `border` (1px) for hairlines.

**Spacing** — Tailwind's default 4px scale. Most card padding lands at 16
(p-4) or 18 (`p-[18px]`). Sidebar items use 14 (`px-[14px] py-[14px]`).

---

## 2. Layout primitives

### 2.1 App shell

Authenticated app shell lives in [src/app/[locale]/app/layout.tsx](../src/app/[locale]/app/layout.tsx).
Two columns: 310px sidebar + flex-1 main column with a 110px topbar at the top.

#### Sidebar — `w-[310px]`, [src/components/layout/app-sidebar.tsx](../src/components/layout/app-sidebar.tsx)

Per Figma frames `57:28136` / `85:10566`.

```
┌────────────── 310 ──────────────┐
│ ┌──────── 262 × 71 ────────┐    │  Workspace card
│ │ 42×42 avatar  Title 16/B │    │  border-[1.5px] border-border
│ │              Workspace   │    │  rounded-md
│ └──────────────────────────┘    │
│                                 │
│ ┌──── 262 × 52 ─────────────┐   │  Nav item (gap-2.5 between)
│ │ 24×24 icon  Label 16/600  │   │  rounded-md, h-[52px]
│ └───────────────────────────┘   │  inactive: text-muted-foreground
│                                 │  active:   bg-primary text-white
│ ...                             │  icon switches Linear → Bold
│                                 │
│ ┌────── 256 × 245 ──────┐       │  Help Centre banner (mt-auto)
│ │      [orange icon]    │       │  bg-dark-cta (#2C3659) rounded-md
│ │      Help Centre      │       │  Title h4 white, body p3-r grey
│ │   "Stuck on CRA?"     │       │  CTA: bg-primary h-[44px] rounded-sm
│ │  [ Consult Now CTA ]  │       │
│ └───────────────────────┘       │
└─────────────────────────────────┘
```

#### Topbar — `h-[110px]`, [src/components/layout/app-topbar.tsx](../src/components/layout/app-topbar.tsx)

Per Figma frames `57:27169` / `57:26339`.

- Search box: `w-[333px] h-[48px] bg-input rounded-md`, leading 24×24
  search icon at left:12, placeholder `text-p3-r text-muted-foreground`.
- "+ New Product" CTA: `w-[170px] h-[48px] bg-dark-cta rounded-md` —
  **dark navy `#2C3659`, NOT primary blue**. Primary blue is reserved for
  sidebar-active state and in-card CTAs.
- Notification bell: `size-[44px]` round, 24×24 bell + 8×8 red dot for unread.
- Profile cluster: 42×42 avatar + (name `text-h5`, email `text-p3 muted`) +
  arrow-down → DropdownMenu with locale switcher / account / logout.

### 2.2 Page header (per-page)

Inside `<main>`:

```tsx
<h1 className="text-h1 text-foreground">Page title</h1>
<p className="mt-2 text-p2 text-muted-foreground">Subtitle</p>
```

Followed by the actual content. Page title goes inline at the top of the
content area, NOT in the topbar (the topbar drives off pathname for a small
echo title only).

### 2.3 Card

[src/components/ui/card.tsx](../src/components/ui/card.tsx)

Default: `bg-card rounded-md shadow-card-lg p-[18px]`. Variants via the
`shadow` prop: `lg` (default, sections) | `md` (project cards) | `sm` (task
cards) | `none`.

Card title is `text-h4 text-foreground`. Card description is `text-p3
text-muted-foreground`.

### 2.4 Right rail (dashboard)

`w-[370px]` white card with `shadow-card-md`, `p-6`, `gap-8` between sections.
Content order: Calendar → Upcoming/Meetings → Team strip → Activity feed.

---

## 3. Component anatomy

### 3.1 Button — [button.tsx](../src/components/ui/button.tsx)

| Variant | bg | text | h | radius | use |
|---|---|---|---|---|---|
| `default` | `--primary` | white | 44 | 8 (`sm`) | In-card primary (Upload New, Consult Now) |
| `dark` | `--dark-cta` `#2C3659` | white | 48 | 10 (`md`) | Top-bar "+ New Product" |
| `secondary` | `--secondary` `#E2E4EA` | navy | hug 52 | 10 | "Add a Card" footer in Kanban |
| `outline` | white | navy | 32–44 | 8 | Filter chips |
| `ghost` | transparent | navy | 44 | 8 | Icon-only triggers |
| `destructive` | `--destructive` | white | 44 | 8 | Delete / revoke |
| `link` | transparent | `--primary` | — | — | Inline text |

Sizes: `xs` h-7 / `sm` h-9 / `default` h-11 (44) / `lg` h-12 (48) / `icon` 44
/ `icon-sm` 36 / `icon-xs` 28.

Default text class is `text-l5` (16/600). `xs` and `sm` step down to `text-l6`
(14/600). Buttons are flat — no `active:scale-[0.98]` micro-bounce.

### 3.2 Input — [input.tsx](../src/components/ui/input.tsx)

Filled-input style:

```
h-11 rounded-md bg-input px-4 text-p2
border-[1.5px] border-transparent
placeholder:text-muted-foreground
focus-visible:bg-card focus-visible:border-primary/30
```

Resting bg is `--input` (#EFF2F3). On focus the field "lifts" to white with a
soft primary border. **No border on resting state.**

Form-field labels (above the input) use `text-l4` (18/600 — Nask's labels are
big). Set `<Label size="lg">…</Label>`. Default labels (`text-l6`, 14/600)
are for compact / auth contexts.

### 3.3 Badge — [badge.tsx](../src/components/ui/badge.tsx)

Pill, `text-l6-plus` (12/600), `rounded-sm` (8). Soft variants use
`bg-{color}/10 text-{color}` so they sit gracefully on white cards.

| Variant | example |
|---|---|
| `default` | gray fill on muted |
| `primary` | blue text on `bg-primary/10` |
| `accent` | orange text on `bg-accent/10` |
| `success` | green text on `bg-success/10` |
| `destructive` | red text on `bg-destructive/10` |
| `outline` | white card with `border-[1.5px] border-border-outline` |
| `solid-translucent` | `bg-white/20 text-white` (priority chips on tinted bg) |

### 3.4 Tabs — [tabs.tsx](../src/components/ui/tabs.tsx)

Default variant is **`line`** (underlined). The list has a hairline border
along the bottom; active tab gets a 2px primary underline and primary text.
Use `pills` only for legacy.

### 3.5 Avatar — [avatar.tsx](../src/components/ui/avatar.tsx)

Size variants: `sm` (24) / `default` (32) / `md` (36) / `lg` (42 — workspace card) / `xl` (54 — settings preview).
Fallback bg is `--avatar-fallback` (`#FFB257`, peachy orange — observed under
broken avatar imgs in Figma) with white initials.

Avatar groups overlap with `mr-[-8px]` on 32px avatars (or `-10` on 24px,
`-14` on 38px).

### 3.6 Card — components

#### Project hero card (340×249)

[project-hero-card.tsx](../src/app/[locale]/app/dashboard/widgets/project-hero-card.tsx).
Per Figma `50:2655` / `99:13322`. Full-bleed gradient cover, priority chip
top-left (`bg-white/20 rounded-sm px-3 py-1 text-l6-plus text-white
backdrop-blur-sm`), avatar stack top-right, title block + 308×6 orange
progress bar near bottom.

Gradients per category:
- default: `linear-gradient(135deg, #066DE6 0%, #6F4FE0 60%, #22D3EE 100%)`
- important class I: `linear-gradient(135deg, #FF9E55 0%, #066DE6 110%)`
- important class II: `linear-gradient(135deg, #FF6D00 0%, #6F4FE0 60%, #066DE6 100%)`
- critical: `linear-gradient(135deg, #E60019 0%, #6F4FE0 60%, #066DE6 100%)`

#### Project grid card (300×244 = 120 banner + 124 footer)

[product-grid-card.tsx](../src/app/[locale]/app/products/components/product-grid-card.tsx).
Per Figma `99:13322`. Banner has full-bleed image/gradient + bottom scrim
(`from-foreground/25 from-[46%] to-transparent to-[102%]`). Priority chip
top-left. Footer (`bg-card shadow-card-sm`) has title 14/700, optional type
14/400-muted, 268×6 progress bar, member stack + chevron-circle CTA.

#### Task card (700×121, dashboard)

[dashboard-task-card.tsx](../src/app/[locale]/app/dashboard/widgets/dashboard-task-card.tsx).
Per Figma `28:2535`. White card, padding 18, subtitle (14/400 muted) + title
(16/700), 3 meta chips (`bg-muted rounded-sm px-2 py-1.5` with 16×16 icon +
14/500 label) for message/link/clock, avatar stack right.

#### Kanban task tile (300×58)

[checklist-kanban-card.tsx](../src/app/[locale]/app/products/[productId]/components/checklist-kanban-card.tsx).
Per Figma `46:1920`. Compact white tile, 20×20 rounded-sm checkbox at
left:16/top:16, title 16/500 #2c3659, 24×24 avatar stack right.

### 3.7 Progress bar

Track: `h-[6px] bg-border rounded-xl` (full width). Fill: `bg-accent rounded-xl`
(orange). Used everywhere progress is shown.

### 3.8 Filter / sort chip

`bg-card border-[1.5px] border-border-outline rounded-sm px-[10px] py-[6px]
flex items-center gap-[14px] text-p3 text-foreground`. Optional 14–16px
arrow-down icon. Used for "Sort by: Newest", "List View", "Week".

### 3.9 Meta tag (small icon + label)

`bg-muted rounded-sm px-2 py-1.5 flex items-center gap-1.5 text-p3
text-muted-foreground`. Used for the 3 chips on task cards (message/link/clock).

### 3.10 Switch, Checkbox, Radio

- Switch: `w-9 h-5 rounded-full` track. Off = `bg-border`, on = `bg-primary`.
  16×16 thumb. Geometry verbatim from Figma `8:1672` (Switcher).
- Checkbox: `size-5 rounded-sm border-[1.5px] border-border-outline bg-card`.
  Checked: `bg-primary border-primary` with white tick.
- Radio: `size-5 rounded-full border-[1.5px] border-border-outline bg-card`.
  Selected: `border-primary` with a `size-2.5` primary dot indicator.

---

## 4. Marketing-specific guidance

The Figma file does NOT contain marketing pages. To keep the marketing
surface visually consistent with the app, follow these adapted rules:

### 4.1 Header / footer

Light-theme `bg-card` (white) sticky header with `border-b border-border`
once scrolled past 10px. **Never use the `brightness-0 invert` filter on the
logo** — that was for the legacy dark theme and now produces a white box on
a white surface. Drop it.

Footer: light `bg-card` with four columns, `border-t border-border`.

### 4.2 Hero

Use the Nask brand gradient stack for atmospheric blobs:

- Primary blob: `linear-gradient(to bottom, #066DE6, #6F4FE0)`
- Accent blob: `linear-gradient(to bottom, #FF6D00, #FF9E55)`

Place at low opacity (15–25%) with a heavy blur (`blur-[180px]` or
`blur-[200px]`). Background pattern: subtle navy dot grid at 6% alpha
(`radial-gradient(circle, rgba(44,54,89,0.06) 1px, transparent 1px)`).

Heading: `text-4xl/5xl/6xl font-extrabold tracking-tight`. Use the same
gradient for an emphasised line via `bg-gradient-to-r from-[#066DE6]
via-[#6F4FE0] to-[#FF6D00] bg-clip-text text-transparent`.

Subtitle: `text-p2 text-muted-foreground sm:text-lg`.

CTAs: `<Button size="lg">` (default = primary blue) for the main action,
`<Button variant="outline" size="lg">` for the secondary.

### 4.3 Section cards (features, audience, trust, copilot, etc.)

Use the Card primitive. Don't paint `bg-muted` (`#F9F9F9`) for entire
sections — that's reserved for chips/tags. Sections sit on `--background`
(`#F6F7FA`) with white cards on top.

For a "soft callout" (e.g. AI section) use a subtle gradient:
`bg-gradient-to-br from-primary/5 via-transparent to-accent/5`.

### 4.4 Pricing cards

Nask uses white cards with the recommended tier outlined in primary:
`border-2 border-primary` + a small primary chip ("Recommended"). Other
tiers: plain white cards (`border border-border`).

### 4.5 Common mistakes to fix on marketing

- ❌ `bg-muted` for big section backgrounds (looks flat)
  ✅ Use `bg-background` (page bg) + white cards on top
- ❌ `text-white` on light surfaces (invisible)
  ✅ Use `text-foreground` for body, `text-muted-foreground` for secondary
- ❌ Logo with `brightness-0 invert` in light theme
  ✅ Plain `<Logo />` — let the SVG render its native (dark) fill on light bg
- ❌ Old hex literals (`#3B82F6`, `#8B5CF6`, `#F97316`)
  ✅ Use the Nask palette (`#066DE6`, `#6F4FE0`, `#FF6D00`)
- ❌ Glass-effect cards `bg-white/[0.04] backdrop-blur` from dark theme
  ✅ Use the Card primitive with `shadow-card-sm/md/lg`

---

## 5. Icons

We use **iconsax-react** (the npm version of the Vuesax library Figma uses).
The wrapper at [src/components/icon.tsx](../src/components/icon.tsx) takes a
`name` (legacy HugeIcon name or canonical Vuesax name) and a `variant`
(`Linear` default; `Bold` for active sidebar, primary CTAs).

Common Vuesax names (use these directly):
- Navigation: `Category`, `FolderMinus`, `Calendar`, `Message`, `Setting2`
- Actions: `Add`, `AddSquare`, `Edit`, `Trash`, `Copy`, `More`
- Feedback: `Verify`, `TickCircle`, `CloseCircle`, `Warning2`, `Notification`
- Files: `Box`, `Box1`, `DocumentText`, `DocumentUpload`, `DocumentDownload`
- People: `Profile`, `UserAdd`, `Teacher`
- Domain: `ShieldTick` (security), `MagicStar` (AI), `MessageQuestion` (help)

For the active sidebar item, use `variant="Bold"`. Default icon size is 24
(sidebar nav, topbar action). Use 16 for chip / inline; 20 for medium icons;
14 for the smallest meta.

---

## 6. Common page patterns

### 6.1 Page with sections

```tsx
<div className="mx-auto max-w-[1120px] space-y-8 pb-12">
  <header className="flex items-end justify-between">
    <div>
      <h1 className="text-h1">Title</h1>
      <p className="mt-2 text-p2 text-muted-foreground">Subtitle</p>
    </div>
    <Button size="default">Primary action</Button>
  </header>

  <section className="flex flex-col gap-4">
    <h2 className="text-h2">Section</h2>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">…</div>
  </section>
</div>
```

### 6.2 Dashboard 2-column

```tsx
<div className="mx-auto grid w-full max-w-[1440px] gap-6 lg:grid-cols-[1fr_370px]">
  <div className="flex min-w-0 flex-col gap-6">{/* main */}</div>
  <aside className="rounded-md bg-card p-6 shadow-card-md">{/* rail */}</aside>
</div>
```

### 6.3 Settings sub-page (form)

```tsx
<div className="rounded-md bg-card p-[18px] shadow-card-lg">
  <h3 className="text-h4">Personal Information</h3>
  <div className="mt-6 grid gap-6 md:grid-cols-2">
    <div className="flex flex-col gap-3.5">
      <Label size="lg" htmlFor="firstName">First Name</Label>
      <Input id="firstName" placeholder="…" />
    </div>
    {/* … */}
  </div>
  <Separator className="my-6" />
  {/* next section */}
</div>
```

### 6.4 Data table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Cell</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

Header `bg-muted` with `text-h6`. Rows have a soft `hover:bg-muted/60`.

### 6.5 Empty state

```tsx
<EmptyState
  icon="Box"
  title="No products yet"
  description="Add your first product to start CRA compliance."
  action={<Button>Add Product</Button>}
/>
```

### 6.6 Auth form

`<AuthLayout>` provides a centered `max-w-[420px]` white card on the page bg.
Inside:

```tsx
<h1 className="text-center text-h3 text-foreground">Sign in</h1>
<p className="mt-2 text-center text-p3 text-muted-foreground">…</p>
<form className="mt-8 flex flex-col gap-5">
  <div className="flex flex-col gap-1.5">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="…" />
  </div>
  <Button className="mt-2 w-full">Sign in</Button>
</form>
```

---

## 7. Smell guide (when to refactor)

If you find any of these in a file, fix them:

| Smell | Fix |
|---|---|
| `bg-white/[0.0X]` | `bg-muted` or `bg-card` — pick by intent |
| `border-white/[0.0X]` | `border-border` or `border-border-outline` |
| `text-muted-foreground/30` (or any `/N`) | `text-muted-foreground` (no opacity) |
| `text-[Npx]` raw size | matching `text-h*/l*/p*` utility |
| `font-heading text-[28px] font-bold` | `text-h1` |
| `rounded-2xl` | `rounded-md` (10px) — Nask is consistent |
| `rounded-3xl` | `rounded-xl` (15px) |
| `bg-[#3B82F6]`, `#8B5CF6`, `#F97316` | `bg-primary`, `--primary` etc. |
| `drop-shadow-[0px_4px_60/90/120px_…]` | `shadow-card-sm/md/lg` |
| `brightness-0 invert` (on logos) | remove — light theme |
| `text-emerald-300` etc. (Tailwind named) | `text-success` (or other token) |
| Nested glass cards (`bg-white/[0.04] ring-1 ring-white/[0.06]`) | `<Card>` with appropriate shadow |

---

## 8. Verification

When implementing or reviewing a change:

1. **Open the matching Figma frame** side-by-side. Match exact pixel
   dimensions where they're given (e.g. 310px sidebar, 110px topbar,
   696×346 chart card).
2. **Use only token classes** (`text-h1`, `bg-primary`, `border-border`).
   No raw hex, no raw `text-[Npx]`.
3. Run `next build` — TypeScript must pass.
4. Click through the surface in `npm run dev` and compare against the
   relevant Figma node.

If a value isn't in this doc and isn't in Figma, it shouldn't be in code.
Add it here first, then use it.
