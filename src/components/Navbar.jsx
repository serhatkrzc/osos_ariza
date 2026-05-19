'use client';

import React from 'react';
import styles from './Navbar.module.css';

export default function Navbar({ currentUser, onLogout, onRoleSwitch }) {
  if (!currentUser) return null;

  return (
    <nav className={`${styles.navbar} glass`}>
      <div className={styles.navbarContainer}>
        <div className={styles.brand}>
          <span className={styles.logoIcon}>⚡</span>
          <div>
            <h1 className={styles.title}>OSOS ARIZA</h1>
            <p className={styles.subtitle}>İstasyon ve Bakım Yönetim Sistemi</p>
          </div>
        </div>

        <div className={styles.userSection}>
          {/* Hızlı Rol Değiştirici - Test Kolaylığı İçin Premium Özellik */}
          {onRoleSwitch && (
            <div className={styles.roleSwitcher}>
              <span className={styles.switchLabel}>Hızlı Test:</span>
              <button 
                onClick={() => onRoleSwitch(currentUser.role === 'yetkili' ? 'tekniker' : 'yetkili')}
                className={`${styles.switchBtn} btn btn-secondary`}
                title="Hızlıca Rol Değiştir"
              >
                🔄 {currentUser.role === 'yetkili' ? 'Tekniker Ol' : 'Yetkili Ol'}
              </button>
            </div>
          )}

          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{currentUser.full_name}</span>
              <span className={`${styles.userRole} badge ${
                currentUser.role === 'yetkili' ? 'badge-acil' : 'badge-yapildi'
              }`}>
                {currentUser.role === 'yetkili' ? '🔑 YETKİLİ' : '🔧 TEKNİKER'}
              </span>
            </div>
          </div>

          <button onClick={onLogout} className={`${styles.logoutBtn} btn`}>
            🚪 Çıkış
          </button>
        </div>
      </div>
    </nav>
  );
}
