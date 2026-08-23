# Design Language: clonk agentic dev

> Extracted from `https://www.clonk.ai/` on June 22, 2026
> 720 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#ff551d` | rgb(255, 85, 29) | hsl(15, 100%, 56%) | 30 |
| Secondary | `#dff58b` | rgb(223, 245, 139) | hsl(72, 84%, 75%) | 1 |
| Accent | `#ff7a47` | rgb(255, 122, 71) | hsl(17, 100%, 64%) | 7 |

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#262626` | hsl(0, 0%, 15%) | 666 |
| `#ffffff` | hsl(0, 0%, 100%) | 442 |
| `#000000` | hsl(0, 0%, 0%) | 354 |
| `#555555` | hsl(0, 0%, 33%) | 8 |
| `#f1f1f1` | hsl(0, 0%, 95%) | 4 |
| `#101010` | hsl(0, 0%, 6%) | 3 |
| `#1b1b1b` | hsl(0, 0%, 11%) | 2 |
| `#676767` | hsl(0, 0%, 40%) | 2 |
| `#e5e5e5` | hsl(0, 0%, 90%) | 1 |
| `#757575` | hsl(0, 0%, 46%) | 1 |

### Background Colors

Used on large-area elements: `#000000`, `#fafaf8`, `#ffffff`, `#f1f1f1`, `#dff58b`, `#f5f5f5`, `#101010`, `#f4f4f4`, `#ff551d`, `#f6f6f3`

### Text Colors

Text color palette: `#ffffff`, `#fafafa`, `#000000`, `#676767`, `#ff551d`, `#242424`, `#555555`, `#252525`, `#757575`, `#fcfcfc`

### Gradients

```css
background-image: linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255) 17%, rgba(255, 255, 255, 0.55) 30%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0) 88%, rgb(250, 250, 248));
```

```css
background-image: linear-gradient(rgb(44, 44, 44), rgb(20, 20, 20));
```

```css
background-image: linear-gradient(to top, rgb(255, 255, 255), rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0));
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#262626` | border, background, text | 666 |
| `#ffffff` | text, background, border | 442 |
| `#000000` | background, text, border | 354 |
| `#ff551d` | background, text, border | 30 |
| `#555555` | text, background | 8 |
| `#ff7a47` | text | 7 |
| `#f1f1f1` | background | 4 |
| `#101010` | background | 3 |
| `#1b1b1b` | background | 2 |
| `#676767` | text | 2 |
| `#dff58b` | background | 1 |
| `#e5e5e5` | border | 1 |
| `#757575` | text | 1 |

## Typography

### Font Families

