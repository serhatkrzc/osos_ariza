import { supabase } from './supabaseClient';

// localStorage anahtarları
const LS_USERS = 'osos_users';
const LS_CURRENT_USER = 'osos_current_user';
const LS_STATIONS = 'osos_stations';
const LS_FAULT_TEMPLATES = 'osos_fault_templates';
const LS_STATION_FAULTS = 'osos_station_faults';
const LS_TEAMS = 'osos_teams';
const LS_TEAM_MEMBERS = 'osos_team_members';

// MOCK VERİ TOHUMLAMA (Eğer localStorage boşsa doldurulacak)
const initialUsers = [
  { id: 'u-1', email: 'yetkili@osos.com', password: '123', full_name: 'Ayşe Kaya', role: 'yetkili' },
  { id: 'u-2', email: 'surveyan1@osos.com', password: '123', full_name: 'Ali Yılmaz', role: 'sürveyan' },
  { id: 'u-3', email: 'surveyan2@osos.com', password: '123', full_name: 'Veli Demir', role: 'sürveyan' },
  { id: 'u-4', email: 'surveyan3@osos.com', password: '123', full_name: 'Canan Can', role: 'sürveyan' }
];

const initialTeams = [
  { id: 't-1', name: 'Kuzey Bakım Ekibi', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-2', name: 'Güney Arıza Ekibi', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
];

const initialTeamMembers = [
  { team_id: 't-1', user_id: 'u-2' }, // Ali Yılmaz Kuzey ekibinde
  { team_id: 't-1', user_id: ' Canan Can' }, // Canan Can Kuzey ekibinde
  { team_id: 't-2', user_id: 'u-3' }  // Veli Demir Güney ekibinde
];

const initialStations = [
  { id: 's-1', code: 'IST-001', name: 'Kadıköy Trafo İstasyonu', location: 'Kadıköy, İstanbul (40.9901, 29.0290)', details: 'Ana haberleşme ünitesi RTU-200 barındırıyor. Kabin kilidi şifresi: 4859', created_at: new Date().toISOString() },
  { id: 's-2', code: 'IST-002', name: 'Beşiktaş Dağıtım Merkezi', location: 'Beşiktaş, İstanbul (41.0422, 29.0074)', details: 'Yedek jeneratör ünitesi mevcut. Acil durumda jeneratör kontrol paneli manuel çalıştırılmalıdır.', created_at: new Date().toISOString() },
  { id: 's-3', code: 'IST-003', name: 'Üsküdar Regülatör İstasyonu', location: 'Üsküdar, İstanbul (41.0267, 29.0152)', details: 'Eski tip altyapı, fiber dönüşüm bekleniyor. Sinyal güçlendirici aktif.', created_at: new Date().toISOString() }
];

const initialFaultTemplates = [
  { id: 'ft-1', title: 'Haberleşme Hatası', description: 'İstasyon ile merkez sunucu arasında bağlantı koptu.' },
  { id: 'ft-2', title: 'Güç Kaynağı Arızası', description: 'UPS veya şebeke elektriğinde kesinti veya dalgalanma.' },
  { id: 'ft-3', title: 'Sinyal Seviyesi Düşük', description: 'GSM/RF anten sinyal gücü yetersiz seviyede.' },
  { id: 'ft-4', title: 'Fiziksel Hasar / Sabotaj', description: 'Kabin kapağı açık veya fiziksel müdahale tespit edildi.' }
];

const initialStationFaults = [
  {
    id: 'f-1',
    station_id: 's-1',
    title: 'Güç Kaynağı Arızası',
    description: 'Şebekeden gelen faz hatası sebebiyle UPS devre dışı kalmıştı. Aküler yenilendi.',
    urgency: 'orta',
    status: 'yapıldı',
    assigned_team_id: 't-1',
    resolved_by_team_id: 't-1',
    resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'f-2',
    station_id: 's-2',
    title: 'Haberleşme Hatası',
    description: 'Modem IP alamıyor. Reset atılması ve sim kart kontrolü yapılması gerekiyor.',
    urgency: 'acil',
    status: 'açık',
    assigned_team_id: 't-2',
    resolved_by_team_id: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

// LocalStorage başlatıcı yardımcı fonksiyon
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(LS_USERS)) localStorage.setItem(LS_USERS, JSON.stringify(initialUsers));
  if (!localStorage.getItem(LS_TEAMS)) localStorage.setItem(LS_TEAMS, JSON.stringify(initialTeams));
  if (!localStorage.getItem(LS_TEAM_MEMBERS)) localStorage.setItem(LS_TEAM_MEMBERS, JSON.stringify(initialTeamMembers));
  if (!localStorage.getItem(LS_STATIONS)) localStorage.setItem(LS_STATIONS, JSON.stringify(initialStations));
  if (!localStorage.getItem(LS_FAULT_TEMPLATES)) localStorage.setItem(LS_FAULT_TEMPLATES, JSON.stringify(initialFaultTemplates));
  if (!localStorage.getItem(LS_STATION_FAULTS)) localStorage.setItem(LS_STATION_FAULTS, JSON.stringify(initialStationFaults));

  // Sürveyan rolü için LocalStorage Göçü (tekniker -> sürveyan)
  try {
    const existingUsers = localStorage.getItem(LS_USERS);
    if (existingUsers) {
      const parsedUsers = JSON.parse(existingUsers);
      let updated = false;
      parsedUsers.forEach(u => {
        if (u.role === 'tekniker') {
          u.role = 'sürveyan';
          updated = true;
        }
        if (u.email && u.email.startsWith('tekniker')) {
          u.email = u.email.replace('tekniker', 'surveyan');
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(LS_USERS, JSON.stringify(parsedUsers));
      }
    }
    const currentUser = localStorage.getItem(LS_CURRENT_USER);
    if (currentUser) {
      const parsedUser = JSON.parse(currentUser);
      let updated = false;
      if (parsedUser.role === 'tekniker') {
        parsedUser.role = 'sürveyan';
        updated = true;
      }
      if (parsedUser.email && parsedUser.email.startsWith('tekniker')) {
        parsedUser.email = parsedUser.email.replace('tekniker', 'surveyan');
        updated = true;
      }
      if (updated) {
        localStorage.setItem(LS_CURRENT_USER, JSON.stringify(parsedUser));
      }
    }
  } catch (e) {
    console.error("Migration error:", e);
  }
};

initLocalStorage();

// Mod kontrolü: Supabase aktif mi?
const isSupabaseActive = () => supabase !== null;

// ==========================================
// DB SERVICE API
// ==========================================
export const dbService = {
  isMock: () => !isSupabaseActive(),

  // ------------------------------------------
  // AUTHENTICATION & PROFILES
  // ------------------------------------------
  async getCurrentUser() {
    if (isSupabaseActive()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Profil kaydı yoksa otomatik oluştur veya bellek içi nesneye düş
      if (!profile) {
        console.warn("Kullanıcı auth üzerinde mevcut ancak public.profiles tablosunda kaydı bulunamadı. Otomatik iyileştirme tetikleniyor...");
        const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı';
        const defaultRole = user.user_metadata?.role || 'yetkili';

        try {
          const { data: newProfile, error: insertErr } = await supabase
            .from('profiles')
            .insert([{ id: user.id, full_name: defaultName, role: defaultRole }])
            .select()
            .single();

          if (!insertErr && newProfile) {
            profile = newProfile;
            console.log("Yeni profil başarıyla veritabanına eklendi.");
          } else {
            console.error("Otomatik profil ekleme başarısız (RLS aktif olabilir):", insertErr);
            profile = { id: user.id, full_name: defaultName, role: defaultRole };
          }
        } catch (e) {
          console.error("Profil iyileştirme sırasında istisna:", e);
          profile = { id: user.id, full_name: defaultName, role: defaultRole };
        }
      }
      
      return { ...user, ...profile };
    } else {
      const current = localStorage.getItem(LS_CURRENT_USER);
      return current ? JSON.parse(current) : null;
    }
  },

  async login(email, password, demoRole = null) {
    if (isSupabaseActive()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Profil kaydı yoksa otomatik oluştur veya bellek içi nesneye düş
      if (!profile) {
        console.warn("Giriş başarılı fakat profiles tablosunda kayıt yok. Otomatik profil oluşturuluyor...");
        const defaultName = data.user.user_metadata?.full_name || email.split('@')[0] || 'Kullanıcı';
        const defaultRole = data.user.user_metadata?.role || (demoRole || 'yetkili');

        try {
          const { data: newProfile, error: insertErr } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, full_name: defaultName, role: defaultRole }])
            .select()
            .single();

          if (!insertErr && newProfile) {
            profile = newProfile;
          } else {
            console.error("Giriş sonrası otomatik profil ekleme başarısız (RLS aktif olabilir):", insertErr);
            profile = { id: data.user.id, full_name: defaultName, role: defaultRole };
          }
        } catch (e) {
          console.error("Giriş sonrası profil iyileştirme sırasında istisna:", e);
          profile = { id: data.user.id, full_name: defaultName, role: defaultRole };
        }
      }

      return profile;
    } else {
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        throw new Error('E-posta veya şifre hatalı!');
      }

      // Demo role değiştirme desteği (Test kolaylığı için)
      if (demoRole) {
        user.role = demoRole;
      }

      localStorage.setItem(LS_CURRENT_USER, JSON.stringify(user));
      return user;
    }
  },

  async signup(email, password, fullName, role) {
    if (isSupabaseActive()) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, full_name: fullName, role }])
        .select()
        .single();

      if (profileErr) throw profileErr;
      return profile;
    } else {
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Bu e-posta adresi zaten kullanımda!');
      }

      const newUser = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        email,
        password,
        full_name: fullName,
        role
      };

      users.push(newUser);
      localStorage.setItem(LS_USERS, JSON.stringify(users));
      // Otomatik giriş yaptır
      localStorage.setItem(LS_CURRENT_USER, JSON.stringify(newUser));
      return newUser;
    }
  },

  async logout() {
    if (isSupabaseActive()) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LS_CURRENT_USER);
    }
  },

  async getSurveyants() {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'sürveyan');
      if (error) throw error;
      return data;
    } else {
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      return users.filter(u => u.role === 'sürveyan');
    }
  },

  // ------------------------------------------
  // TEAMS
  // ------------------------------------------
  async getTeams() {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Her ekibin üyelerini de çekelim
      const teamsWithMembers = await Promise.all(data.map(async (team) => {
        const { data: members } = await supabase
          .from('team_members')
          .select('profiles(*)')
          .eq('team_id', team.id);
        
        return {
          ...team,
          members: members ? members.map(m => m.profiles) : []
        };
      }));

      return teamsWithMembers;
    } else {
      const teams = JSON.parse(localStorage.getItem(LS_TEAMS) || '[]');
      const members = JSON.parse(localStorage.getItem(LS_TEAM_MEMBERS) || '[]');
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');

      return teams.map(team => {
        const teamMemberIds = members.filter(m => m.team_id === team.id).map(m => m.user_id);
        const teamUsers = users.filter(u => teamMemberIds.includes(u.id));
        return {
          ...team,
          members: teamUsers
        };
      }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  async addTeam(name, surveyantIds = []) {
    if (isSupabaseActive()) {
      const { data: team, error } = await supabase
        .from('teams')
        .insert([{ name }])
        .select()
        .single();
      
      if (error) throw error;

      if (surveyantIds.length > 0) {
        const mapping = surveyantIds.map(surveyantId => ({
          team_id: team.id,
          user_id: surveyantId
        }));
        const { error: memberErr } = await supabase
          .from('team_members')
          .insert(mapping);
        if (memberErr) throw memberErr;
      }

      return team;
    } else {
      const teams = JSON.parse(localStorage.getItem(LS_TEAMS) || '[]');
      if (teams.find(t => t.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Bu isimde bir ekip zaten mevcut!');
      }

      const newTeam = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        name,
        created_at: new Date().toISOString()
      };

      teams.push(newTeam);
      localStorage.setItem(LS_TEAMS, JSON.stringify(teams));

      if (surveyantIds.length > 0) {
        const members = JSON.parse(localStorage.getItem(LS_TEAM_MEMBERS) || '[]');
        surveyantIds.forEach(userId => {
          members.push({ team_id: newTeam.id, user_id: userId });
        });
        localStorage.setItem(LS_TEAM_MEMBERS, JSON.stringify(members));
      }

      return newTeam;
    }
  },

  async updateTeam(teamId, name, surveyantIds = []) {
    if (isSupabaseActive()) {
      // 1. Ekip ismini güncelle
      const { error: teamErr } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', teamId);
      
      if (teamErr) throw teamErr;

      // 2. Mevcut ekip üyelerini sil
      const { error: deleteErr } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);
      
      if (deleteErr) throw deleteErr;

      // 3. Yeni üyeleri ekle
      if (surveyantIds.length > 0) {
        const mapping = surveyantIds.map(surveyantId => ({
          team_id: teamId,
          user_id: surveyantId
        }));
        const { error: memberErr } = await supabase
          .from('team_members')
          .insert(mapping);
        if (memberErr) throw memberErr;
      }

      return { id: teamId, name };
    } else {
      const teams = JSON.parse(localStorage.getItem(LS_TEAMS) || '[]');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex === -1) throw new Error('Ekip bulunamadı!');

      // İsim çakışması kontrolü (kendisi hariç)
      if (teams.some(t => t.id !== teamId && t.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Bu isimde bir ekip zaten mevcut!');
      }

      teams[teamIndex].name = name;
      localStorage.setItem(LS_TEAMS, JSON.stringify(teams));

      // Üyeleri güncelle
      let members = JSON.parse(localStorage.getItem(LS_TEAM_MEMBERS) || '[]');
      members = members.filter(m => m.team_id !== teamId);
      surveyantIds.forEach(userId => {
        members.push({ team_id: teamId, user_id: userId });
      });
      localStorage.setItem(LS_TEAM_MEMBERS, JSON.stringify(members));

      return teams[teamIndex];
    }
  },

  // ------------------------------------------
  // STATIONS
  // ------------------------------------------
  async getStations() {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const stations = JSON.parse(localStorage.getItem(LS_STATIONS) || '[]');
      return [...stations].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  async addStation(code, name, location, details) {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('stations')
        .insert([{ code, name, location, details }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const stations = JSON.parse(localStorage.getItem(LS_STATIONS) || '[]');
      if (stations.find(s => s.code.toUpperCase() === code.toUpperCase())) {
        throw new Error('Bu istasyon kodu zaten kullanımda!');
      }

      const newStation = {
        id: 's-' + Math.random().toString(36).substr(2, 9),
        code: code.toUpperCase(),
        name,
        location,
        details,
        created_at: new Date().toISOString()
      };

      stations.push(newStation);
      localStorage.setItem(LS_STATIONS, JSON.stringify(stations));
      return newStation;
    }
  },

  async getStationDetails(stationId) {
    if (isSupabaseActive()) {
      const { data: station, error } = await supabase
        .from('stations')
        .select('*')
        .eq('id', stationId)
        .single();
      if (error) throw error;

      // Arızaları da çekelim
      const { data: faults } = await supabase
        .from('station_faults')
        .select(`
          *,
          assigned_team:teams!station_faults_assigned_team_id_fkey(id, name),
          resolved_by_team:teams!station_faults_resolved_by_team_id_fkey(id, name),
          station_fault_teams(team:teams(id, name)),
          station_fault_users(user:profiles(id, full_name))
        `)
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });

      const mappedFaults = (faults || []).map(fault => {
        let assignedTeams = fault.station_fault_teams ? fault.station_fault_teams.map(t => t.team).filter(Boolean) : [];
        let assignedUsers = fault.station_fault_users ? fault.station_fault_users.map(u => u.user).filter(Boolean) : [];

        // Geriye dönük uyumluluk: Eğer tablo boşsa ama assigned_team varsa ekle
        if (assignedTeams.length === 0 && fault.assigned_team) {
          assignedTeams = [fault.assigned_team];
        }

        return {
          ...fault,
          assigned_teams: assignedTeams,
          assigned_users: assignedUsers
        };
      });

      return {
        ...station,
        faults: mappedFaults
      };
    } else {
      const stations = JSON.parse(localStorage.getItem(LS_STATIONS) || '[]');
      const station = stations.find(s => s.id === stationId);
      if (!station) throw new Error('İstasyon bulunamadı!');

      const faults = JSON.parse(localStorage.getItem(LS_STATION_FAULTS) || '[]');
      const teams = JSON.parse(localStorage.getItem(LS_TEAMS) || '[]');
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');

      const stationFaults = faults
        .filter(f => f.station_id === stationId)
        .map(f => {
          const assignedTeam = teams.find(t => t.id === f.assigned_team_id);
          const resolvedByTeam = teams.find(t => t.id === f.resolved_by_team_id);

          const teamIds = f.assigned_team_ids || (f.assigned_team_id ? [f.assigned_team_id] : []);
          const assignedTeams = teams.filter(t => teamIds.includes(t.id));

          const userIds = f.assigned_user_ids || [];
          const assignedUsers = users.filter(u => userIds.includes(u.id)).map(u => ({ id: u.id, full_name: u.full_name }));

          return {
            ...f,
            assigned_team: assignedTeam ? { id: assignedTeam.id, name: assignedTeam.name } : null,
            resolved_by_team: resolvedByTeam ? { id: resolvedByTeam.id, name: resolvedByTeam.name } : null,
            assigned_teams: assignedTeams,
            assigned_users: assignedUsers
          };
        })
        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

      return {
        ...station,
        faults: stationFaults
      };
    }
  },

  // ------------------------------------------
  // FAULT TEMPLATES (GENEL ARIZALAR)
  // ------------------------------------------
  async getFaultTemplates() {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('fault_templates')
        .select('*')
        .order('title', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      const templates = JSON.parse(localStorage.getItem(LS_FAULT_TEMPLATES) || '[]');
      return [...templates].sort((a,b) => a.title.localeCompare(b.title));
    }
  },

  async addFaultTemplate(title, description) {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('fault_templates')
        .insert([{ title, description }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const templates = JSON.parse(localStorage.getItem(LS_FAULT_TEMPLATES) || '[]');
      if (templates.find(t => t.title.toLowerCase() === title.toLowerCase())) {
        throw new Error('Bu isimde bir arıza şablonu zaten mevcut!');
      }

      const newTemplate = {
        id: 'ft-' + Math.random().toString(36).substr(2, 9),
        title,
        description,
        created_at: new Date().toISOString()
      };

      templates.push(newTemplate);
      localStorage.setItem(LS_FAULT_TEMPLATES, JSON.stringify(templates));
      return newTemplate;
    }
  },

  // ------------------------------------------
  // STATION FAULTS (ARIZA KAYITLARI)
  // ------------------------------------------
  async getAllFaults() {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('station_faults')
        .select(`
          *,
          station:stations(code, name),
          assigned_team:teams!station_faults_assigned_team_id_fkey(id, name),
          resolved_by_team:teams!station_faults_resolved_by_team_id_fkey(id, name),
          station_fault_teams(team:teams(id, name)),
          station_fault_users(user:profiles(id, full_name))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      return data.map(fault => {
        let assignedTeams = fault.station_fault_teams ? fault.station_fault_teams.map(t => t.team).filter(Boolean) : [];
        let assignedUsers = fault.station_fault_users ? fault.station_fault_users.map(u => u.user).filter(Boolean) : [];

        if (assignedTeams.length === 0 && fault.assigned_team) {
          assignedTeams = [fault.assigned_team];
        }

        return {
          ...fault,
          assigned_teams: assignedTeams,
          assigned_users: assignedUsers
        };
      });
    } else {
      const faults = JSON.parse(localStorage.getItem(LS_STATION_FAULTS) || '[]');
      const stations = JSON.parse(localStorage.getItem(LS_STATIONS) || '[]');
      const teams = JSON.parse(localStorage.getItem(LS_TEAMS) || '[]');
      const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');

      return faults.map(f => {
        const station = stations.find(s => s.id === f.station_id);
        const assignedTeam = teams.find(t => t.id === f.assigned_team_id);
        const resolvedByTeam = teams.find(t => t.id === f.resolved_by_team_id);

        const teamIds = f.assigned_team_ids || (f.assigned_team_id ? [f.assigned_team_id] : []);
        const assignedTeams = teams.filter(t => teamIds.includes(t.id));

        const userIds = f.assigned_user_ids || [];
        const assignedUsers = users.filter(u => userIds.includes(u.id)).map(u => ({ id: u.id, full_name: u.full_name }));

        return {
          ...f,
          station: station ? { code: station.code, name: station.name } : { code: 'N/A', name: 'Bilinmeyen' },
          assigned_team: assignedTeam ? { id: assignedTeam.id, name: assignedTeam.name } : null,
          resolved_by_team: resolvedByTeam ? { id: resolvedByTeam.id, name: resolvedByTeam.name } : null,
          assigned_teams: assignedTeams,
          assigned_users: assignedUsers
        };
      }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  async addStationFault(stationId, title, description, urgency, assignedTeamIds = [], assignedUserIds = []) {
    const teamIds = Array.isArray(assignedTeamIds) ? assignedTeamIds : (assignedTeamIds ? [assignedTeamIds] : []);
    const userIds = Array.isArray(assignedUserIds) ? assignedUserIds : (assignedUserIds ? [assignedUserIds] : []);

    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('station_faults')
        .insert([{
          station_id: stationId,
          title,
          description,
          urgency,
          status: 'açık',
          assigned_team_id: teamIds[0] || null
        }])
        .select()
        .single();
      if (error) throw error;

      if (teamIds.length > 0) {
        const teamMapping = teamIds.map(tId => ({
          fault_id: data.id,
          team_id: tId
        }));
        const { error: teamErr } = await supabase
          .from('station_fault_teams')
          .insert(teamMapping);
        if (teamErr) throw teamErr;
      }

      if (userIds.length > 0) {
        const userMapping = userIds.map(uId => ({
          fault_id: data.id,
          user_id: uId
        }));
        const { error: userErr } = await supabase
          .from('station_fault_users')
          .insert(userMapping);
        if (userErr) throw userErr;
      }

      return data;
    } else {
      const faults = JSON.parse(localStorage.getItem(LS_STATION_FAULTS) || '[]');
      const newFault = {
        id: 'f-' + Math.random().toString(36).substr(2, 9),
        station_id: stationId,
        title,
        description,
        urgency,
        status: 'açık',
        assigned_team_id: teamIds[0] || null,
        assigned_team_ids: teamIds,
        assigned_user_ids: userIds,
        resolved_by_team_id: null,
        resolved_at: null,
        created_at: new Date().toISOString()
      };

      faults.push(newFault);
      localStorage.setItem(LS_STATION_FAULTS, JSON.stringify(faults));
      return newFault;
    }
  },

  async assignFaultTeamsAndUsers(faultId, assignedTeamIds = [], assignedUserIds = []) {
    const teamIds = Array.isArray(assignedTeamIds) ? assignedTeamIds : (assignedTeamIds ? [assignedTeamIds] : []);
    const userIds = Array.isArray(assignedUserIds) ? assignedUserIds : (assignedUserIds ? [assignedUserIds] : []);

    if (isSupabaseActive()) {
      await supabase
        .from('station_faults')
        .update({ assigned_team_id: teamIds[0] || null })
        .eq('id', faultId);

      await supabase
        .from('station_fault_teams')
        .delete()
        .eq('fault_id', faultId);

      if (teamIds.length > 0) {
        const teamMapping = teamIds.map(tId => ({
          fault_id: faultId,
          team_id: tId
        }));
        await supabase
          .from('station_fault_teams')
          .insert(teamMapping);
      }

      await supabase
        .from('station_fault_users')
        .delete()
        .eq('fault_id', faultId);

      if (userIds.length > 0) {
        const userMapping = userIds.map(uId => ({
          fault_id: faultId,
          user_id: uId
        }));
        await supabase
          .from('station_fault_users')
          .insert(userMapping);
      }

      return { faultId, teamIds, userIds };
    } else {
      const faults = JSON.parse(localStorage.getItem(LS_STATION_FAULTS) || '[]');
      const faultIndex = faults.findIndex(f => f.id === faultId);
      if (faultIndex === -1) throw new Error('Arıza kaydı bulunamadı!');

      faults[faultIndex] = {
        ...faults[faultIndex],
        assigned_team_id: teamIds[0] || null,
        assigned_team_ids: teamIds,
        assigned_user_ids: userIds
      };

      localStorage.setItem(LS_STATION_FAULTS, JSON.stringify(faults));
      return faults[faultIndex];
    }
  },

  async resolveFault(faultId, resolvedByTeamId, resolutionNotes = null, usedParts = null) {
    if (isSupabaseActive()) {
      const { data, error } = await supabase
        .from('station_faults')
        .update({
          status: 'yapıldı',
          resolved_by_team_id: resolvedByTeamId || null,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null,
          used_parts: usedParts || null
        })
        .eq('id', faultId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const faults = JSON.parse(localStorage.getItem(LS_STATION_FAULTS) || '[]');
      const faultIndex = faults.findIndex(f => f.id === faultId);
      
      if (faultIndex === -1) throw new Error('Arıza kaydı bulunamadı!');

      faults[faultIndex] = {
        ...faults[faultIndex],
        status: 'yapıldı',
        resolved_by_team_id: resolvedByTeamId || null,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes || null,
        used_parts: usedParts || null
      };

      localStorage.setItem(LS_STATION_FAULTS, JSON.stringify(faults));
      return faults[faultIndex];
    }
  },

  async getSurveyantFaults(userId) {
    if (isSupabaseActive()) {
      const { data: memberOf, error: memberErr } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);
      
      if (memberErr) throw memberErr;
      const teamIds = memberOf ? memberOf.map(m => m.team_id) : [];

      let faultIds = [];

      if (teamIds.length > 0) {
        const { data: teamFaults } = await supabase
          .from('station_fault_teams')
          .select('fault_id')
          .in('team_id', teamIds);
        if (teamFaults) {
          faultIds.push(...teamFaults.map(tf => tf.fault_id));
        }

        const { data: legacyFaults } = await supabase
          .from('station_faults')
          .select('id')
          .in('assigned_team_id', teamIds);
        if (legacyFaults) {
          faultIds.push(...legacyFaults.map(lf => lf.id));
        }
      }

      const { data: userFaults } = await supabase
        .from('station_fault_users')
        .select('fault_id')
        .eq('user_id', userId);
      if (userFaults) {
        faultIds.push(...userFaults.map(uf => uf.fault_id));
      }

      faultIds = [...new Set(faultIds)];

      if (faultIds.length === 0) return [];

      const { data: faults, error } = await supabase
        .from('station_faults')
        .select(`
          *,
          station:stations(code, name),
          assigned_team:teams!station_faults_assigned_team_id_fkey(id, name),
          resolved_by_team:teams!station_faults_resolved_by_team_id_fkey(id, name),
          station_fault_teams(team:teams(id, name)),
          station_fault_users(user:profiles(id, full_name))
        `)
        .in('id', faultIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return faults.map(fault => {
        let assignedTeams = fault.station_fault_teams ? fault.station_fault_teams.map(t => t.team).filter(Boolean) : [];
        let assignedUsers = fault.station_fault_users ? fault.station_fault_users.map(u => u.user).filter(Boolean) : [];

        if (assignedTeams.length === 0 && fault.assigned_team) {
          assignedTeams = [fault.assigned_team];
        }

        return {
          ...fault,
          assigned_teams: assignedTeams,
          assigned_users: assignedUsers
        };
      });
    } else {
      const members = JSON.parse(localStorage.getItem(LS_TEAM_MEMBERS) || '[]');
      const userTeamIds = members.filter(m => m.user_id === userId).map(m => m.team_id);
      
      const allFaults = await this.getAllFaults();

      return allFaults.filter(f => {
        const hasTeamMatch = f.assigned_teams && f.assigned_teams.some(team => userTeamIds.includes(team.id));
        const hasUserMatch = f.assigned_users && f.assigned_users.some(user => user.id === userId);
        const hasLegacyMatch = userTeamIds.includes(f.assigned_team_id);

        return hasTeamMatch || hasUserMatch || hasLegacyMatch;
      });
    }
  },

  async getSurveyantTeams(userId) {
    if (isSupabaseActive()) {
      const { data: memberOf, error: memberErr } = await supabase
        .from('team_members')
        .select('teams(*)')
        .eq('user_id', userId);
      if (memberErr) throw memberErr;
      return memberOf ? memberOf.map(m => m.teams) : [];
    } else {
      const members = JSON.parse(localStorage.getItem(LS_TEAM_MEMBERS) || '[]');
      const teams = JSON.parse(localStorage.getItem(LS_TEAMS) || '[]');
      const userTeamIds = members.filter(m => m.user_id === userId).map(m => m.team_id);
      return teams.filter(t => userTeamIds.includes(t.id));
    }
  }
};
