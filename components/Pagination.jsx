import React from 'react';
import styles from '../styles/Pagination.module.css';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null; // No pagination needed

  return (
    <div className={styles.pagination}>
      {/* Jump to first page */}
      <button onClick={() => onPageChange(1)} disabled={page === 1}>
        «
      </button>

      {/* Previous page */}
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        ‹
      </button>

      {/* Page numbers (desktop) */}
      <div className={styles.desktopPages}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <button
                key={p}
                className={page === p ? styles.activePage : ''}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            );
          }
          if ((p === page - 2 && p > 1) || (p === page + 2 && p < totalPages)) {
            return <span key={p}>…</span>;
          }
          return null;
        })}
      </div>

      {/* Current page info (mobile) */}
      <span className={styles.mobilePages}>
        Page {page} of {totalPages}
      </span>

      {/* Next page */}
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        ›
      </button>

      {/* Jump to last page */}
      <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
        »
      </button>
    </div>
  );
};

export default Pagination;
