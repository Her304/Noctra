# DESIGN.md — Noctra

The visual system behind the Next.js app. Everything here is implemented in
[`app/globals.css`](app/globals.css) (single stylesheet, no framework, no CSS-in-JS)
and consumed by plain class names in `app/` and `components/`. Architecture,
data and pipeline decisions live in [CLAUDE.md](CLAUDE.md); this file covers only
how the thing looks and why.

---

## 1. The idea

**Nocturne Editorial.** Night is the ground state. The day's events are stars;
the linkages between them are constellations. Warm ember is the only accent —
the lit screen in a dark field.

Three consequences that decide most design questions:

1. **Night is the default surface, daylight is the exception.** Cream sections
   (`.day`, `.reading-room`) are paper stock dropped into the night for long-form
   reading. Never the reverse — do not put a dark card in a dark section to
   create hierarchy; use hairlines and mono labels instead.
2. **One accent, used sparingly.** Ember marks the *live* thing: the CTA, the
   active nav dot, an edge in the graph, a section slash. If three ember elements
   compete in one viewport, two of them are wrong.
3. **Editorial before dashboard.** Noctra reads news and argues about
   consequences; it is a publication with a map in it, not an analytics console.
   Wide margins, a real drop cap, an index rail, a pull quote — and no KPI tiles,
   no gauges, no chart chrome.

Voice, for anything that ships as copy: declarative, unhedged, slightly literary.
Section labels are nouns (`/ THE LENS`, `/ THE MAP`), not verbs. Headlines set
their first clause solid and hand the second to haze (`.dim` / `.dim-ink`).

---

## 2. Tokens

All tokens are custom properties on `:root`. Use the variable, never the literal.

### Colour

| Token | Value | Role |
|---|---|---|
| `--ink` | `#05070F` | Page ground. The night before dawn. |
| `--ink-2` | `#080D1C` | Overlay menu, briefing drawer glass |
| `--night` | `#0A1330` | Depth behind the stars; footer |
| `--night-2` / `--night-3` | `#101D45` / `#16295E` | Gradient stops, nebula, glyph plates |
| `--ember` | `#E9B44C` | **The only accent.** CTA, edges, active state |
| `--ember-lit` | `#F7D68F` | Hover state of ember |
| `--ember-deep` | `#B8842A` | Ember on cream (contrast on paper) |
| `--ember-glow` | `rgba(233,180,76,.22)` | Bloom shadows only |
| `--bone` | `#F2EEE6` | Daylight sections, paper |
| `--bone-2` / `--bone-3` | `#E7E1D5` / `#D9D2C3` | Recessed paper, quiet tiles, index numerals |
| `--ash` / `--ash-soft` | `#3A3833` / `#6F6A60` | Ink and secondary ink on paper |
| `--bright` | `#F6F4EF` | Primary text on night |
| `--haze` / `--haze-dim` | `#8B99BC` / `#5B688A` | Secondary and tertiary text on night |
| `--hairline` / `--hairline-soft` | `rgba(246,244,239,.12)` / `.07` | Rules on night |
| `--hairline-ink` | `rgba(58,56,51,.14)` | Rules on paper |

There is **no dark-mode toggle**. The palette is authored dark; cream sections are
a compositional device, not a theme.

The only sanctioned colours outside this list are the four framework quadrant
accents (`#7D8F5C`, `#B4603C`, `#4D7A93`, `#9A4A51`) — muted, paper-safe, applied
as a 2px left edge and a bullet pip so SWOT/PEST quadrants stay distinguishable
without turning into a colour-coded dashboard.

### Type

Three families, loaded through `next/font` in `app/layout.tsx` (self-hosted, no
render-blocking `<link>`):

- `--font-sans` — **Archivo**. Interface *and* headline mass. Headlines run at
  weight 500 with tight tracking (`-0.03em` to `-0.04em`) and `line-height` under 1.05.
- `--font-display` — **Instrument Serif**, italic. Never sets a whole headline —
  it is the *voice inside* one, via `<em>`. Also: drop cap, pull quote, empty-state
  titles, the footer wordmark, entry index numerals.
