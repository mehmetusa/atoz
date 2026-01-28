// pages/sitemap.jsx
import Link from 'next/link';
import { useState } from 'react';
import styles from '../styles/Sitemap.module.css';

// Sitemap page
const Sitemap = ({ pages }) => {
  const renderPages = (pages) => (
    <ul className={styles.list}>
      {pages.map(({ name, path: pagePath, children }) => (
        <SitemapItem key={pagePath} name={name} path={pagePath} childrenPages={children} />
      ))}
    </ul>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sitemap</h1>
      {renderPages(pages)}
    </div>
  );
};

// Individual sitemap item
const SitemapItem = ({ name, path, childrenPages }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = childrenPages && childrenPages.length > 0;

  return (
    <li className={styles.listItem}>
      <div className={styles.itemHeader}>
        {hasChildren && (
          <button
            className={styles.toggleButton}
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▼' : '▶'}
          </button>
        )}
        <Link href={path} className={styles.link}>
          {name === 'index' ? 'Home' : name.replace(/\[|\]/g, '')}
        </Link>
      </div>
      {hasChildren && open && (
        <ul className={styles.nested}>
          {childrenPages.map((child) => (
            <SitemapItem key={child.path} {...child} />
          ))}
        </ul>
      )}
    </li>
  );
};

// --------------------
// Server-side only: build sitemap tree
// --------------------
const getPagesTree = (fs, path, dir, basePath = '') => {
  const files = fs.readdirSync(dir);
  let tree = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const children = getPagesTree(fs, path, filePath, `${basePath}/${file}`);
      if (children.length === 1 && children[0].name === 'index') {
        tree.push({ name: file, path: children[0].path, children: [] });
      } else if (children.length > 0) {
        tree.push({ name: file, path: `${basePath}/${file}`, children });
      }
    } else if (
      file.endsWith('.js') &&
      !file.startsWith('_') &&
      !file.startsWith('api') &&
      file !== 'sitemap.jsx'
    ) {
      const pageName = file.replace('.js', '');
      let routePath = basePath === '' ? `/${pageName}` : `${basePath}/${pageName}`;
      if (pageName === 'index') routePath = basePath || '/';
      tree.push({ name: pageName, path: routePath, children: [] });
    }
  });

  return tree;
};

// --------------------
// Only runs on server
// --------------------
export async function getStaticProps() {
  const fs = await import('fs').then((mod) => mod.default);
  const path = await import('path').then((mod) => mod.default);

  const pagesDir = path.join(process.cwd(), 'pages');
  const pages = getPagesTree(fs, path, pagesDir);

  return { props: { pages } };
}

export default Sitemap;
