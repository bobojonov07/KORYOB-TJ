import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'KORYOB.TJ — Платформаи №1 барои дарёфти ҷойҳои корӣ дар Тоҷикистон',
  description: 'Кори орзуи худро ёбед. Платформаи муосир барои пайваст кардани корҷӯён ва корфармоён. Барномасоз: Бобоҷонзода Аминҷон',
  keywords: 'кор, кор дар Тоҷикистон, ҷойи кор, Душанбе, Хуҷанд, корфармо, корҷӯ',
  authors: [{ name: 'Бобоҷонзода Аминҷон' }],
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tg">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1723988485446029"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-body antialiased selection:bg-primary/30">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
