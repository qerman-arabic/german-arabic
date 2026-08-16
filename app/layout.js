import Script from 'next/script';
import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import AdminLink from '../components/AdminLink';
import Footer from '../components/Footer';

export const metadata = {
  metadataBase: new URL('https://german-arabic.vercel.app'),

  title: {
    default: 'German بالعربي — تعلّم الألمانية حتى امتحان Goethe',
    template: '%s | German بالعربي',
  },
  description:
    'منصة عربية متكاملة لتعلّم الألمانية من الصفر حتى امتحان Goethe: دروس، 80 نموذج امتحان، معلم ذكاء اصطناعي، وشهادات PDF باسمك. جرّبها مجانًا بدون تسجيل.',
  keywords: [
    'تعلم الألمانية',
    'الألمانية بالعربية',
    'امتحان Goethe',
    'A1 A2 B1 B2',
    'أوسبيلدونغ',
    'الهجرة إلى ألمانيا',
    'الدراسة في ألمانيا',
  ],
  authors: [{ name: 'German بالعربي' }],
  creator: 'German بالعربي',
  publisher: 'German بالعربي',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    title: 'German بالعربي — تعلّم الألمانية حتى امتحان Goethe',
    description:
      'دروس بالعربية، 80 نموذج امتحان، معلم ذكاء اصطناعي يصححك فورًا، وشهادات باسمك. جرّبها مجانًا!',
    url: 'https://german-arabic.vercel.app',
    siteName: 'German بالعربي',
    locale: 'ar_AR',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'German بالعربي',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'German بالعربي — تعلّم الألمانية حتى Goethe',
    description:
      'منصة عربية كاملة: دروس + 80 نموذج + معلم AI + شهادات. جرّبها مجانًا!',
    images: ['/logo.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* الخط العربي */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* PWA: تطبيق قابل للتثبيت */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f766e" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="German بالعربي" />
      </head>
      <body>
        {children}
        <Footer />
        <Analytics />
        <AdminLink />

        {/* تسجيل عامل الخدمة للتطبيق */}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js');
            });
          }`}
        </Script>
      </body>
    </html>
  );
}