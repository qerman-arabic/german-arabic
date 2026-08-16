export default function sitemap() {
  const base = 'https://german-arabic.vercel.app';

  const routes = [
    '/', '/explore', '/grammar', '/reading', '/listening',
    '/speaking', '/writing', '/goethe', '/ai', '/quiz',
    '/premium', '/login', '/register',
  ];

  return routes.map((r) => ({
    url: base + r,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: r === '/' ? 1 : 0.8,
  }));
}