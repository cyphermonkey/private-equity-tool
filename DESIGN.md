# Portfolio — Design & Infrastructure Reference

> This file documents the design system and technical structure.
> **Content** (text, bio, stats, project descriptions, experience entries) is intentionally excluded — change it freely in the HTML files without touching this.

---

## File Structure

```
portfolio/
├── index.html        # Overview / Home
├── experience.html   # Work experience
├── skills.html       # Skills & tools
├── projects.html     # Projects / case studies
├── education.html    # Education & contact
└── photo.png         # Profile photo
```

All pages are self-contained HTML files with embedded CSS and JS. No build tools, no frameworks, no dependencies.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Markup     | HTML5                               |
| Styling    | CSS3 (embedded `<style>` per page)  |
| Logic      | Vanilla JS (embedded `<script>`)    |
| Fonts      | Google Fonts (IBM Plex Mono, Syne)  |
| Hosting    | Static (any host, no server needed) |

---

## Design System

### Color Palette

Defined as CSS variables in `:root` at the top of each page.

#### Accent Colors
| Variable    | Hex       | Usage                        |
|-------------|-----------|------------------------------|
| `--orange`  | `#ff6e1a` | Primary accent, brand, CTA   |
| `--blue`    | `#2e90fa` | Secondary accent             |
| `--green`   | `#12b76a` | Success, active status       |
| `--yellow`  | `#eaaa08` | Warning, attention           |
| `--cyan`    | `#06aed4` | Info, alternate accent       |
| `--purple`  | `#7c3aed` | Tertiary accent              |
| `--red`     | `#f04438` | Error, minimal usage         |

#### Background Tints (low-opacity overlays)
| Variable  | Value                    |
|-----------|--------------------------|
| `--og`    | `rgba(255,110,26,0.12)`  |
| `--bg-b`  | `rgba(46,144,250,0.10)`  |
| `--bg-g`  | `rgba(18,183,106,0.10)`  |
| `--bg-y`  | `rgba(234,170,8,0.10)`   |
| `--bg-c`  | `rgba(6,174,212,0.08)`   |
| `--bg-p`  | `rgba(124,58,237,0.10)`  |
| `--bg-r`  | `rgba(240,68,56,0.08)`   |

#### Neutrals (Dark Theme)
| Variable       | Hex       | Usage                    |
|----------------|-----------|--------------------------|
| `--bg`         | `#0a0a0d` | Page background          |
| `--bg-card`    | `#111116` | Card / panel background  |
| `--bg-alt`     | `#15151b` | Alternate background     |
| `--bg-hover`   | `#1a1a22` | Hover state              |
| `--border`     | `#222228` | Primary border           |
| `--border-lit` | `#333340` | Lighter border           |
| `--text`       | `#e4e4e7` | Primary text             |
| `--text-dim`   | `#9191a0` | Secondary text           |
| `--text-muted` | `#55555f` | Muted / tertiary text    |

---

### Typography

| Variable    | Font           | Source       | Weights Used       |
|-------------|----------------|--------------|--------------------|
| `--mono`    | IBM Plex Mono  | Google Fonts | 300, 400, 500, 600, 700 |
| `--display` | Syne           | Google Fonts | 400, 600, 700, 800 |

#### Font Size Scale
| Context            | Size  | Font     | Weight |
|--------------------|-------|----------|--------|
| Hero name          | 34px  | display  | 800    |
| Page title         | 20px  | display  | 800    |
| Section header     | 18px  | display  | 700    |
| Body text          | 12–13px | mono   | 400    |
| Labels / tags      | 9–11px  | mono   | 700    |
| Tiny meta          | 9px   | mono     | 500    |

Letter spacing ranges from `0.5px` to `2px` on labels/headers.

---

### Spacing Scale

| Usage           | Value     |
|-----------------|-----------|
| Card padding    | 14–16px   |
| Section gap     | 14px      |
| Component gap   | 4–20px    |
| Grid gap        | 1px (border-style), 12–14px (breathing room) |

---

## Layout

### Global Container
- Max-width: `1300px`, centered with `margin: auto`
- Horizontal padding: `20px` (reduced on mobile)

### Page Sections (present on every page)

