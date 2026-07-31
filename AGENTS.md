<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Overview

**Manhwa Reader** — A webtoon/comic reader built with Next.js 16, deployed on Vercel, with an Android APK via Capacitor.

- **Repo:** https://github.com/Atisfied397/manhwa-reader
- **Site:** https://manhwa-reader-five.vercel.app
- **Admin email:** satyamkamat4@gmail.com
- **Firebase project:** manhwa-reader-c131d

## Build & Lint

```bash
npx next build          # production build
npm run lint            # must be 0 errors (29 pre-existing <img> warnings OK)
```

## Deploy to Vercel

```bash
npx vercel --yes --prod
```

Deploys to `manhwa-reader-five.vercel.app`. The CLI auto-links to the Vercel project `atisfied397s-projects/manhwa-reader`.

## Build Android APK (via GitHub Actions)

No local Android SDK required. APK is built in the cloud.

```bash
# Trigger the workflow
gh workflow run "Build Android APK" -f app_url=https://manhwa-reader-five.vercel.app

# Watch progress
gh run list --workflow=build-android.yml --limit=1
gh run watch <RUN_ID> --exit-status

# Download artifact
gh run download <RUN_ID> -n <ARTIFACT_NAME> -D C:\Users\Admin\Desktop\apk
```

**Install on connected device:**
```bash
C:\Users\Admin\Desktop\platform-tools\adb.exe install -r C:\Users\Admin\Desktop\apk\app-debug.apk
```

If signature mismatch error occurs, uninstall first:
```bash
C:\Users\Admin\Desktop\platform-tools\adb.exe uninstall com.manhwareader.app
C:\Users\Admin\Desktop\platform-tools\adb.exe install C:\Users\Admin\Desktop\apk\app-debug.apk
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (no Header/Footer)
│   ├── (site)/                 # Public pages with Header+Footer
│   │   ├── layout.tsx          # Header + Footer wrapper
│   │   ├── page.tsx            # Homepage
│   │   ├── browse/             # Browse comics
│   │   ├── reader/             # Chapter reader
│   │   ├── series/             # Series detail
│   │   ├── downloads/          # Offline downloads page
│   │   └── ...
│   ├── (auth)/login/           # Login/signup page (no Header/Footer)
│   │   ├── page.tsx
│   │   └── login-form.tsx
│   └── admin/                  # Admin panel (no Header/Footer)
│       ├── layout.tsx          # Sidebar + hamburger menu
│       ├── settings/
│       └── ...
├── components/
│   ├── AuthProvider.tsx         # Firebase auth (redirect on native, popup on web)
│   ├── Header.tsx              # Public site header
│   ├── Logo.tsx                # SVG logo component
│   ├── DownloadButton.tsx      # Chapter download UI
│   └── SearchBar.tsx
├── lib/
│   ├── firebase.ts             # Firebase config + auth init
│   ├── download-manager.ts     # Capacitor file download logic
│   └── scraper.ts              # Web scraping for chapters/pages
└── api/                        # Next.js API routes
    ├── admin/                  # Admin-only endpoints (session cookie protected)
    ├── scrape/                 # Scraping endpoints
    └── ...
```

## Key Technical Decisions

- **Route groups:** `(site)/` gets Header+Footer, `admin/` and `(auth)/` do not
- **Capacitor:** Remote-URL mode (loads Vercel in WebView), not static export
- **Auth:** Firebase; `signInWithRedirect` for native, `signInWithPopup` for web
- **Downloads:** Only enabled when `window.Capacitor?.isNativePlatform() === true`
- **APK builds:** GitHub Actions workflow (`.github/workflows/build-android.yml`)
- **Capacitor config:** `capacitor.config.ts` — URL replaced in CI via node script

## Firebase Auth Setup

Required in Firebase Console:
1. **Authentication → Sign-in method** → Enable **Email/Password**
2. **Authentication → Settings → Authorized domains** → Add `manhwa-reader-five.vercel.app`

## Common Commands

| Task | Command |
|------|---------|
| Build | `npx next build` |
| Lint | `npm run lint` |
| Deploy | `npx vercel --yes --prod` |
| Build APK | `gh workflow run "Build Android APK" -f app_url=https://manhwa-reader-five.vercel.app` |
| Watch build | `gh run watch <ID> --exit-status` |
| Download APK | `gh run download <ID> -n <NAME> -D C:\Users\Admin\Desktop\apk` |
| Install APK | `adb install -r C:\Users\Admin\Desktop\apk\app-debug.apk` |
| ADB devices | `C:\Users\Admin\Desktop\platform-tools\adb.exe devices` |
