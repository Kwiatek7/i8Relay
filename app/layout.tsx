import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers/theme-provider";
import { AuthProvider } from "../lib/auth-context";
import { ConfigProvider } from "../lib/providers/config-provider";
import { getSiteConfig } from "../lib/config-utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();

  const title = config.seo_title || `${config.site_name} - 最稳定的AI中转站`;
  const description = config.seo_description || config.site_description;
  const siteName = config.site_name;

  return {
    title,
    description,
    keywords: config.seo_keywords || "AI API, Claude API, GPT API, Gemini API, AI中转, API代理, AI模型, 人工智能, 开发者工具",
    authors: [{ name: siteName }],
    robots: "index, follow",
    openGraph: {
      title,
      description,
      siteName,
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <ConfigProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
