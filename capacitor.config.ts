import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.manhwareader.app",
  appName: "Manhwa Reader",
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || "https://manhwa-reader.vercel.app",
    cleartext: true,
    allowNavigation: ["*"],
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#0d0d0d",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#6366f1",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0d0d0d",
    },
  },
};

export default config;