- **__neueMontreal_8db69f** — used for body (480 elements)
- **__stackSansText_3cee34** — used for all (127 elements)
- **__degularDisplay_1e8a8c** — used for all (113 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 80px | 5rem | 700 | 80px | -2px | h1 |
| 68px | 4.25rem | 700 | 61.2px | -0.68px | h2 |
| 64px | 4rem | 900 | 64px | normal | span, h2 |
| 62px | 3.875rem | 700 | 62px | -0.62px | p, h2, br, span |
| 60px | 3.75rem | 700 | 72px | -0.6px | h2, img, span |
| 58px | 3.625rem | 700 | 58px | -0.58px | span |
| 56px | 3.5rem | 700 | 56px | normal | h2 |
| 54px | 3.375rem | 700 | 54px | -0.54px | h3 |
| 44px | 2.75rem | 500 | 44px | -0.88px | div |
| 42px | 2.625rem | 700 | 42px | -0.42px | span |
| 38px | 2.375rem | 700 | 38px | -0.38px | div |
| 34px | 2.125rem | 700 | 34px | -0.34px | h3, span |
| 32px | 2rem | 700 | 32px | 0.32px | h3, br, span |
| 30px | 1.875rem | 700 | 30px | -0.3px | div |
| 28px | 1.75rem | 700 | 28px | -0.56px | p, br, button, svg |

### Heading Scale

```css
h1 { font-size: 80px; font-weight: 700; line-height: 80px; }
h2 { font-size: 68px; font-weight: 700; line-height: 61.2px; }
h2 { font-size: 64px; font-weight: 900; line-height: 64px; }
h2 { font-size: 62px; font-weight: 700; line-height: 62px; }
h2 { font-size: 60px; font-weight: 700; line-height: 72px; }
h2 { font-size: 56px; font-weight: 700; line-height: 56px; }
h3 { font-size: 54px; font-weight: 700; line-height: 54px; }
h3 { font-size: 34px; font-weight: 700; line-height: 34px; }
h3 { font-size: 32px; font-weight: 700; line-height: 32px; }
h4 { font-size: 13px; font-weight: 500; line-height: 13px; }
```

### Body Text

```css
body { font-size: 16px; font-weight: 400; line-height: 24px; }
```

### Font Weights in Use

`400` (498x), `600` (106x), `700` (74x), `500` (35x), `300` (4x), `900` (3x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-2 | 2px | 0.125rem |
| spacing-48 | 48px | 3rem |
| spacing-56 | 56px | 3.5rem |
| spacing-64 | 64px | 4rem |
| spacing-80 | 80px | 5rem |
| spacing-96 | 96px | 6rem |
| spacing-112 | 112px | 7rem |
| spacing-127 | 127px | 7.9375rem |
| spacing-160 | 160px | 10rem |
| spacing-173 | 173px | 10.8125rem |
| spacing-178 | 178px | 11.125rem |
| spacing-200 | 200px | 12.5rem |
| spacing-208 | 208px | 13rem |
| spacing-232 | 232px | 14.5rem |
| spacing-260 | 260px | 16.25rem |
| spacing-279 | 279px | 17.4375rem |
| spacing-332 | 332px | 20.75rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| md | 7px | 11 |
| lg | 11px | 15 |
| lg | 14px | 9 |
| xl | 18px | 6 |
| xl | 22px | 2 |
| full | 26px | 1 |
| full | 34px | 1 |
| full | 38px | 5 |
| full | 45px | 1 |
| full | 48px | 2 |
| full | 9999px | 42 |

## Box Shadows

**sm** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(33, 28, 20, 0.12) 0px 12px 34px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.15) 0px 6px 16px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.07) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 24px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.12) 0px 2px 6px -2px;
```

**sm (inset)** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px inset, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
```

**sm (inset)** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px inset, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.28) 0px 18px 44px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(35, 45, 60, 0.18) 0px 18px 44px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.16) 0px 8px 18px 0px;
```

**sm (inset)** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.9) 0px 1px 0px 0px inset;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 8px 24px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 85, 29, 0.12) 0px 0px 0px 3px;
```

**sm** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(176, 176, 176, 0.25) 0px 4px 10px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(176, 176, 176, 0.25) 0px 4px 10px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.12) 0px 4px 20px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(255, 255, 255) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(98, 137, 43, 0.16) 0px 22px 55px 0px;
```

**sm (inset)** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.16) 0px 0px 0px 1px inset;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.04) 0px 18px 45px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.043) 0px 24px 70px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.14) 0px 24px 70px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 85, 29, 0.38) 0px 0px 22px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 16px 45px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 10px 25px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.14) 0px 14px 35px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.18) 0px 24px 70px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.16) 0px 16px 35px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.2) 0px 18px 45px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 85, 29, 0.32) 0px 16px 40px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgb(16, 16, 16) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.07) 0px 12px 30px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.043) 0px 10px 26px 0px;
```

## CSS Custom Properties

### Colors

```css
--foreground: 222.2 84% 4.9%;
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--popover: 0 0% 100%;
--popover-foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96.1%;
--secondary-foreground: 222.2 47.4% 11.2%;
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;
--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;
--destructive: 0 84.2% 60.2%;
--destructive-foreground: 210 40% 98%;
--border: 214.3 31.8% 91.4%;
--ring: 222.2 84% 4.9%;
--tw-ring-offset-shadow: 0 0 #0000;
--tw-ring-shadow: 0 0 #0000;
--sidebar-primary-foreground: 0 0% 100%;
--tw-ring-inset: ;
--sidebar-accent-foreground: 240 4.8% 95.9%;
--tw-border-spacing-x: 0;
--tw-ring-color: rgba(59,130,246,.5);
--tw-ring-offset-color: #fff;
--chart-5: 340 75% 55%;
--sidebar-border: 240 3.7% 15.9%;
--sidebar-foreground: 240 4.8% 95.9%;
--sidebar-accent: 240 3.7% 15.9%;
--tw-ring-offset-width: 0px;
--chart-3: 30 80% 55%;
--tw-shadow-colored: 0 0 #0000;
--tw-border-spacing-y: 0;
--chart-4: 280 65% 60%;
--chart-2: 160 60% 45%;
--sidebar-primary: 224.3 76.3% 48%;
--sidebar-ring: 217.2 91.2% 59.8%;
--chart-1: 189 94% 43%;
```

