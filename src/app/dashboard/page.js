'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dbService } from '@/lib/dbService';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import styles from './page.module.css';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Veri Listeleri
  const [stations, setStations] = useState([]);
  const [faultTemplates, setFaultTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [allFaults, setAllFaults] = useState([]);
  const [techFaults, setTechFaults] = useState([]);
  const [techTeams, setTechTeams] = useState([]);

  // Form Durumları - İstasyon Ekleme
  const [stationCode, setStationCode] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationLocation, setStationLocation] = useState('');
  const [stationDetails, setStationDetails] = useState('');

  // Form Durumları - Genel Arıza Ekleme
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  // Form Durumları - Ekip Oluşturma
  const [teamName, setTeamName] = useState('');
  const [selectedTechs, setSelectedTechs] = useState([]);

  // Form Durumları - İstasyona Arıza Atama
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customFaultDesc, setCustomFaultDesc] = useState('');
  const [faultUrgency, setFaultUrgency] = useState('orta');
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);

  // Modallar için Durumlar (Sonradan Atama ve Ekip Düzenleme)
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editSelectedTechs, setEditSelectedTechs] = useState([]);

  const [isAssignFaultOpen, setIsAssignFaultOpen] = useState(false);
  const [assigningFault, setAssigningFault] = useState(null);
  const [assignSelectedTeams, setAssignSelectedTeams] = useState([]);
  const [assignSelectedUsers, setAssignSelectedUsers] = useState([]);

  // Arıza Çözme Durumları
  const [isResolveFaultOpen, setIsResolveFaultOpen] = useState(false);
  const [resolvingFault, setResolvingFault] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [usedParts, setUsedParts] = useState('');
  const [resolutionTeamId, setResolutionTeamId] = useState('');

  // Form Hata/Başarı Mesajları
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  // Verileri DB'den/Hafızadan Çekme
  const fetchData = useCallback(async (user) => {
    if (!user) return;
    try {
      if (user.role === 'yetkili') {
        const [stList, tempList, teamList, techList, faultList] = await Promise.all([
          dbService.getStations(),
          dbService.getFaultTemplates(),
          dbService.getTeams(),
          dbService.getTechnicians(),
          dbService.getAllFaults()
        ]);
        setStations(stList);
        setFaultTemplates(tempList);
        setTeams(teamList);
        setTechnicians(techList);
        setAllFaults(faultList);
      } else {
        // Tekniker ise sadece kendine atanan arızaları ve kendi ekibini çek
        const [myFaults, myTeams, stList] = await Promise.all([
          dbService.getTechnicianFaults(user.id),
          dbService.getTechnicianTeams(user.id),
          dbService.getStations()
        ]);
        setTechFaults(myFaults);
        setTechTeams(myTeams);
        setStations(stList); // Teknikerlerin de istasyonları görebilmesi için
      }
    } catch (err) {
      console.error("Veri çekme hatası:", err);
      showAlert('danger', 'Veriler yüklenirken hata oluştu.');
    }
  }, []);

  // Giriş kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      const user = await dbService.getCurrentUser();
      if (!user) {
        router.push('/');
      } else {
        setCurrentUser(user);
        setLoading(false);
        fetchData(user);
      }
    };
    checkAuth();
  }, [router, fetchData]);

  // Çıkış Yapma
  const handleLogout = async () => {
    await dbService.logout();
    router.push('/');
  };

  // Hızlı Rol Değiştirici (Geliştirici/Test Desteği)
  const handleRoleSwitch = async (newRole) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const updatedUser = await dbService.login(currentUser.email, currentUser.password, newRole);
      setCurrentUser(updatedUser);
      showAlert('success', `Rolünüz başarıyla "${newRole === 'yetkili' ? 'Yetkili' : 'Tekniker'}" olarak değiştirildi.`);
      fetchData(updatedUser);
    } catch (err) {
      showAlert('danger', err.message);
    } finally {
      setLoading(false);
    }
  };

  // FORM GÖNDERİMLERİ (YETKİLİ)

  // 1. İstasyon Ekle
  const handleAddStation = async (e) => {
    e.preventDefault();
    try {
      await dbService.addStation(stationCode, stationName, stationLocation, stationDetails);
      showAlert('success', 'İstasyon başarıyla eklendi.');
      setStationCode('');
      setStationName('');
      setStationLocation('');
      setStationDetails('');
      fetchData(currentUser);
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // 2. Genel Arıza Ekle
  const handleAddTemplate = async (e) => {
    e.preventDefault();
    try {
      await dbService.addFaultTemplate(templateTitle, templateDesc);
      showAlert('success', 'Genel arıza tanımı eklendi.');
      setTemplateTitle('');
      setTemplateDesc('');
      fetchData(currentUser);
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // 3. Ekip Oluştur
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (selectedTechs.length === 0) {
      showAlert('danger', 'Lütfen ekibe en az 1 tekniker seçin.');
      return;
    }
    try {
      await dbService.addTeam(teamName, selectedTechs);
      showAlert('success', `"${teamName}" başarıyla oluşturuldu ve teknikerler atandı.`);
      setTeamName('');
      setSelectedTechs([]);
      fetchData(currentUser);
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  const handleTechCheckbox = (techId) => {
    if (selectedTechs.includes(techId)) {
      setSelectedTechs(selectedTechs.filter(id => id !== techId));
    } else {
      setSelectedTechs([...selectedTechs, techId]);
    }
  };

  // 4. Arıza Atama
  const handleAssignFault = async (e) => {
    e.preventDefault();
    if (!selectedStation) {
      showAlert('danger', 'Lütfen bir istasyon seçin.');
      return;
    }
    if (!selectedTemplate) {
      showAlert('danger', 'Lütfen bir arıza başlığı seçin.');
      return;
    }

    try {
      // Şablondan başlığı bul
      const template = faultTemplates.find(t => t.id === selectedTemplate);
      const title = template ? template.title : 'Özel Arıza';
      const description = customFaultDesc || (template ? template.description : '');

      await dbService.addStationFault(selectedStation, title, description, faultUrgency, assignedTeams, assignedUsers);
      showAlert('success', 'Arıza kaydı açıldı ve ilgili ekip/teknisyen atamaları yapıldı.');
      setSelectedStation('');
      setSelectedTemplate('');
      setCustomFaultDesc('');
      setFaultUrgency('orta');
      setAssignedTeams([]);
      setAssignedUsers([]);
      fetchData(currentUser);
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // Ekip Düzenleme Modalı Açma ve İşleme
  const openEditTeamModal = (team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditSelectedTechs(team.members ? team.members.map(m => m.id) : []);
    setIsEditTeamOpen(true);
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    if (editSelectedTechs.length === 0) {
      showAlert('danger', 'Lütfen ekibe en az 1 tekniker seçin.');
      return;
    }
    try {
      await dbService.updateTeam(editingTeam.id, editTeamName, editSelectedTechs);
      showAlert('success', `"${editTeamName}" ekibi başarıyla güncellendi.`);
      setIsEditTeamOpen(false);
      setEditingTeam(null);
      fetchData(currentUser);
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  const handleEditTechCheckbox = (techId) => {
    if (editSelectedTechs.includes(techId)) {
      setEditSelectedTechs(editSelectedTechs.filter(id => id !== techId));
    } else {
      setEditSelectedTechs([...editSelectedTechs, techId]);
    }
  };

  // Sonradan Arıza Atama Modalı Açma ve İşleme
  const openAssignFaultModal = (fault) => {
    setAssigningFault(fault);
    setAssignSelectedTeams(fault.assigned_teams ? fault.assigned_teams.map(t => t.id) : []);
    setAssignSelectedUsers(fault.assigned_users ? fault.assigned_users.map(u => u.id) : []);
    setIsAssignFaultOpen(true);
  };

  const handleAssignFaultTeamsAndUsers = async (e) => {
    e.preventDefault();
    try {
      await dbService.assignFaultTeamsAndUsers(assigningFault.id, assignSelectedTeams, assignSelectedUsers);
      showAlert('success', 'Görevlendirme başarıyla güncellendi.');
      setIsAssignFaultOpen(false);
      setAssigningFault(null);
      fetchData(currentUser);
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // ARIZA ÇÖZME MODALINI AÇ (TEKNİKER)
  const handleOpenResolveFaultModal = (fault) => {
    setResolvingFault(fault);
    setResolutionNotes('');
    setUsedParts('');
    setResolutionTeamId(techTeams.length > 0 ? techTeams[0].id : '');
    setIsResolveFaultOpen(true);
  };

  // ARIZA ÇÖZÜM DETAYLARINI KAYDET VE KAPAT
  const handleSubmitResolveFault = async (e) => {
    e.preventDefault();
    if (!resolvingFault) return;
    try {
      await dbService.resolveFault(
        resolvingFault.id,
        resolutionTeamId || null,
        resolutionNotes,
        usedParts
      );
      showAlert('success', 'Arıza kaydı başarıyla kapatıldı, çözüm detayları ve kullanılan malzemeler kaydedildi.');
      setIsResolveFaultOpen(false);
      setResolvingFault(null);
      fetchData(currentUser);
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardWrapper}>
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onRoleSwitch={handleRoleSwitch}
      />

      <main className="container animate-fade-in">
        {/* Uyarı Bildirimleri */}
        {alert.message && (
          <div className={`${styles.alert} ${alert.type === 'success' ? styles.alertSuccess : styles.alertDanger}`}>
            {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
          </div>
        )}

        <div className={styles.welcomeBanner}>
          <h2>Merhaba, {currentUser.full_name}!</h2>
          <p>
            {currentUser.role === 'yetkili' 
              ? 'Yönetici paneli üzerinden istasyonları, arıza şablonlarını ve teknisyen ekiplerini yönetebilirsiniz.' 
              : 'Ekibinize atanan aktif arızaları aşağıda görebilir ve tamamlandığında yapıldı olarak işaretleyebilirsiniz.'}
          </p>
          {dbService.isMock() && (
            <div className={styles.demoBadge}>
              🛠️ Demo Modu Aktif (Veriler tarayıcıda saklanıyor)
            </div>
          )}
        </div>

        {currentUser.role === 'yetkili' ? (
          // ==========================================
          // YETKİLİ (ADMIN) PANELİ
          // ==========================================
          <div className={styles.adminLayout}>
            {/* SOL KOLON: Formlar */}
            <div className={styles.formsSection}>
              {/* 1. İstasyon Ekleme */}
              <Card title="Yeni İstasyon Ekle" subtitle="Sisteme yeni bir trafo veya dağıtım merkezi tanımlayın.">
                <form onSubmit={handleAddStation}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label htmlFor="stCode">İstasyon Kodu</label>
                      <input 
                        id="stCode"
                        type="text" 
                        required 
                        placeholder="Örn: IST-101" 
                        className="form-control"
                        value={stationCode}
                        onChange={(e) => setStationCode(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="stName">İstasyon İsmi</label>
                      <input 
                        id="stName"
                        type="text" 
                        required 
                        placeholder="Örn: Kadıköy Trafo" 
                        className="form-control"
                        value={stationName}
                        onChange={(e) => setStationName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="stLoc">Konum / Koordinat</label>
                    <input 
                      id="stLoc"
                      type="text" 
                      required 
                      placeholder="Örn: 40.9901, 29.0290 veya Kadıköy, İstanbul" 
                      className="form-control"
                      value={stationLocation}
                      onChange={(e) => setStationLocation(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stDet">İstasyon Detayları / Notlar</label>
                    <textarea 
                      id="stDet"
                      placeholder="Teknik detaylar, kilit şifreleri, jeneratör tipi vb..." 
                      className="form-control"
                      rows="3"
                      value={stationDetails}
                      onChange={(e) => setStationDetails(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    ➕ İstasyon Kaydet
                  </button>
                </form>
              </Card>

              {/* 2. Genel Arıza Ekleme */}
              <Card title="Yeni Genel Arıza Tanımla" subtitle="İstasyonlara kolayca atayabileceğiniz arıza şablonları oluşturun.">
                <form onSubmit={handleAddTemplate}>
                  <div className="form-group">
                    <label htmlFor="tTitle">Arıza Başlığı</label>
                    <input 
                      id="tTitle"
                      type="text" 
                      required 
                      placeholder="Örn: Sinyal Seviyesi Düşük" 
                      className="form-control"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tDesc">Standart Çözüm Adımları / Açıklama</label>
                    <textarea 
                      id="tDesc"
                      placeholder="Bu arıza durumunda teknikerlerin yapması gereken adımlar..." 
                      className="form-control"
                      rows="2"
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    💾 Şablonu Kaydet
                  </button>
                </form>
              </Card>

              {/* 3. Ekip Oluşturma */}
              <Card title="Tekniker Ekibi Oluştur" subtitle="Teknikerleri bir araya getirerek bakım ekibi oluşturun.">
                <form onSubmit={handleCreateTeam}>
                  <div className="form-group">
                    <label htmlFor="tName">Ekip İsmi</label>
                    <input 
                      id="tName"
                      type="text" 
                      required 
                      placeholder="Örn: Doğu Bölgesi Mobil Ekip" 
                      className="form-control"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teknikerler Seçin</label>
                    {technicians.length === 0 ? (
                      <p className={styles.noDataText}>Sistemde kayıtlı tekniker bulunmamaktadır. Kayıt sayfasından tekniker rolüyle üye ekleyebilirsiniz.</p>
                    ) : (
                      <div className={styles.techChecklist}>
                        {technicians.map(tech => (
                          <label key={tech.id} className={styles.checkboxLabel}>
                            <input 
                              type="checkbox"
                              checked={selectedTechs.includes(tech.id)}
                              onChange={() => handleTechCheckbox(tech.id)}
                            />
                            <span>{tech.full_name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    👥 Ekibi Oluştur
                  </button>
                </form>
              </Card>
            </div>

            {/* SAĞ KOLON: Arıza Atama & Listeler */}
            <div className={styles.listsSection}>
              {/* 4. Arıza Atama Formu */}
              <Card title="İstasyona Arıza Bildir ve Ekip Ata" subtitle="Belirli bir istasyonda arıza kaydı oluşturup ekip yönlendirin.">
                <form onSubmit={handleAssignFault}>
                  <div className="form-group">
                    <label htmlFor="fSt">İstasyon</label>
                    <select 
                      id="fSt"
                      className="form-control"
                      value={selectedStation}
                      onChange={(e) => setSelectedStation(e.target.value)}
                    >
                      <option value="">-- İstasyon Seçin --</option>
                      {stations.map(st => (
                        <option key={st.id} value={st.id}>{st.code} - {st.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label htmlFor="fTemp">Arıza Türü (Şablon)</label>
                      <select 
                        id="fTemp"
                        className="form-control"
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                      >
                        <option value="">-- Arıza Şablonu Seçin --</option>
                        {faultTemplates.map(temp => (
                          <option key={temp.id} value={temp.id}>{temp.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="fUrg">Öncelik Derecesi</label>
                      <select 
                        id="fUrg"
                        className="form-control"
                        value={faultUrgency}
                        onChange={(e) => setFaultUrgency(e.target.value)}
                      >
                        <option value="düşük">🟢 Düşük</option>
                        <option value="orta">🟡 Orta</option>
                        <option value="acil">🔴 Acil (Yüksek)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Görevlendirilecek Ekipler (Çoklu Seçim)</label>
                    {teams.length === 0 ? (
                      <p className={styles.noDataText}>Oluşturulmuş ekip bulunamadı. Lütfen önce ekip tanımlayın.</p>
                    ) : (
                      <div className={styles.techChecklist}>
                        {teams.map(team => (
                          <label key={team.id} className={styles.checkboxLabel}>
                            <input 
                              type="checkbox"
                              checked={assignedTeams.includes(team.id)}
                              onChange={() => {
                                if (assignedTeams.includes(team.id)) {
                                  setAssignedTeams(assignedTeams.filter(id => id !== team.id));
                                } else {
                                  setAssignedTeams([...assignedTeams, team.id]);
                                }
                              }}
                            />
                            <span>👥 {team.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Görevlendirilecek Bireysel Teknisyenler (Çoklu Seçim)</label>
                    {technicians.length === 0 ? (
                      <p className={styles.noDataText}>Sistemde teknisyen bulunamadı.</p>
                    ) : (
                      <div className={styles.techChecklist}>
                        {technicians.map(tech => (
                          <label key={tech.id} className={styles.checkboxLabel}>
                            <input 
                              type="checkbox"
                              checked={assignedUsers.includes(tech.id)}
                              onChange={() => {
                                if (assignedUsers.includes(tech.id)) {
                                  setAssignedUsers(assignedUsers.filter(id => id !== tech.id));
                                } else {
                                  setAssignedUsers([...assignedUsers, tech.id]);
                                }
                              }}
                            />
                            <span>🔧 {tech.full_name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="fDesc">Mevcut Durum Açıklaması / Ekstra Notlar</label>
                    <textarea 
                      id="fDesc"
                      placeholder="Arızaya dair özel notlar veya teknisyen ekibin dikkat etmesi gereken noktalar..." 
                      className="form-control"
                      rows="2"
                      value={customFaultDesc}
                      onChange={(e) => setCustomFaultDesc(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>
                    🚨 Arıza Kaydı Aç ve Gönder
                  </button>
                </form>
              </Card>

              {/* İstasyonlar ve Tarihçe */}
              <Card title="Aktif İstasyonlar" subtitle="Mevcut istasyonlar ve detayları için kodlara tıklayın.">
                {stations.length === 0 ? (
                  <p className={styles.noDataText}>Kayıtlı istasyon bulunamadı. Lütfen sol taraftan ekleyin.</p>
                ) : (
                  <div className={styles.stationsGrid}>
                    {stations.map(st => (
                      <Link href={`/stations/${st.id}`} key={st.id} className={styles.stationMiniCard}>
                        <div className={styles.stCodeBadge}>{st.code}</div>
                        <div className={styles.stInfo}>
                          <h4>{st.name}</h4>
                          <span>📍 {st.location}</span>
                        </div>
                        <span className={styles.arrowIcon}>→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Mevcut Ekipler Listesi */}
              <Card title="Tanımlı Bakım Ekipleri" subtitle="Sistemdeki ekipler ve bünyelerindeki teknikerler.">
                {teams.length === 0 ? (
                  <p className={styles.noDataText}>Oluşturulmuş ekip bulunamadı.</p>
                ) : (
                  <div className={styles.teamsList}>
                    {teams.map(team => (
                      <div key={team.id} className={styles.teamItem}>
                        <div className={styles.teamHeader}>
                          <h4>👥 {team.name}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className={styles.memberCount}>{team.members?.length || 0} Üye</span>
                            <button
                              type="button"
                              className={styles.editTeamBtn}
                              onClick={() => openEditTeamModal(team)}
                              title="Ekibi Düzenle"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                        <div className={styles.teamMembersChips}>
                          {team.members && team.members.length > 0 ? (
                            team.members.map(m => (
                              <span key={m.id} className={styles.memberChip}>🔧 {m.full_name}</span>
                            ))
                          ) : (
                            <span className={styles.noMember}>Üye atanmamış</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Tüm Arızalar Panosu */}
              <Card title="Arıza Takip Panosu" subtitle="Sistemdeki tüm açık ve çözülmüş arızaların genel takibi.">
                {allFaults.length === 0 ? (
                  <p className={styles.noDataText}>Sistemde henüz arıza kaydı bulunmuyor.</p>
                ) : (
                  <div className={styles.faultTableContainer}>
                    <table className={styles.faultTable}>
                      <thead>
                        <tr>
                          <th>İstasyon</th>
                          <th>Arıza</th>
                          <th>Öncelik</th>
                          <th>Atananlar / Müdahil</th>
                          <th>Durum</th>
                          <th>Aksiyon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allFaults.map(fault => (
                          <tr key={fault.id}>
                            <td>
                              <Link href={`/stations/${fault.station_id}`} className={styles.tableStationLink}>
                                {fault.station?.code}
                              </Link>
                            </td>
                            <td>
                              <div className={styles.faultTableTitle}>{fault.title}</div>
                              <div className={styles.faultTableDesc}>{fault.description}</div>
                            </td>
                            <td>
                              <span className={`badge badge-${fault.urgency}`}>
                                {fault.urgency}
                              </span>
                            </td>
                            <td>
                              {fault.status === 'yapıldı' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <span className={styles.resolvedTeamSpan}>
                                    ✅ {fault.resolved_by_team?.name || 'Bilinmeyen Ekip'}
                                  </span>
                                  {fault.resolution_notes && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontStyle: 'italic' }}>
                                      📝 {fault.resolution_notes}
                                    </span>
                                  )}
                                  {fault.used_parts && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', fontWeight: '500' }}>
                                      🛠️ {fault.used_parts}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {/* Atanan Ekipler */}
                                  {fault.assigned_teams && fault.assigned_teams.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                      {fault.assigned_teams.map(team => (
                                        <span key={team.id} className={styles.tableTeamBadge}>
                                          👥 {team.name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                  {/* Atanan Bireysel Teknisyenler */}
                                  {fault.assigned_users && fault.assigned_users.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                      {fault.assigned_users.map(user => (
                                        <span key={user.id} className={styles.tableUserBadge}>
                                          🔧 {user.full_name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                  {(!fault.assigned_teams || fault.assigned_teams.length === 0) && (!fault.assigned_users || fault.assigned_users.length === 0) ? (
                                    <span className={styles.noAssignmentSpan}>⚙️ Atanmadı</span>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${fault.status === 'yapıldı' ? 'badge-yapildi' : 'badge-acik'}`}>
                                {fault.status}
                              </span>
                            </td>
                            <td>
                              {fault.status === 'açık' ? (
                                <button
                                  type="button"
                                  onClick={() => openAssignFaultModal(fault)}
                                  className={styles.assignFaultBtn}
                                  title="Görevlendirmeyi Güncelle"
                                >
                                  🔗 Görevlendir
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Müdahale bitti</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : (
          // ==========================================
          // TEKNİKER PANELİ
          // ==========================================
          <div className={styles.techLayout}>
            {/* Sol Kolon: Üye Olduğu Ekipler */}
            <div className={styles.techSideCol}>
              <Card title="Ekibiniz" subtitle="Dahil olduğunuz bakım ve arıza ekipleri.">
                {techTeams.length === 0 ? (
                  <p className={styles.noDataText}>Herhangi bir ekibe dahil değilsiniz. Lütfen yöneticinizden sizi bir ekibe atamasını isteyin.</p>
                ) : (
                  <div className={styles.myTeams}>
                    {techTeams.map(team => (
                      <div key={team.id} className={styles.myTeamCard}>
                        <h4>👥 {team.name}</h4>
                        <p>Bu ekibe atanan arızaları çözümleme yetkisine sahipsiniz.</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="İstasyon Listesi" subtitle="Bilgileri ve arıza geçmişlerini incelemek için tıklayın.">
                <div className={styles.stationsGrid}>
                  {stations.map(st => (
                    <Link href={`/stations/${st.id}`} key={st.id} className={styles.stationMiniCard}>
                      <div className={styles.stCodeBadge}>{st.code}</div>
                      <div className={styles.stInfo}>
                        <h4>{st.name}</h4>
                        <span>📍 {st.location}</span>
                      </div>
                      <span className={styles.arrowIcon}>→</span>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sağ Kolon: Atanan Arızalar */}
            <div className={styles.techMainCol}>
              <Card title="Size Atanan Arıza Kayıtları" subtitle="Ekibinize yönlendirilen, yapılması bekleyen işler listesi.">
                {techFaults.length === 0 ? (
                  <div className={styles.emptyTasks}>
                    <span>🎉</span>
                    <h4>Harika! Açık arıza bulunmuyor.</h4>
                    <p>Şu anda ekibinize atanmış aktif çözülmesi gereken bir arıza kaydı yok.</p>
                  </div>
                ) : (
                  <div className={styles.techFaultsList}>
                    {techFaults.map(fault => (
                      <div key={fault.id} className={`${styles.techFaultCard} ${fault.status === 'yapıldı' ? styles.techFaultResolved : ''}`}>
                        <div className={styles.techFaultHeader}>
                          <div className={styles.techFaultTitleBlock}>
                            <span className={`badge badge-${fault.urgency}`}>{fault.urgency}</span>
                            <span className={styles.stationLink}>
                              <Link href={`/stations/${fault.station_id}`}>
                                📍 {fault.station?.code} - {fault.station?.name}
                              </Link>
                            </span>
                          </div>
                          <span className={`badge ${fault.status === 'yapıldı' ? 'badge-yapildi' : 'badge-acik'}`}>
                            {fault.status}
                          </span>
                        </div>

                        <div className={styles.techFaultBody}>
                          <h3>{fault.title}</h3>
                          <p>{fault.description}</p>
                          
                          {/* Görevlendirilenler */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                            {fault.assigned_teams && fault.assigned_teams.map(team => (
                              <span key={team.id} className={styles.memberChip} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                👥 {team.name}
                              </span>
                            ))}
                            {fault.assigned_users && fault.assigned_users.map(user => (
                              <span key={user.id} className={styles.memberChip} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                🔧 {user.full_name} {user.id === currentUser.id ? '(Siz)' : ''}
                              </span>
                            ))}
                          </div>

                          <span className={styles.faultDate}>📅 Bildirim Tarihi: {new Date(fault.created_at).toLocaleString('tr-TR')}</span>
                        </div>

                        {fault.status === 'açık' && (
                          <div className={styles.techFaultActions}>
                            <button
                              onClick={() => handleOpenResolveFaultModal(fault)}
                              className="btn btn-primary"
                              style={{ width: '100%', gap: '0.5rem' }}
                            >
                              ✅ Arızayı Gider / Kapat
                            </button>
                          </div>
                        )}

                        {fault.status === 'yapıldı' && (
                          <div className={styles.resolvedByMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
                            <div style={{ fontWeight: '700' }}>🎉 Bu arıza giderildi ve kapatıldı.</div>
                            {fault.resolution_notes && (
                              <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.2rem' }}>
                                <strong>📝 Çözüm Açıklaması:</strong> {fault.resolution_notes}
                              </div>
                            )}
                            {fault.used_parts && (
                              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                <strong>🛠️ Kullanılan Malzemeler:</strong> {fault.used_parts}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* MODALLAR */}
        {isEditTeamOpen && editingTeam && (
          <div className={styles.modalBackdrop} onClick={() => { setIsEditTeamOpen(false); setEditingTeam(null); }}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>👥 Ekibi Düzenle: {editingTeam.name}</h3>
                <button className={styles.modalCloseBtn} onClick={() => { setIsEditTeamOpen(false); setEditingTeam(null); }}>&times;</button>
              </div>
              <form onSubmit={handleEditTeam}>
                <div className={styles.modalBody}>
                  <div className="form-group">
                    <label htmlFor="editTName">Ekip İsmi</label>
                    <input 
                      id="editTName"
                      type="text" 
                      required 
                      className="form-control"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Teknikerler Seçin</label>
                    {technicians.length === 0 ? (
                      <p className={styles.noDataText}>Tekniker bulunamadı.</p>
                    ) : (
                      <div className={styles.techChecklist}>
                        {technicians.map(tech => (
                          <label key={tech.id} className={styles.checkboxLabel}>
                            <input 
                              type="checkbox"
                              checked={editSelectedTechs.includes(tech.id)}
                              onChange={() => handleEditTechCheckbox(tech.id)}
                            />
                            <span>{tech.full_name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsEditTeamOpen(false); setEditingTeam(null); }}>İptal</button>
                  <button type="submit" className="btn btn-primary">💾 Değişiklikleri Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isAssignFaultOpen && assigningFault && (
          <div className={styles.modalBackdrop} onClick={() => { setIsAssignFaultOpen(false); setAssigningFault(null); }}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>🔗 Görevlendir / Düzenle</h3>
                <button className={styles.modalCloseBtn} onClick={() => { setIsAssignFaultOpen(false); setAssigningFault(null); }}>&times;</button>
              </div>
              <form onSubmit={handleAssignFaultTeamsAndUsers}>
                <div className={styles.modalBody}>
                  <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--accent)' }}>{assigningFault.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{assigningFault.description}</p>
                  </div>
                  <div className="form-group">
                    <label>Görevlendirilecek Ekipler (Çoklu Seçim)</label>
                    {teams.length === 0 ? (
                      <p className={styles.noDataText}>Ekip bulunamadı.</p>
                    ) : (
                      <div className={styles.techChecklist}>
                        {teams.map(team => (
                          <label key={team.id} className={styles.checkboxLabel}>
                            <input 
                              type="checkbox"
                              checked={assignSelectedTeams.includes(team.id)}
                              onChange={() => {
                                if (assignSelectedTeams.includes(team.id)) {
                                  setAssignSelectedTeams(assignSelectedTeams.filter(id => id !== team.id));
                                } else {
                                  setAssignSelectedTeams([...assignSelectedTeams, team.id]);
                                }
                              }}
                            />
                            <span>👥 {team.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Görevlendirilecek Teknisyenler (Çoklu Seçim)</label>
                    {technicians.length === 0 ? (
                      <p className={styles.noDataText}>Teknisyen bulunamadı.</p>
                    ) : (
                      <div className={styles.techChecklist}>
                        {technicians.map(tech => (
                          <label key={tech.id} className={styles.checkboxLabel}>
                            <input 
                              type="checkbox"
                              checked={assignSelectedUsers.includes(tech.id)}
                              onChange={() => {
                                if (assignSelectedUsers.includes(tech.id)) {
                                  setAssignSelectedUsers(assignSelectedUsers.filter(id => id !== tech.id));
                                } else {
                                  setAssignSelectedUsers([...assignSelectedUsers, tech.id]);
                                }
                              }}
                            />
                            <span>🔧 {tech.full_name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsAssignFaultOpen(false); setAssigningFault(null); }}>İptal</button>
                  <button type="submit" className="btn btn-danger">💾 Atamaları Güncelle</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isResolveFaultOpen && resolvingFault && (
          <div className={styles.modalBackdrop} onClick={() => { setIsResolveFaultOpen(false); setResolvingFault(null); }}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>✅ Arıza Müdahale & Çözüm Formu</h3>
                <button className={styles.modalCloseBtn} onClick={() => { setIsResolveFaultOpen(false); setResolvingFault(null); }}>&times;</button>
              </div>
              <form onSubmit={handleSubmitResolveFault}>
                <div className={styles.modalBody}>
                  <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--accent)' }}>{resolvingFault.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{resolvingFault.description}</p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="resTeam">Müdahale Eden Ekip</label>
                    <select
                      id="resTeam"
                      className="form-control"
                      value={resolutionTeamId}
                      onChange={(e) => setResolutionTeamId(e.target.value)}
                    >
                      {techTeams.length === 0 ? (
                        <option value="">Bireysel (Ekipsiz)</option>
                      ) : (
                        <>
                          {techTeams.map(team => (
                            <option key={team.id} value={team.id}>👥 {team.name}</option>
                          ))}
                          <option value="">Bireysel (Ekipsiz)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label htmlFor="resNotes">Yapılan Müdahale Açıklaması *</label>
                    <textarea
                      id="resNotes"
                      required
                      rows={3}
                      className="form-control"
                      placeholder="Arızayı gidermek için yaptığınız işlemleri detaylıca yazın (örn. Kablo bağlantıları yenilendi, güç kaynağı değiştirildi...)"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label htmlFor="resParts">Kullanılan Malzemeler / Yedek Parçalar</label>
                    <textarea
                      id="resParts"
                      rows={2}
                      className="form-control"
                      placeholder="Varsa kullanılan yedek parçaları yazın (örn. 1x Ethernet Kablosu, 2x Akü)... Yoksa boş bırakabilirsiniz."
                      value={usedParts}
                      onChange={(e) => setUsedParts(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsResolveFaultOpen(false); setResolvingFault(null); }}>İptal</button>
                  <button type="submit" className="btn btn-success">✅ Arızayı Gider ve Kapat</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
