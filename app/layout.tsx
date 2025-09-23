import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./providers/theme-provider";
import { AuthProvider } from "../lib/auth-context";
import { ConfigProvider } from "../lib/providers/config-provider";
import { getSiteConfig } from "../lib/config-utils";
import BackToTop from "./components/BackToTop";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <ConfigProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ConfigProvider>
        </ThemeProvider>
        <BackToTop />
      </body>
    </html>
  );
}
