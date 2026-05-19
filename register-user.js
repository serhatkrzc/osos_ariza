const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yhgtodsrukiwtrddgvmo.supabase.co';
const supabaseAnonKey = 'sb_publishable_9kvToxahDpOrTyEy_yMvqg_j-cMAhHW';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function register() {
  console.log("Supabase üzerinde kullanıcı kaydı başlatılıyor...");
  
  const email = 'yetkili@osos.com';
  const password = 'yetkili123'; // Supabase en az 6 karakter ister
  const fullName = 'Ayşe Kaya';
  const role = 'yetkili';

  // 1. Auth Kaydı
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    console.error("❌ Auth Kayıt Hatası:", error.message, error);
    return;
  }

  console.log("API Yanıtı:", JSON.stringify(data, null, 2));

  const user = data.user;

  if (!user) {
    console.error("❌ Kullanıcı oluşturulamadı. Kullanıcı null döndü.");
    return;
  }

  console.log("✅ Auth kaydı başarılı! User ID:", user.id);

  // 2. Profiles Tablosuna Ekleme
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      { id: user.id, full_name: fullName, role: role }
    ]);

  if (profileError) {
    console.error("❌ Profil Tablosuna Ekleme Hatası:", profileError.message);
    console.log("\n💡 UYARI: Bu hata, Supabase üzerinde 'profiles' tablosunun henüz oluşturulmadığını gösterir.");
    console.log("Lütfen Supabase SQL Editor sayfasına gidip schema.sql dosyasındaki komutları çalıştırın.");
  } else {
    console.log("\n🚀 BAŞARILI! yetkili@osos.com kullanıcısı başarıyla oluşturuldu.");
    console.log("👉 Giriş Bilgileri:");
    console.log(`   E-posta: ${email}`);
    console.log(`   Şifre: ${password}`);
  }
}

register();