- `--font-mono` — **JetBrains Mono**. Every label, figure, timestamp, domain,
  strength value, disclaimer. Uppercase, `letter-spacing` 0.12–0.2em, 0.56–0.72rem.

The mono/serif/sans split *is* the hierarchy. Applying it consistently matters
more than any size choice: metadata is mono, emphasis is serif italic, everything
else is Archivo.

Body copy: 380 weight, 1.65–1.78 line-height, measure capped by `ch` (`46ch` for
split copy, `62ch` lens, `66ch` essay, `72ch` article decks).

### Form

`--r-sm` 8px · `--r-md` 16px · `--r-lg` 26px · `--r-pill` 999px.
Shell width `--shell: 1280px`; gutter `clamp(1.25rem, 5vw, 4.5rem)`.
Every horizontally-constrained block uses `.shell` or repeats
`max-width: var(--shell); margin-inline: auto`.

### Motion

One easing curve — `--ease: cubic-bezier(.22,1,.36,1)` — and two durations,
`--t` (0.45s) and `--t-fast` (0.22s). Ambient loops (`drift`, `twinkle`, `trace`,
`slide`, `blink`) run 5s–120s so nothing reads as animation, only as weather.
`prefers-reduced-motion` collapses all of it and forces entrance states visible.

---

## 3. Surfaces

| Surface | Class | Ground | Text | Rules |
|---|---|---|---|---|
| Night | default `<body>` | `--ink` | `--bright` / `--haze` | `--hairline` |
| Generated night | `.hero`, `.band`, `.page-head`, `.split-visual`, `.observatory` | layered radial gradients + starfield | same | same |
| Daylight | `.day`, `.reading-room` | `--bone` | `--ash` / `--ash-soft` | `--hairline-ink` |
| Recessed paper | `.essay`, `.tile-quiet`, `.quadrant` | `--bone-2` | same | same |
| Glass | `.nav.scrolled`, `.star`, `.briefing`, `.split-card` | translucent + `backdrop-filter: blur()` | context | `--hairline` |

A **film grain** (`body::after`, inline SVG turbulence, `opacity .045`,
`mix-blend-mode: overlay`, `z-index: 9999`) sits over the entire document. It stops
the night from banding and gives the cream sections paper tooth. Do not add a
second overlay above it; do not remove it to "fix" a colour that looks off.

Night backgrounds are **generated, never image assets**: stacked
`radial-gradient()` for nebula and horizon glow, twelve more for the starfield
(`.hero-stars`, three sizes at three opacities, plus a twinkling `::after` layer),
and inline SVG for constellations. This keeps the hero at zero image weight.

---

## 4. Components

### Primitives

- `.label` — the `/ SECTION` eyebrow. Mono, tracked 0.2em, ember slash via
  `::before`. Add `.on-bone` on paper.
- `.display` / `.section-head` — the two headline sizes. Both take `<em>` for the
  serif italic and `.dim` / `.dim-ink` for the two-tone second clause.
- `.mono-meta` — any timestamp, count or source line.
- `.btn` + `.btn-ember` (primary, ember fill, glow on hover) / `.btn-ghost`
  (hairline + glass, on night) / `.btn-ink` (dark fill, on paper). The `.arrow`
  span slides 4px on hover; keep it `aria-hidden`.

### Navigation

`.nav` floats transparent over the hero and condenses to a glass rail past 24px
of scroll (`.scrolled`, set in `components/Nav.tsx`). Active page is marked by an
ember 3px dot under the link (`[aria-current="page"]`), never by weight or fill.
Below 860px the links and CTA are replaced by `.nav-burger` opening a full-screen
`.overlay` whose items rise in 60ms steps; body scroll locks and Escape closes.

### Home (`app/page.tsx`)

Ordered as a night→day→night arc:

`hero` (100svh, generated sky, centred headline, four hairline-ruled figures) →
`seam` (mono marquee, the join between night and day) → `day` + `bento`
(1 / 1.55 / 1 grid; two `.tile-quiet` on paper flanking one `.tile-feature` that
is *the night inside the daylight*) → `day` + `lens` (framework rows that indent
1.8rem and grow an ember left edge on hover) → `split` (cream copy, night map, and
`.split-card` floating across the seam) → `essay` (200px sticky rail + 66ch column,
drop cap, `.pull` quote) → `band` (CTA, back to night) → `foot`.

