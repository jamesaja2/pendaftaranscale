# 🚀 Panduan Deployment Vercel

## Masalah "Production Staged" / Build Gagal

Jika deployment Anda gagal atau stuck di "staged", ikuti langkah-langkah berikut:

---

## ✅ Checklist Sebelum Deploy

### 1. **Setup Environment Variables di Vercel**

Buka **Vercel Dashboard** → Pilih Project → **Settings** → **Environment Variables**

#### Required Variables (WAJIB):

```env
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
NEXTAUTH_SECRET=your-random-secret-key-at-least-32-characters-long
NEXTAUTH_URL=https://your-project-name.vercel.app
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

#### Cara Generate NEXTAUTH_SECRET:
```bash
# Run di terminal:
openssl rand -base64 32

# Atau di PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### ⚠️ PENTING untuk DATABASE_URL:
- Pastikan menggunakan **Connection String** yang benar dari provider database Anda (Neon, Supabase, Railway, dll)
- Tambahkan `?sslmode=require` di akhir URL untuk production
- Test connection terlebih dahulu

### 2. **Verifikasi Build Settings**

Di **Vercel Dashboard** → **Settings** → **General** → **Build & Development Settings**:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (atau kosongkan untuk default)
- **Output Directory:** `.next` (atau kosongkan untuk default)
- **Install Command:** `npm install` (atau kosongkan untuk default)

### 3. **Set Environment untuk Production**

Saat menambahkan Environment Variables, pastikan centang:
- ✅ **Production**
- ☑️ Preview (opsional)
- ☑️ Development (opsional)

---

## 🔧 Langkah Troubleshooting

### Jika Deployment Masih Gagal:

#### **Cara 1: Force Redeploy**
1. Buka **Vercel Dashboard** → Project
2. Klik tab **Deployments**
3. Pilih deployment yang gagal
4. Klik titik tiga (•••) → **Redeploy**
5. Centang **"Use existing Build Cache"** → **OFF**
6. Klik **Redeploy**

#### **Cara 2: Clear Build Cache**
1. **Settings** → **General**
2. Scroll ke bawah → **Clear Build Cache**
3. Push kode lagi atau trigger redeploy

#### **Cara 3: Check Logs**
1. Buka deployment yang gagal
2. Klik tab **"Build Logs"** atau **"Function Logs"**
3. Cari error message (biasanya berisi kata kunci: `Error`, `Failed`, `Cannot`)
4. Common errors:
   - `Prisma Client could not be generated` → DATABASE_URL tidak ada
   - `NEXTAUTH_SECRET is not set` → Environment variable tidak di-set
   - `Cannot connect to database` → DATABASE_URL salah atau database mati

---

## 📝 Setelah Setup Environment Variables

1. **Commit & Push perubahan terbaru:**
   ```bash
   git add .
   git commit -m "fix: update deployment configuration"
   git push origin main
   ```

2. **Atau trigger empty commit untuk redeploy:**
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push origin main
   ```

3. **Tunggu build selesai** (biasanya 2-5 menit)

---

## 🗄️ Database Setup (Jika Belum Ada)

### Rekomendasi Database Provider Gratis:

#### **1. Neon.tech (Recommended)**
- Gratis 0.5 GB storage
- Auto-scaling
- URL: https://neon.tech

#### **2. Supabase**
- Gratis 500 MB storage
- URL: https://supabase.com

#### **3. Railway**
- $5 credit gratis
- URL: https://railway.app

### Setup Database:
1. Buat database di provider pilihan
2. Copy **Connection String** (format PostgreSQL)
3. Paste ke Vercel Environment Variables → `DATABASE_URL`
4. Jalankan migrasi (opsional, jika ada):
   ```bash
   npx prisma migrate deploy
   ```
   Atau seed database:
   ```bash
   npx prisma db push
   npm run seed
   ```

---

## 📞 Masih Gagal?

Jika masih belum berhasil setelah mengikuti semua langkah:

1. **Screenshot error logs** dari Vercel deployment
2. Cek apakah semua environment variables sudah benar
3. Pastikan DATABASE_URL bisa diakses (test dengan prisma studio lokal):
   ```bash
   npx prisma studio
   ```
4. Verifikasi Google OAuth credentials sudah benar dan authorized redirect URL sudah ditambahkan:
   - `https://your-domain.vercel.app/api/auth/callback/google`

---

## ✨ Best Practices

- **Jangan hardcode secrets** di kode
- **Gunakan .env.example** sebagai template (sudah tersedia)
- **Test lokal** dengan `npm run build` sebelum push
- **Backup database** sebelum migrasi major

---

## 🎯 Quick Fix Checklist

- [ ] DATABASE_URL ada di Vercel env vars dan benar
- [ ] NEXTAUTH_SECRET ada dan minimal 32 karakter
- [ ] NEXTAUTH_URL sesuai dengan domain production
- [ ] Google OAuth credentials benar
- [ ] Build cache sudah di-clear
- [ ] Force redeploy sudah dicoba
- [ ] Build logs sudah dicek untuk error spesifik
- [ ] Database bisa diakses dari luar (tidak localhost)

Semoga berhasil! 🚀
