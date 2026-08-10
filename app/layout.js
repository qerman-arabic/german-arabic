import './globals.css';

export const metadata = {
  title: 'German بالعربي | تعلم الألمانية بالعربية',
  description: 'منصة عربية متكاملة لتعلم الألمانية حتى B1 بأسلوب امتحان Goethe',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}