-- OSOS İstasyon ve Arıza Takip Sistemi Supabase SQL Şeması
-- Bu SQL kodlarını Supabase SQL Editor kısmına yapıştırarak tablolarınızı saniyeler içinde oluşturabilirsiniz.

-- 1. PROFILLER TABLOSU (Kullanıcı Rolleri İçin)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('yetkili', 'tekniker')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. EKİPLER TABLOSU
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. EKİP ÜYELERİ MAPPING TABLOSU
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- 4. İSTASYONLAR TABLOSU
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location TEXT NOT NULL, -- Koordinat, harita linki veya açık adres
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. GENEL ARIZALAR (ŞABLONLAR) TABLOSU
CREATE TABLE IF NOT EXISTS public.fault_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. İSTASYON ARIZA KAYITLARI TABLOSU
CREATE TABLE IF NOT EXISTS public.station_faults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    urgency TEXT NOT NULL CHECK (urgency IN ('acil', 'orta', 'düşük')),
    status TEXT NOT NULL DEFAULT 'açık' CHECK (status IN ('açık', 'yapıldı')),
    assigned_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    resolved_by_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    used_parts TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ÖRNEK VERİ TOHUMLAMA (Opsiyonel)
-- Bu veriler Supabase tarafında testleri kolaylaştırmak için kullanılabilir.

-- Genel Arızalar Tohumlama
INSERT INTO public.fault_templates (title, description) VALUES
('Haberleşme Hatası', 'İstasyon ile merkez sunucu arasında bağlantı koptu.'),
('Güç Kaynağı Arızası', 'UPS veya şebeke elektriğinde kesinti veya dalgalanma.'),
('Sinyal Seviyesi Düşük', 'GSM/RF anten sinyal gücü yetersiz seviyede.'),
('Fiziksel Hasar / Sabotaj', 'Kabin kapağı açık veya fiziksel müdahale tespit edildi.')
ON CONFLICT (title) DO NOTHING;

-- Supabase Auth tetikleyicisi (Yeni kullanıcı kaydolduğunda profiles tablosuna otomatik ekleme yapmak isterseniz):
-- Not: Kayıt formumuzda profil kaydını dbService üzerinden doğrudan yaptığımız için bu tetikleyici opsiyoneldir.


-- 7. ARIZA - EKİP MAPPING TABLOSU (Çoklu Ekip Ataması İçin)
CREATE TABLE IF NOT EXISTS public.station_fault_teams (
    fault_id UUID REFERENCES public.station_faults(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    PRIMARY KEY (fault_id, team_id)
);

-- 8. ARIZA - BİREYSEL TEKNİSYEN MAPPING TABLOSU (Doğrudan Kişi Ataması İçin)
CREATE TABLE IF NOT EXISTS public.station_fault_users (
    fault_id UUID REFERENCES public.station_faults(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (fault_id, user_id)
);

-- RLS Kilitlerinin Kaldırılması (Geliştirme Kolaylığı İçin)
ALTER TABLE public.station_fault_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_fault_users DISABLE ROW LEVEL SECURITY;

