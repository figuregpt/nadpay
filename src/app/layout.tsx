import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "NadPay - Payment Solutions on Monad",
  description: "Create payment links, subscriptions, and more on the Monad blockchain",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'android-chrome', url: '/android-icon-36x36.png', sizes: '36x36' },
      { rel: 'android-chrome', url: '/android-icon-48x48.png', sizes: '48x48' },
      { rel: 'android-chrome', url: '/android-icon-72x72.png', sizes: '72x72' },
      { rel: 'android-chrome', url: '/android-icon-96x96.png', sizes: '96x96' },
      { rel: 'android-chrome', url: '/android-icon-144x144.png', sizes: '144x144' },
      { rel: 'android-chrome', url: '/android-icon-192x192.png', sizes: '192x192' }
    ]
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#836EF9',
    'msapplication-TileImage': '/ms-icon-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#836EF9'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon-180x180.png" />
        <meta name="msapplication-TileColor" content="#836EF9" />
        <meta name="theme-color" content="#836EF9" />
      </head>
      <body className={`${inter.className} font-inter`}>
        <Web3Provider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