The footer wordmark is **SVG text with a stroke, not a font-size in `vw`** — it must
land edge-to-edge at every width, which a viewport-unit type size cannot do. It
fills faintly ember on hover.

### Apercu — the reading room (`app/apercu/page.tsx`)

`.page-head` on night, then `.reading-room` on paper. Each article is an `.entry`:
a sticky 9rem `.entry-rail` (serif index numeral, mono date, ember-deep domain)
beside title, deck and actions. The four frameworks are **progressive disclosure** —
a `<details class="frameworks">` whose summary is a mono pill; opening reveals
`.quadrants`. An analysis page that dumps SWOT, PEST, Porter and Diamond-E all at
once is unreadable, so the default state is folded.

### Catographic — the observatory (`app/catographic/page.tsx`)

`.page-head.map-head` collapses to a single bar (6.75rem top padding vs 10rem) so
the sky and the briefing share one screen. `.observatory` is
`calc(100svh - 16rem)`; React Flow's own chrome is restyled to glass in
`.observatory .react-flow__*` rather than overridden inline.

Nodes are stars: `.star` is a 190px glass chip that becomes a 310px `.expanded`
briefing card in place; unrelated nodes take `.dimmed` (opacity .2, desaturated)
rather than being removed, so the constellation stays legible. Edges are ember
with a `drop-shadow` bloom. `.briefing` is the drawer floating top-right — on
mobile it goes `position: static` under a 62svh sky.

### Empty states

Every page degrades rather than fails (an unreachable Supabase renders empty, not
a 500). Both empty states — `.empty-state` on paper, `.observatory-empty` on night —
lead with a serif italic line and a 42–44ch explanation. Keep them written, not
iconographic.

---

## 5. Responsive

Four breakpoints, all in one block at the end of the stylesheet:

- **1080px** — bento to 2 columns with the feature tile pulled first; split stacks;
  `.split-card` re-centres.
- **860px** — nav becomes the burger overlay; statement, essay and entries go
  single-column; the entry rail turns horizontal; the briefing unpins.
- **560px** — hero figures, bento and footer collapse to one column.
- **`prefers-reduced-motion`** — all animation and transition durations to 0.01ms,
  entrance states forced visible.

Mobile-first is not the model here; the layouts are authored at shell width and
degraded. When adding a component, add its collapse to the existing blocks rather
than opening a new breakpoint.

---

## 6. Accessibility notes

- Ember on ink and bright/haze on night clear AA for their sizes; **`--haze-dim`
  is decorative** — mono metadata only, never body copy.
- On paper use `--ember-deep`, not `--ember`; the raw accent fails on cream.
- State is never colour-only: the nav dot is a shape, quadrants pair colour with a
  pip, `.star` focus pairs border with elevation.
- `aria-current="page"`, `aria-expanded`, `aria-controls` and `aria-hidden` are
  carried on the nav/overlay; icon-only controls need a label (`.foot-socials`,
  `.nav-burger`).
- Icons are inline SVG, `aria-hidden`, `currentColor`. **No icon font** — the Font
  Awesome and Google Sans Flex `<link>`s were deliberately removed.

---

## 7. Rules for extending it

Enchufar (the drag-and-drop workspace) is not built yet, and it is the next real
test of this system. When adding to it, or anywhere:

1. **Add tokens, don't add colours.** A new hue needs a reason the ember/night/bone
   triad cannot serve it.
2. **Reuse the primitives.** A new section opens with `.label`, states its case in
   `.section-head`, and constrains itself with `.shell`.
3. **Metadata is mono, emphasis is serif, everything else is Archivo.** No fourth family.
4. **One motion curve.** New transitions use `--t` / `--t-fast` and `--ease`.
5. **Night by default.** Reach for `.day` only when the content is long-form reading.
6. **No component library.** The stylesheet is one file, ordered by page; put new
   rules in the section they belong to, with a comment saying *why* — the existing
   comments explain reasoning, not syntax, and that is the convention.
7. **Sparingly ember.** If it isn't live, active or the primary action, it is haze.
