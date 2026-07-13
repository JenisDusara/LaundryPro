# Installable App (PWA) — Plan & Implementation

Turn LaundryPro into an installable Progressive Web App so shop owners can add
it to their phone home screen and run it **full-screen (standalone)** — no
browser address/nav bars — with an app icon, just like a native app.

## Goal

The app is used mostly on phones. In a normal browser tab the address bar and
the OS gesture/nav bar eat screen space and cause layout quirks. Making it a PWA
gives:
- **Add to Home Screen** with the LaundryPro icon.
- Full-screen standalone launch (browser chrome gone).
- Faster repeat loads + a small offline shell.

No native build, no app store — pure web.

## How it works

```
Browser loads any page
   │
   ├─ <link rel="manifest" href="/manifest.webmanifest">   (from app/manifest.ts)
   │      display: standalone · start_url: /dashboard · theme_color · icon
   │
   ├─ PWARegister (client) registers /sw.js                (service worker)
   │      network-first · never caches /api/* · tiny offline shell
   │
   └─ appleWebApp metadata + theme-color                   (iOS full-screen)

Install:
  Android Chrome → install prompt / ⋮ → "Add to Home Screen"
  iOS Safari     → Share → "Add to Home Screen"
  (requires HTTPS — i.e. the deployed site, not localhost)
```

## Files

- `src/app/manifest.ts` — generates `/manifest.webmanifest`
  (`name`, `short_name`, `start_url: /dashboard`, `display: standalone`,
  `theme_color: #1e40af`, `background_color`, icon).
- `public/app-icon.png` — the shop's actual logo, used as the home-screen /
  install icon (`sizes: "716x590"`, `type: image/png`). Named `app-icon` (not
  `icon`) to avoid colliding with the Next.js `app/icon.svg` favicon route.
- `public/sw.js` — service worker. Network-first; skips `/api/*` so data is
  always fresh; falls back to a cached `/dashboard` shell when offline.
- `src/components/PWARegister.tsx` — registers the service worker on load
  (best-effort; never blocks the app). Mounted once in `src/app/layout.tsx`.
- `src/app/layout.tsx` — adds `manifest`, `appleWebApp` (iOS standalone +
  title), `icons.apple`, and `themeColor` (in the `viewport` export).

## Notes / gotchas

- **HTTPS required.** Service workers and the install prompt only work over
  HTTPS (or `localhost`). On the deployed site the prompt appears; on plain
  `http://` LAN IPs it won't.
- The icon is the shop's logo PNG (`public/app-icon.png`). It isn't square
  (716×590), so launchers letterbox/center it; swap in a square PNG later if a
  tighter home-screen icon is wanted. iOS uses the same file as the `apple`
  touch icon.
- The service worker is intentionally simple (network-first) so the app never
  serves stale pages or cached API data. Bump the `CACHE` version in `sw.js`
  when you want to force-drop the old shell cache.
