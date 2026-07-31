@AGENTS.md

## Build & Deploy Checklist

1. **Lint first:** `npm run lint` — must be 0 errors
2. **Build:** `npx next build` — must pass
3. **Deploy site:** `npx vercel --yes --prod`
4. **Build APK:** `gh workflow run "Build Android APK" -f app_url=https://manhwa-reader-five.vercel.app`
5. **Watch APK build:** `gh run watch <RUN_ID> --exit-status`
6. **Download APK:** `gh run download <RUN_ID> -n <ARTIFACT_NAME> -D C:\Users\Admin\Desktop\apk`
7. **Install APK:** `C:\Users\Admin\Desktop\platform-tools\adb.exe install -r C:\Users\Admin\Desktop\apk\app-debug.apk`

## Notes

- Always commit and push before deploying
- The Vercel deploy alias is `manhwa-reader-five.vercel.app`
- APK artifact names follow pattern `ManhwaReader-debug-<run_number>`
- Use `adb uninstall com.manhwareader.app` if signature mismatch occurs
- `adb` is at `C:\Users\Admin\Desktop\platform-tools\adb.exe`
