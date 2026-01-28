import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const baseUrl = 'https://www.Amazon.com'; // your site URL
  const pagesDir = path.join(process.cwd(), 'pages');

  // Read all page files
  const getPages = (dir) => {
    const files = fs.readdirSync(dir);
    let pages = [];

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        pages = pages.concat(getPages(filePath));
      } else if (file.endsWith('.js') && !file.startsWith('_') && !file.startsWith('api')) {
        const page = file.replace('.js', '');
        pages.push('/' + page);
      }
    });

    return pages;
  };

  const pages = getPages(pagesDir);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
      .map(
        (page) => `
      <url>
        <loc>${baseUrl}${page === '/index' ? '' : page}</loc>
      </url>`,
      )
      .join('')}
  </urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
}
