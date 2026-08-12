import Script from 'next/script';
import './globals.css';

import AdminLink from '../components/AdminLink';

export const metadata = {
  title: 'German بالعربي — تعلّم الألمانية',
  description: 'منصة عربية متكاملة للتحضير لامتحان Goethe من A1 حتى B2',
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