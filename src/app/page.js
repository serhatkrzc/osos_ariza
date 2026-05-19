'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dbService } from '@/lib/dbService';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('sürveyan');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Zaten giriş yapmış bir kullanıcı varsa doğrudan dashboard'a yönlendir
  useEffect(() => {
    const checkUser = async () => {
      const user = await dbService.getCurrentUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await dbService.login(email, password);
      } else {
        await dbService.signup(email, password, fullName, role);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Demo Girişleri İçin Yardımcı Fonksiyon (Tek tıkla giriş)
  const handleQuickLogin = async (type) => {
    setError('');
    setLoading(true);
    try {
      if (type === 'yetkili') {
        await dbService.login('yetkili@osos.com', '123');
      } else {
        await dbService.login('surveyan1@osos.com', '123');
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.pageWrapper}>
      <div className={styles.backgroundGlow}></div>
      <div className={styles.gridOverlay}></div>

      <div className={`${styles.loginContainer} animate-slide-up`}>
        <div className={styles.brandHeader}>
          <span className={styles.logoIcon}>⚡</span>
          <h1 className={styles.logoTitle}>OSOS</h1>
          <p className={styles.logoSubtitle}>ARIZA TAKİP SİSTEMİ</p>
        </div>

        <div className={`${styles.card} glass`}>
          <div className={styles.tabs}>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`${styles.tabBtn} ${isLogin ? styles.activeTab : ''}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`${styles.tabBtn} ${!isLogin ? styles.activeTab : ''}`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="fullName">Ad Soyad</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Adınızı ve soyadınızı girin"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                required
                placeholder="ornek@osos.com"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="role">Hesap Rolü</label>
                <select
                  id="role"
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="sürveyan">📋 Sürveyan</option>
                  <option value="yetkili">🔑 Yetkili (Yönetici)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', height: '48px' }}
            >
              {loading ? 'İşlem yapılıyor...' : isLogin ? 'Sisteme Giriş Yap' : 'Kayıt Ol ve Giriş Yap'}
            </button>
          </form>

          {isLogin && (
            <div className={styles.quickLoginSection}>
              <div className={styles.divider}>
                <span>Veya Hızlı Test Girişi Yap</span>
              </div>
              <div className={styles.quickButtons}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('yetkili')}
                  className="btn btn-secondary"
                  title="E-posta: yetkili@osos.com | Şifre: 123"
                >
                  🔑 Yetkili Girişi
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sürveyan')}
                  className="btn btn-secondary"
                  title="E-posta: surveyan1@osos.com | Şifre: 123"
                >
                  📋 Sürveyan Girişi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
