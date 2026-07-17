import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SocialOS - AI Social Media Platform",
  description: "Compose, schedule, automate, and understand your social media with AI.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a2035",
              color: "#f1f5f9",
              border: "1px solid #2a3244",
              borderRadius: "10px",
            },
          }}
        />
      </body>
    </html>
  );
}