### Spacing

```css
--tw-numeric-spacing: ;
--tw-contain-size: ;
```

### Typography

```css
--font-matemasie: "__matemasie_2729ec","__matemasie_Fallback_2729ec";
--font-cherry-bomb: "__cherryBombOne_d0ce59","__cherryBombOne_Fallback_d0ce59";
--font-inconsolata: "__Inconsolata_c86147","__Inconsolata_Fallback_c86147";
--font-boldonse: "__boldonse_dbafd1","__boldonse_Fallback_dbafd1";
--font-anton-sc: "__Anton_ec6dc7","__Anton_Fallback_ec6dc7";
--font-inter: "__Inter_f367f3","__Inter_Fallback_f367f3";
--font-instrument-sans: "__Instrument_Sans_3d9088","__Instrument_Sans_Fallback_3d9088";
--font-stack-sans: "__stackSansText_3cee34","__stackSansText_Fallback_3cee34";
--font-kode-mono: "__Kode_Mono_886240";
--font-modak: "__Modak_0fbd6a","__Modak_Fallback_0fbd6a";
--font-departure-mono: "__departureMono_1ea498","__departureMono_Fallback_1ea498";
--font-degular-display: "__degularDisplay_1e8a8c","__degularDisplay_Fallback_1e8a8c";
--font-neue-montreal: "__neueMontreal_8db69f","__neueMontreal_Fallback_8db69f";
```

### Shadows

```css
--tw-drop-shadow: ;
--tw-shadow: 0 0 #0000;
```

### Radii

```css
--radius: 0.75rem;
```

### Other

```css
--background: 0 0% 100%;
--input: 214.3 31.8% 91.4%;
--brand-yellow: 43 100% 70%;
--brand-pink: 346 84% 61%;
--brand-teal: 158 94% 42%;
--brand-navy: 0 0% 15%;
--brand-light: 0 0% 98%;
--sidebar-background: 240 5.9% 10%;
--tw-backdrop-sepia: ;
--tw-sepia: ;
--tw-ordinal: ;
--tw-backdrop-saturate: ;
--tw-contain-style: ;
--tw-backdrop-invert: ;
--tw-brightness: ;
--tw-backdrop-grayscale: ;
--tw-hue-rotate: ;
--tw-scale-y: 1;
--tw-pan-y: ;
--tw-backdrop-contrast: ;
--tw-backdrop-brightness: ;
--tw-pan-x: ;
--tw-translate-y: 0;
--tw-rotate: 0;
--tw-contrast: ;
--tw-skew-x: 0;
--tw-backdrop-blur: ;
--tw-translate-x: 0;
--tw-gradient-via-position: ;
--tw-saturate: ;
--tw-scroll-snap-strictness: proximity;
--tw-grayscale: ;
--tw-scale-x: 1;
--tw-backdrop-hue-rotate: ;
--tw-gradient-to-position: ;
--tw-numeric-fraction: ;
--tw-skew-y: 0;
--tw-slashed-zero: ;
--tw-blur: ;
--tw-invert: ;
--tw-backdrop-opacity: ;
--tw-gradient-from-position: ;
--tw-numeric-figure: ;
--tw-pinch-zoom: ;
--tw-contain-paint: ;
--tw-contain-layout: ;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| xs | 380px | min-width |
| sm | 600px | max-width |
| sm | 640px | min-width |
| md | 768px | min-width |
| lg | 1024px | min-width |
| xl | 1280px | min-width |
| 1400px | 1400px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`

**Durations:** `0.3s`, `0.2s`, `0.15s`, `0.5s`

### Common Transitions

