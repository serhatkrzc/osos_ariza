'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { dbService } from '@/lib/dbService';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function StationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const stationId = params.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStationData = useCallback(async () => {
    try {
      const data = await dbService.getStationDetails(stationId);
      setStation(data);
    } catch (err) {
      setError(err.message || 'İstasyon yüklenirken bir hata oluştu.');
    }
  }, [stationId]);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await dbService.getCurrentUser();
      if (!user) {
        router.push('/');
      } else {
        setCurrentUser(user);
        await loadStationData();
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, loadStationData]);

  const handleLogout = async () => {
    await dbService.logout();
    router.push('/');
  };

  const handleRoleSwitch = async (newRole) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const updatedUser = await dbService.login(currentUser.email, currentUser.password, newRole);
      setCurrentUser(updatedUser);
      router.push('/dashboard'); // Rol değişince ana panele yönlendir
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>İstasyon verileri yükleniyor...</p>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className={styles.errorScreen}>
        <Navbar currentUser={currentUser} onLogout={handleLogout} />
        <main className="container animate-fade-in">
          <div className={`${styles.alert} styles.alertDanger`}>
            ⚠️ {error || 'İstasyon bulunamadı!'}
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
            ⬅️ Kontrol Paneline Dön
          </button>
        </main>
      </div>
    );
  }

  const activeFaults = station.faults.filter(f => f.status === 'açık');
  const resolvedFaults = station.faults.filter(f => f.status === 'yapıldı');

  return (
    <div className={styles.detailsWrapper}>
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onRoleSwitch={handleRoleSwitch}
      />

      <main className="container animate-fade-in">
        <div className={styles.headerRow}>
          <button onClick={() => router.push('/dashboard')} className={`${styles.backBtn} btn btn-secondary`}>
            ⬅️ Panel'e Geri Dön
          </button>
          <div className={styles.stationTitleBlock}>
            <span className={styles.stCodeBadge}>{station.code}</span>
            <h2>{station.name}</h2>
          </div>
        </div>

        <div className={styles.gridContainer}>
          {/* Sol Kolon: Genel Bilgiler */}
          <div className={styles.infoCol}>
            <Card title="İstasyon Teknik Bilgileri" subtitle="İstasyon altyapısı ve konum detayları.">
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>İstasyon Kodu</span>
                  <span className={styles.infoValue}>{station.code}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>İstasyon Adı</span>
                  <span className={styles.infoValue}>{station.name}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Konum / Koordinat</span>
                  <span className={styles.infoValue}>📍 {station.location}</span>
                </div>
                <div className={styles.infoItem} style={{ borderBottom: 'none' }}>
                  <span className={styles.infoLabel}>Kayıt Tarihi</span>
                  <span className={styles.infoValue}>
                    {new Date(station.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>

              <div className={styles.descriptionBlock}>
                <h4>Detaylar ve Açıklama</h4>
                <p>{station.details || 'Bu istasyon için özel detay notu eklenmemiş.'}</p>
              </div>
            </Card>
          </div>

          {/* Sağ Kolon: Aktif ve Çözülmüş Arızalar */}
          <div className={styles.faultsCol}>
            {/* Aktif Arızalar */}
            <Card 
              title="Aktif Arızalar" 
              subtitle="Şu an çözüm bekleyen güncel arıza bildirimleri."
              extraHeader={<span className={`badge badge-acik`}>{activeFaults.length} Açık</span>}
            >
              {activeFaults.length === 0 ? (
                <p className={styles.noFaultsText}>🎉 Bu istasyonda aktif arıza kaydı bulunmuyor.</p>
              ) : (
                <div className={styles.faultsList}>
                  {activeFaults.map(fault => (
                    <div key={fault.id} className={`${styles.faultItem} ${styles.faultActive}`}>
                      <div className={styles.faultItemHeader}>
                        <span className={`badge badge-${fault.urgency}`}>{fault.urgency}</span>
                        <span className={styles.faultDate}>📅 {new Date(fault.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                      <h3>{fault.title}</h3>
                      <p>{fault.description}</p>
                      <div className={styles.assignmentBlock} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span>Atanan Ekipler:</span>
                          {fault.assigned_teams && fault.assigned_teams.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {fault.assigned_teams.map(team => (
                                <span key={team.id} className="badge badge-secondary" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                  👥 {team.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <strong style={{ color: 'var(--text-muted)' }}>Atanmadı</strong>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '0.25rem' }}>
                          <span>Atanan Bireysel Sürveyanlar:</span>
                          {fault.assigned_users && fault.assigned_users.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {fault.assigned_users.map(user => (
                                <span key={user.id} className="badge badge-secondary" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                  📋 {user.full_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <strong style={{ color: 'var(--text-muted)' }}>Atanmadı</strong>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ÇÖZÜLEN ARIZALAR / ARIZA GEÇMİŞİ (İstenen Ana Detay) */}
            <Card 
              title="Giderilen Arıza Geçmişi" 
              subtitle="Bu istasyonda giderilen arızalar ve müdahale eden ekipler."
              extraHeader={<span className={`badge badge-yapildi`}>{resolvedFaults.length} Çözüldü</span>}
            >
              {resolvedFaults.length === 0 ? (
                <p className={styles.noFaultsText}>İstasyon geçmişinde henüz giderilmiş bir arıza kaydı bulunmamaktadır.</p>
              ) : (
                <div className={styles.faultsList}>
                  {resolvedFaults.map(fault => (
                    <div key={fault.id} className={`${styles.faultItem} ${styles.faultResolved}`}>
                      <div className={styles.faultItemHeader}>
                        <span className="badge badge-yapildi">Yapıldı</span>
                        <span className={styles.faultDate}>📅 Çözülme: {new Date(fault.resolved_at).toLocaleString('tr-TR')}</span>
                      </div>
                      <h3>{fault.title}</h3>
                      <p>{fault.description}</p>
                      
                      <div className={styles.resolutionDetails}>
                        <div className={styles.resTeamRow}>
                          <span>Gideren Ekip:</span>
                          <span className={styles.resTeamBadge}>
                            👥 {fault.resolved_by_team?.name || 'Bilinmeyen Ekip'}
                          </span>
                        </div>
                        {fault.resolution_notes && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <strong>📝 Çözüm Açıklaması:</strong>
                            <p style={{ margin: '0.2rem 0 0 0', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.85)' }}>{fault.resolution_notes}</p>
                          </div>
                        )}
                        {fault.used_parts && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--accent)' }}>
                            <strong>🛠️ Kullanılan Malzemeler:</strong>
                            <p style={{ margin: '0.2rem 0 0 0', fontWeight: '500', color: 'rgba(255, 255, 255, 0.95)' }}>{fault.used_parts}</p>
                          </div>
                        )}
                        <div className={styles.resDateRow} style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
                          <span>Bildirim Tarihi:</span>
                          <span>{new Date(fault.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
