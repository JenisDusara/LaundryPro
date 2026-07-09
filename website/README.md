# LaundryPro — Marketing Website

Standalone Next.js 14 marketing site for LaundryPro, built with **framer-motion**,
**Tailwind CSS** and **lucide-react** icons. Follows the ui-ux-pro-max design
approach for a SaaS/business tool: conversion-optimized + trust-and-authority,
SVG icons (no emoji), 150–300ms hover transitions, `prefers-reduced-motion`
support, responsive from 375px up, and a full light/dark theme.

## Run

```bash
npm install
npm run dev     # http://localhost:3002
npm run build   # production build
npm start
```

## Structure

- `src/app/layout.tsx` — fonts (Inter + Sora), theme pre-paint script, metadata
- `src/app/globals.css` — Tailwind + light/dark CSS-variable tokens
- `src/lib/site.ts` — all content + contact config (WhatsApp number, demo link)
- `src/components/theme/` — `ThemeProvider` + `ThemeToggle`
- `src/components/ui/` — `Reveal`, `Counter`, `Logo`, buttons/container primitives
- `src/components/sections/` — Navbar, Hero, TrustBar, Problem, HowItWorks,
  Features, WhatsApp, Testimonials, CTA, Footer

## Configuration

Edit `src/lib/site.ts` to change:

- `WHATSAPP_NUMBER` / `WHATSAPP_DISPLAY` — currently +91 98244 36736
- `DEMO_URL` — currently `/dashboard`
