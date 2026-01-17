# PendaftaranScale

Sistem Pendaftaran dan Dashboard Admin untuk event Scale.

## Fitur

-   **Pendaftaran Tim**: Wizard pendaftaran multi-langkah dengan pembayaran.
-   **Dashboard Peserta**: Kelola profil, status pembayaran, dan submisi.
-   **Dashboard Admin**: Verifikasi pembayaran, kelola pengguna, dan atur booth.
-   **Integrasi Pembayaran**: Menggunakan YoGateway untuk pembayaran QRIS.
-   **Manajemen Konten**: Edit pengumuman dan resources.

## Teknologi

-   **Framework**: Next.js 16 (App Router)
-   **Styling**: Tailwind CSS
-   **Database**: PostgreSQL (via Prisma ORM)
-   **Auth**: NextAuth.js
-   **Template**: Based on TailAdmin Free Next.js Template

## Cara Install

1.  Clone repository:
    \\\ash
    git clone https://github.com/jamesaja2/pendaftaranscale.git
    cd pendaftaranscale
    \\\

2.  Install dependencies:
    \\\ash
    npm install
    \\\

3.  Setup Environment Variables:
    Copy \.env\ dan sesuaikan dengan konfigurasi database dan payment gateway Anda.

4.  Jalankan database migration:
    \\\ash
    npx prisma db push
    \\\

5.  Jalankan server development:
    \\\ash
    npm run dev
    \\\

## Deployment ke Vercel

1.  Push project ke GitHub.
2.  Import project di Vercel.
3.  Set Environment Variables di Vercel (DATABASE_URL, NEXTAUTH_SECRET, etc).
4.  Build command sudah dikonfigurasi otomatis (\prisma generate && next build\).
