---
name: ProductHub Creator Design System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  warning-amber: '#F5A623'
  surface-white: '#FFFFFF'
  surface-muted: '#F3F3F3'
  text-primary: '#1A1C1C'
  text-secondary: '#5E5E5E'
  border-subtle: '#E2E2E2'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  section-gap: 80px
  card-padding: 24px
  stack-sm: 8px
  stack-md: 16px
---

## Brand & Style

The design system for the product is built on a foundation of **Premium Minimalism**. It targets digital creators and technical educators, requiring an interface that balances high-utility "tool-like" precision with the persuasive clarity of a high-conversion landing page.

The visual narrative is "Proof over Promises." By using a restrained color palette and generous whitespace, the UI recedes to let the product demos and data take center stage. The style avoids heavy ornamentation (like shadows or gradients) in favor of structural integrity, utilizing subtle 1px borders to define containment.

**Key Design Pillars:**
- **Functional Clarity:** Every element has a clear purpose; no decorative fluff.
- **Professional Trust:** High-contrast typography and a structured grid convey reliability.
- **Modern Minimalist:** Drawing inspiration from high-end SaaS tools like Linear or Notion, focusing on "Surface and Stroke" rather than "Depth and Shadow."

## Colors

The palette is anchored by "Off-Black" for core branding and CTAs, ensuring maximum contrast and a premium feel. Indigo is used surgically for interactive elements, links, and active states in the dashboard.

**Application Rules:**
- **Background:** Use `#FAFAFA` for the main page background to create a soft separation from the pure white cards.
- **Surface:** Use `#FFFFFF` for primary content cards and `#F3F3F3` for secondary dashboard panels or inset areas.
- **Borders:** All card and input boundaries should use the 1px `#E2E2E2` stroke.
- **Text:** Maintain a strict hierarchy—`#1A1C1C` for titles/headlines and `#5E5E5E` for long-form body text and descriptions to reduce eye strain.

## Typography

This design system uses **Inter** exclusively to maintain a clean, systematic appearance across both the landing page and the administrative dashboard.

**Usage Guidelines:**
- **Headline LG:** Reserved for the Hero section and major page titles. Use the mobile variant for screens under 768px.
- **Headline MD:** Used for product card titles and dashboard section headers.
- **Body LG:** The default for product descriptions and value proposition text.
- **Label MD:** Used for small identifiers, "Status" tags, and button text when a more formal, structured look is required.
- **Spacing:** Given the minimalist nature, keep tight tracking (letter spacing) on headlines to increase the "premium" feel.

## Layout & Spacing

The design system employs a **Fixed Grid** for the landing page to ensure readability and a **Fluid-Edge** layout for the dashboard to maximize the workspace for data tables.

**Rhythm & Alignment:**
- **Landing Page:** Use a 12-column grid with a 1200px max-width. Sections are separated by a generous `section-gap` (80px) to give the content room to breathe.
- **Dashboard:** Use a persistent left-hand sidebar (240px) with a fluid content area.
- **Component Spacing:** Use an 8px base unit. Internal card padding is strictly 24px to maintain a spacious, premium feel.
- **Breakpoints:**
  - Mobile: < 768px (Single column, 16px margins).
  - Tablet: 768px - 1024px (2-column grids for cards).
  - Desktop: > 1024px (3 or 4 column grids for cards).

## Elevation & Depth

To align with the Minimalist style, this design system rejects heavy drop shadows. Depth is communicated through **Tonal Layering** and **Low-contrast Outlines**.

**Elevation Rules:**
- **Level 0 (Background):** `#FAFAFA` — The lowest layer.
- **Level 1 (Cards/Surface):** `#FFFFFF` with a 1px border of `#E2E2E2`. This is the primary container for all content.
- **Interactive State:** On hover, a card should not gain a shadow; instead, the border color should darken to `#111111` or the background should shift slightly to `#F3F3F3`.
- **Navigation/Modals:** Only for critical overlays (like the Admin CRUD modal), a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)) may be used to separate the modal from the background.

## Shapes

The shape language is a mix of geometric precision and approachable softness.

**Corner Radius Logic:**
- **Containers & Interactive Elements:** Cards, Buttons, and Input fields use the `rounded-lg` (8px / 0.5rem) standard. This provides a modern, friendly feel without being "bubbly."
- **Media & Placeholders:** Image placeholders and product thumbnails utilize **0px (Sharp)** corners. This contrast between rounded containers and sharp imagery creates a sophisticated, "gallery-like" editorial look.
- **Icons:** Use Lucide-style line icons with a 2px stroke width and slightly rounded caps to match the font's geometry.

## Components

### Buttons
- **Primary:** Background `#111111`, Text `#FFFFFF`, 8px radius. High-impact for "Beli Sekarang."
- **Secondary:** Border 1px `#E2E2E2`, Background `Transparent`, Text `#1A1C1C`. Used for "Lihat Demo."
- **Ghost:** No border/background, Text `#4F46E5`. Used for dashboard navigation or less important actions.

### Cards
- **Product Card:** White background, 1px `#E2E2E2` border. Thumbnail at the top (0px corners). Content padding 24px.
- **Stat Card:** White background, small Label-md for title, Headline-lg for the metric value.

### Inputs
- **Text Fields:** 1px `#E2E2E2` border, `#FAFAFA` or `#FFFFFF` background. 8px radius. On focus, the border changes to `#4F46E5`.
- **Checkboxes/Radios:** Use the Indigo `#4F46E5` for selected states.

### Chips & Tags
- **Status Tags:** Small text (Label-md variant), 4px radius.
- **Success:** Emerald background at 10% opacity with Emerald text.
- **Warning:** Amber background at 10% opacity with Amber text.

### Iconography
- Icons should be consistently sized at 20px for buttons and labels.
- Use a 2px stroke weight to ensure clarity on high-density displays.