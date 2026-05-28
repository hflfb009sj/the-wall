import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { PiAuthProvider } from "@/contexts/pi-auth-context";
import { WallProvider } from "@/contexts/wall-context";
import { MoodProvider } from "@/contexts/mood-context";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "The Wall — Engrave Your Eternal Sigil",
  description: "Your unique sigil, engraved forever on the pioneer wall. Built on Pi Network.",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'The Wall' },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  userScalable: false, viewportFit: 'cover', themeColor: '#030205',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <script src="https://sdk.minepi.com/pi-sdk.js" async/>
      </head>
      <body>
        <MoodProvider>
          <PiAuthProvider>
            <WallProvider>
              <AppShell>{children}</AppShell>
            </WallProvider>
          </PiAuthProvider>
        </MoodProvider>
      </body>
    </html>
  );
}
