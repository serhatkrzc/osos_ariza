'use client';

import React from 'react';
import styles from './Card.module.css';

export default function Card({ title, subtitle, extraHeader, children, className = '' }) {
  return (
    <div className={`glass ${styles.card} ${className}`}>
      {(title || extraHeader) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {extraHeader && <div className={styles.extra}>{extraHeader}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