```css
transition: all;
transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), fill 0.3s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1);
transition: transform 0.3s cubic-bezier(0, 0, 0.2, 1);
transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
transition: 0.2s cubic-bezier(0, 0, 0.2, 1);
transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), fill 0.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.2s cubic-bezier(0.4, 0, 0.2, 1);
transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
transition: opacity 0.5s cubic-bezier(0, 0, 0.2, 1);
transition: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

### Keyframe Animations

**ping**
```css
@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}
```

**pulse**
```css
@keyframes pulse {
  50% { opacity: 0.5; }
}
```

**spin**
```css
@keyframes spin {
  100% { transform: rotate(1turn); }
}
```

**enter**
```css
@keyframes enter {
  0% { opacity: var(--tw-enter-opacity,1); transform: translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0) scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1)) rotate(var(--tw-enter-rotate,0)); }
}
```

**exit**
```css
@keyframes exit {
  100% { opacity: var(--tw-exit-opacity,1); transform: translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0) scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1)) rotate(var(--tw-exit-rotate,0)); }
}
```

**magic-flow**
```css
@keyframes magic-flow {
  0% { background-position: 0px 0px; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0px 0px; }
}
```

**flip-top**
```css
@keyframes flip-top {
  100% { transform: rotateX(-180deg); }
}
```

**flip-bottom**
```css
@keyframes flip-bottom {
  100% { transform: rotateX(0deg); }
}
```

**pulse-slow**
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
```