#### 1. Topbar
- Height: `36px`, sticky (`position: sticky; top: 0; z-index: 200`)
- Structure: `brand` · `sep` · `nav links` · `spacer` · `clock` · `sep` · `status dot`
- Clock: updates live every 1s via `tick()` JS function (HH:MM:SS + day)
- Status indicator: blinking green dot ("ONLINE") using `blink` keyframe animation

#### 2. Ticker Bar
- Height: `26px`
- Left label: colored by page (see Page Color Map below)
- Scrolling content: duplicated list for infinite loop via `slide` keyframe (50s linear infinite)
- Ticker data populated dynamically from a JS object in each page

#### 3. Main Content Area
- Flex or CSS Grid depending on page
- Cards/panels use `border: 1px solid var(--border)` to create grid-like visual separation

#### 4. Footer
- Simple single-row: copyright text + keyboard nav hint
- Keyboard hint hidden on mobile

---

### Page Color Map (ticker label accent)

| Page            | Accent Color |
|-----------------|-------------|
| index.html      | Orange      |
| experience.html | Orange      |
| skills.html     | Yellow      |
| projects.html   | Purple      |
| education.html  | Blue        |

---

### Responsive Breakpoints

| Breakpoint | Width     | Changes                                              |
|------------|-----------|------------------------------------------------------|
| Tablet     | ≤ 900px   | Hero switches to single column; topbar clock hidden  |
| Mobile     | ≤ 640px   | Grid → single column; reduced padding/font sizes     |
| XS         | ≤ 420px   | Further font and spacing reductions                  |

---

## Components

### Tag / Badge (`.ptag`)
Color modifier classes map to accent colors:

| Class  | Color   |
|--------|---------|
| `.t-o` | Orange  |
| `.t-b` | Blue    |
| `.t-g` | Green   |
| `.t-y` | Yellow  |
| `.t-p` | Purple  |
| `.t-c` | Cyan    |

### Grids Used Per Page

| Page            | Layout Class     | Columns        |
|-----------------|------------------|----------------|
| index.html      | `.dash`          | 2-col grid     |
| index.html      | `.metrics-grid`  | 3-col (2 mobile)|
| education.html  | `.contact-grid`  | 4-col          |

---

## Animations & Visual Effects

| Name       | Duration  | Type       | Usage                              |
|------------|-----------|------------|------------------------------------|
| `slide`    | 50s       | linear ∞   | Ticker scroll                      |
| `blink`    | 2s        | ease ∞     | Status dot breathing               |
| `panelIn`  | 0.4s      | ease       | Page load fade-in + slide-up       |
| `fadeIn`   | 0.4s      | ease       | Staggered card entrance            |
| hover transitions | 0.12s | ease    | All interactive elements           |

**Scanline overlay:** `body::after` pseudo-element with `repeating-linear-gradient` creates a subtle CRT/terminal monitor texture.

---

## JavaScript Modules (per page)

All vanilla JS, no libraries.

| Function             | Pages          | What it does                                           |
|----------------------|----------------|--------------------------------------------------------|
| `tick()`             | All            | Updates live clock every 1000ms                        |
| Ticker generator     | All            | Populates `.ticker-track` from a data object, duplicates for infinite scroll |
| Counter animation    | index.html     | Animates stat numbers 0 → target using `requestAnimationFrame` + cubic-bezier easing |
| Skill bar animation  | skills.html    | Reads `data-pct` on each bar and animates width on load |

Easing used for counters and skill bars: cubic-bezier `.22, 1, .36, 1`

---

## Git & Deployment

- **Repo:** `git@github.com:cyphermonkey/portfolio.git`
- **Branch:** `main`
- **Remote:** SSH (`git@github.com`)
- **Deploy:** Static — drop folder on any host (GitHub Pages, Netlify, Vercel, etc.)

---

## What You Can Change Freely

The following are **content only** — editing them does not affect design or layout:

- Name, subtitle, tagline
- Bio / about text
- Stats and metric numbers
- Contact links (email, LinkedIn, GitHub, Twitter)
- Profile rows (degree, location, phone, status)
- Focus area and industry chips
- Experience entries (role, org, dates, bullets, tags)
- Skill names and percentage values (`data-pct`)
- Project titles, descriptions, bullets, tags
- Education details (school, degree, coursework, activities)
- Ticker key-value data objects in each page's `<script>`
- Profile photo (`photo.png` — replace with same filename)