**fade-in**
```css
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0px); }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (15 instances)

```css
.button {
  background-color: rgb(255, 255, 255);
  color: rgb(250, 250, 250);
  font-size: 16px;
  font-weight: 400;
  padding-top: 24px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Cards (20 instances)

```css
.card {
  background-color: rgb(255, 255, 255);
  border-radius: 11px;
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.12) 0px 2px 6px -2px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (22 instances)

```css
.link {
  color: rgb(0, 0, 0);
  font-size: 23px;
  font-weight: 500;
}
```

### Navigation (4 instances)

```css
.navigatio {
  color: rgb(0, 0, 0);
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Footer (1 instances)

```css
.foote {
  background-color: rgb(246, 246, 243);
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 16px;
}
```

### Dropdowns (2 instances)

```css
.dropdown {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 0px;
  box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(35, 45, 60, 0.18) 0px 18px 44px 0px;
  border-color: rgb(38, 38, 38);
  padding-top: 0px;
}
```

### Avatars (7 instances)

```css
.avatar {
  border-radius: 9999px;
  background-color: rgb(255, 255, 255);
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 3 instances, 3 variants

**Variant 1** (1 instance)

```css
  background: rgb(27, 27, 27);
  color: rgba(255, 255, 255, 0.9);
  padding: 0px 0px 0px 0px;
  border-radius: 9999px;
  border: 0px solid rgb(38, 38, 38);
  font-size: 16px;
  font-weight: 400;
```

**Variant 2** (1 instance)

```css
  background: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  padding: 0px 20px 0px 20px;
  border-radius: 24px;
  border: 0px solid rgb(38, 38, 38);
  font-size: 28px;
  font-weight: 700;
```

**Variant 3** (1 instance)

```css
  background: rgb(255, 85, 29);
  color: rgb(255, 255, 255);
  padding: 0px 24px 0px 24px;
  border-radius: 22px;
  border: 0px solid rgb(38, 38, 38);
  font-size: 26px;
  font-weight: 700;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 35px 0px 35px;
  border-radius: 23px;
  border: 0px solid rgb(38, 38, 38);
  font-size: 24px;
  font-weight: 700;
```

### Button — 2 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  padding: 12px 16px 12px 16px;
  border-radius: 18px;
  border: 0px solid rgb(38, 38, 38);
  font-size: 16px;
  font-weight: 400;
```

**Variant 2** (1 instance)

```css
  background: rgba(255, 255, 255, 0.12);
  color: rgb(255, 255, 255);
  padding: 12px 16px 12px 16px;
  border-radius: 18px;
  border: 0px solid rgb(38, 38, 38);
  font-size: 16px;
  font-weight: 400;
```

### Button — 8 instances, 1 variant

**Variant 1** (8 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(250, 250, 250);
  padding: 24px 0px 24px 0px;
  border-radius: 0px;
  border: 0px solid rgb(38, 38, 38);
  font-size: 16px;
  font-weight: 400;
```

## Layout System

**28 grid containers** and **143 flex containers** detected.

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 1280px | 0px |
| 100% | 0px |
| 1152px | 24px |
| 288px | 0px |
| 1173px | 0px |
| 1180px | 32px |
| 770px | 40px |
| 760px | 0px |
| 1020px | 0px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 3-column | 10x |
| 2-column | 9x |
| 1-column | 8x |
| 4-column | 1x |

### Grid Templates

```css
grid-template-columns: 1116px;
gap: 160px;
grid-template-columns: 858px 230px;
gap: 28px;
grid-template-columns: 461.828px 542.172px;
gap: 16px;
grid-template-columns: 1036px;
gap: 12px;
grid-template-columns: 404.656px 404.672px 404.656px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| column/nowrap | 12x |
| row/nowrap | 126x |
| row/wrap | 5x |

**Gap values:** `10px`, `12px`, `12px 20px`, `13px`, `160px`, `16px`, `20px`, `24px`, `28px`, `32px`, `32px 24px`, `36px`, `40px`, `4px`, `4px 8px`, `6px`, `8px`

## Responsive Design

### Viewport Snapshots

| Viewport | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
|----------|-----------|-------------|-------------|-----------|-------------|
| mobile (375px) | 16px | Yes | 3 | Yes | 10959px |
| tablet (768px) | 16px | Yes | 4 | No | 11098px |
| desktop (1280px) | 16px | Yes | 4 | No | 9972px |
| wide (1920px) | 16px | Yes | 4 | No | 10135px |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):
- H1 size: `52px` → `68px`
- Hamburger menu: `shown` → `hidden`
- Max grid columns: `3` → `4`

**768px → 1280px** (tablet → desktop):
- H1 size: `68px` → `80px`
- Page height: `11098px` → `9972px`

## Interaction States

### Button States

**""**
```css
/* Hover */
transform: none → matrix(1.04605, 0, 0, 1.04605, 0, 0);
```
```css
/* Focus */
transform: none → matrix(1.05, 0, 0, 1.05, 0, 0);
outline: rgba(255, 255, 255, 0.9) none 3px → rgb(16, 16, 16) auto 1px;
```

**"Download Free"**
```css
/* Hover */
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px inset, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.28) 0px 18px 44px 0px → rgb(255, 255, 255) 0px 0px 0px 0px inset, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.333) 0px 21.4482px 52.6205px 0px;
transform: none → matrix(1.01724, 0, 0, 1.01724, 0, 0);
```
```css
/* Focus */
box-shadow: rgb(255, 255, 255) 0px 0px 0px 0px inset, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.28) 0px 18px 44px 0px → rgb(255, 255, 255) 0px 0px 0px 0px inset, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.34) 0px 22px 54px 0px;
transform: none → matrix(1.02, 0, 0, 1.02, 0, 0);
```

**"Yearly$49/yr$12060% off"**
```css
/* Focus */
outline: rgb(0, 0, 0) none 3px → rgb(16, 16, 16) auto 1px;
```

### Link Hover

```css
transform: none → matrix(1.00837, 0, 0, 1.00837, 0, 0);
```

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 11 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#000000` | `#ffffff` | 21:1 | AAA |
| `#fcfcfc` | `#595050` | 7.61:1 | AAA |
| `#ffffff` | `#171717` | 17.93:1 | AAA |
| `#ffffff` | `#262626` | 15.13:1 | AAA |
| `#ffffff` | `#ff551d` | 3.2:1 | AA |

## Design System Score

**Overall: 80/100 (Grade: B)**

| Category | Score |
|----------|-------|
| Color Discipline | 92/100 |
| Typography Consistency | 70/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 50/100 |
| Border Radius Consistency | 65/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 100/100 |

**Strengths:** Tight, disciplined color palette, Well-defined spacing scale, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 28 distinct font sizes — consider a tighter type scale
- 32 unique shadows — consider a 3-level elevation scale (sm/md/lg)
- 76 !important rules — prefer specificity over overrides
- 88% of CSS is unused — consider purging
- 3164 duplicate CSS declarations

## Gradients

**3 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| linear | — | 6 | complex |
| linear | — | 2 | brand |
| linear | to top | 3 | bold |

```css
background: linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255) 17%, rgba(255, 255, 255, 0.55) 30%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0) 88%, rgb(250, 250, 248));
background: linear-gradient(rgb(44, 44, 44), rgb(20, 20, 20));
background: linear-gradient(to top, rgb(255, 255, 255), rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0));
```

## Z-Index Map

**16 unique z-index values** across 2 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| sticky | 10,90 | div.r.e.l.a.t.i.v.e. .z.-.1.0. .m.x.-.a.u.t.o. .w.-.f.u.l.l. .m.a.x.-.w.-.6.x.l. .p.x.-.4. .p.t.-.5. .s.m.:.p.x.-.6. .s.m.:.p.t.-.7, div.r.e.l.a.t.i.v.e. .z.-.1.0. .w.-.f.u.l.l. .m.a.x.-.w.-.6.x.l. .p.x.-.4. .s.m.:.p.x.-.6, div.a.b.s.o.l.u.t.e. .z.-.1.0. .w.-.[.1.8.8.p.x.]. .m.a.x.-.w.-.[.5.8.v.w.]. .r.o.u.n.d.e.d.-.[.1.4.p.x.]. .b.g.-.w.h.i.t.e. .p.x.-.3. .p.y.-.2. .s.h.a.d.o.w.-.[.0._.4.p.x._.2.0.p.x._.r.g.b.a.(.0.,.0.,.0.,.0...1.2.).]. .s.m.:.w.-.[.2.2.0.p.x.]. .s.m.:.m.a.x.-.w.-.[.2.2.0.p.x.] |
| base | -10,7 | img.p.o.i.n.t.e.r.-.e.v.e.n.t.s.-.n.o.n.e. .a.b.s.o.l.u.t.e. .i.n.s.e.t.-.0. .-.z.-.1.0. .s.e.l.e.c.t.-.n.o.n.e. .o.b.j.e.c.t.-.c.o.v.e.r. .o.b.j.e.c.t.-.[.c.e.n.t.e.r._.5.8.%.], div.p.o.i.n.t.e.r.-.e.v.e.n.t.s.-.n.o.n.e. .a.b.s.o.l.u.t.e. .i.n.s.e.t.-.0. .-.z.-.1.0. .b.g.-.[.l.i.n.e.a.r.-.g.r.a.d.i.e.n.t.(.1.8.0.d.e.g.,.#.f.f.f.f.f.f._.0.%.,.#.f.f.f.f.f.f._.1.7.%.,.r.g.b.a.(.2.5.5.,.2.5.5.,.2.5.5.,.0...5.5.)._.3.0.%.,.r.g.b.a.(.2.5.5.,.2.5.5.,.2.5.5.,.0.)._.5.0.%.,.r.g.b.a.(.2.5.5.,.2.5.5.,.2.5.5.,.0.)._.8.8.%.,.#.F.A.F.A.F.8._.1.0.0.%.).], div.r.e.l.a.t.i.v.e. .z.-.0. .m.t.-.[.-.6.4.p.x.]. .w.-.f.u.l.l. .p.x.-.0. .p.b.-.0. .s.m.:.m.t.-.[.-.1.4.0.p.x.] |

## SVG Icons

**15 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| xs | 1 |
| sm | 2 |
| md | 7 |
| lg | 1 |
| xl | 4 |

**Icon colors:** `currentColor`, `rgb(0, 0, 0)`, `rgb(255, 255, 255)`, `#2196F3`, `white`, `#3DDC84`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| __Inconsolata_c86147 | self-hosted | 200 900 | normal |
| __Instrument_Sans_3d9088 | self-hosted | 400 700 | normal |
| __Kode_Mono_886240 | self-hosted | 400 700 | normal |
| __neueMontreal_8db69f | self-hosted | 300, 400, 500, 700 | normal |
| __Inter_f367f3 | self-hosted | 100 900 | normal |
| __Modak_0fbd6a | self-hosted | 400 | normal |
| __Anton_ec6dc7 | self-hosted | 400 | normal |
| __matemasie_2729ec | self-hosted | 400, normal | normal |
| __stackSansText_3cee34 | self-hosted | 400 700 | normal |
| __degularDisplay_1e8a8c | self-hosted | 400, 500, 600, 700, 900 | normal, italic |
| __cherryBombOne_d0ce59 | self-hosted | 400, normal | normal |
| __boldonse_dbafd1 | self-hosted | 400, normal | normal |
| __departureMono_1ea498 | self-hosted | 400, normal | normal |

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 32 | objectFit: contain, borderRadius: 0px, shape: square |
| general | 7 | objectFit: fill, borderRadius: 0px, shape: square |
| avatar | 7 | objectFit: fill, borderRadius: 9999px, shape: circular |
| gallery | 4 | objectFit: fill, borderRadius: 0px, shape: square |
| hero | 1 | objectFit: cover, borderRadius: 0px, shape: square |

**Aspect ratios:** 1:1 (39x), 9:16 (4x), 3:2 (4x), 4:3 (2x), 2:3 (1x), 3:4 (1x)

## Motion Language

**Feel:** mixed · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `xs` | `150ms` | 150 |
| `sm` | `200ms` | 200 |
| `md` | `300ms` | 300 |
| `lg` | `500ms` | 500 |

### Easing Families

- **custom** (43 uses) — `cubic-bezier(0.4, 0, 0.2, 1)`
- **ease-out** (6 uses) — `cubic-bezier(0, 0, 0.2, 1)`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `ping` | reveal | transform, opacity | 1 |

## Component Anatomy

### button — 14 instances

**Slots:** label, icon
**Variants:** outline
**Sizes:** sm

| variant | count | sample label |
|---|---|---|
| default | 13 | Yearly
$49
/yr
$120
60% off |
| outline | 1 | Download Free |

## Brand Voice

**Tone:** friendly · **Pronoun:** you-only · **Headings:** Title Case (tight)

### Top CTA Verbs

- **what** (3)
- **download** (1)
- **yearly** (1)
- **monthly** (1)
- **join** (1)
- **own** (1)
- **do** (1)
- **can** (1)

### Button Copy Patterns

- "download free" (1×)
- "yearly
$49
/yr
$120
60% off" (1×)
- "monthly
$5.99
/mo
$14.99
60% off" (1×)
- "join pro for $49" (1×)
- "own clonk forever" (1×)
- "what is clonk?" (1×)
- "do i need to pay for ai on top of this?" (1×)
- "what does the autonomous loop actually do?" (1×)
- "can i use clonk if i'm not a developer?" (1×)
- "what can i actually build with it?" (1×)

### Sample Headings

> Agentic Dev Superapp
> Automate Your / Plans
> Autonomous Dev Loops
> Clonk from Anywhere
> Parallel Work
> Agentic Dev Superapp
> Automate Your / Plans
> Autonomous Dev Loops
> Clonk from Anywhere
> Parallel Work

## Page Intent

**Type:** `landing` (confidence 0.29)
**Description:** crack vibe coding: agents, skills, commands, to ship faster and cheaper

Alternates: legal (0.4), blog-post (0.35)

## Section Roles

Reading order (top→bottom): pricing-table → hero → nav → nav → pricing-table → faq → footer → nav → content

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | pricing-table | Agentic Dev Superapp | 0.9 |
| 1 | hero | Agentic Dev Superapp | 0.85 |
| 2 | nav | — | 0.4 |
| 3 | nav | — | 0.9 |
| 4 | pricing-table | Automate Your / Plans | 0.9 |
| 5 | faq | FAQ | 0.85 |
| 6 | footer | Ship apps without burning credits. | 0.95 |
| 7 | nav | — | 0.9 |
| 8 | content | — | 0.3 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.157 |
| Shadow profile | soft |
| Avg shadow blur | 0px |
| Max radius | 9999px |
| backdrop-filter in use | no |
| Gradients | 3 |

## Imagery Style

**Label:** `photography` (confidence 0.046)
**Counts:** total 51, svg 14, icon 19, screenshot-like 0, photo-like 0
**Dominant aspect:** square-ish
**Radius profile on images:** rounded

## Component Library

**Detected:** `tailwindcss` (confidence 0.877)

Evidence:
- tailwind-like class density 83%

## Component Screenshots

6 retina crops written to `screenshots/`. Index: `*-screenshots.json`.

| Cluster | Variant | Size (px) | File |
|---------|---------|-----------|------|
| button--default | 0 | 40 × 40 | `screenshots/button-default-0.png` |
| button--default | 1 | 225 × 118 | `screenshots/button-default-1.png` |
| button--default | 2 | 225 × 118 | `screenshots/button-default-2.png` |
| button--outline--sm | 0 | 283 × 70 | `screenshots/button-outline-sm-0.png` |
| button--default--sm | 0 | 476 × 72 | `screenshots/button-default-sm-0.png` |
| button--default--sm | 1 | 300 × 68 | `screenshots/button-default-sm-1.png` |

Full-page: `screenshots/full-page.png`

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `__neueMontreal_8db69f` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
