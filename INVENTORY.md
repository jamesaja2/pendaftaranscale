# Sistem Inventaris Bazaar

## Deskripsi
Fitur inventaris untuk mendata barang-barang yang akan dibawa oleh peserta saat hari-H bazaar. Sistem ini memiliki form dinamis yang menyesuaikan field input berdasarkan kategori barang yang dipilih.

## Fitur Utama

### 1. **Untuk Peserta**
- **Input Inventaris**: Form untuk menambahkan item barang dengan detail lengkap
- **Kategori Barang**:
  - **Elektronik**: Input Watt, Ampere, Voltage, Brand
  - **Peralatan**: Input Material, Dimensi, Berat
  - **Furniture**: Input Material, Dimensi
  - **Dekorasi**: Input Material, Dimensi
  - **Lainnya**: Form dasar tanpa field tambahan
- **Edit & Delete**: Peserta dapat mengedit atau menghapus item kapan saja
- **Submit Inventaris**: Submit form tetapi masih bisa edit setelahnya
- **Download PDF**: Export daftar inventaris ke PDF

### 2. **Untuk Admin**
- **Lihat Semua Inventaris**: Daftar semua tim yang sudah submit
- **Search**: Cari berdasarkan nama tim, ketua, atau email
- **Lihat Detail**: View lengkap inventaris per tim
- **Download PDF**: 
  - Per tim individual
  - Semua tim sekaligus (comprehensive PDF)

## Database Schema

### Model InventoryItem
```prisma
model InventoryItem {
  id          String       @id @default(cuid())
  teamId      String
  name        String
  category    ItemCategory
  quantity    Int          @default(1)
  unit        String?
  description String?
  
  // Elektronik specific
  watt        Float?
  ampere      Float?
  voltage     Float?
  brand       String?
  
  // Peralatan/Furniture/Dekorasi specific
  material    String?
  dimensions  String?
  weight      Float?
  
  // General
  condition   String?
  notes       String?
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  team        Team         @relation(...)
}
```

### Model InventorySubmission
```prisma
model InventorySubmission {
  id          String   @id @default(cuid())
  teamId      String   @unique
  submittedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  team        Team     @relation(...)
}
```

### Enum ItemCategory
```prisma
enum ItemCategory {
  ELEKTRONIK
  PERALATAN
  FURNITURE
  DEKORASI
  LAINNYA
}
```

## Routes

### Peserta
- **Path**: `/my-inventory`
- **Component**: `src/app/(admin)/(others-pages)/my-inventory/page.tsx`
- **Features**:
  - View, add, edit, delete inventory items
  - Submit inventory (can still edit after submit)
  - Download PDF

### Admin
- **Path**: `/inventory`
- **Component**: `src/app/(admin)/(others-pages)/inventory/page.tsx`
- **Features**:
  - View all teams' inventories
  - Search teams
  - View detailed inventory per team
  - Download individual or all PDFs

## Components

### InventoryForm
**Path**: `src/components/bazaar/InventoryForm.tsx`

Form dengan dynamic fields berdasarkan kategori:
- Basic fields: Nama, Kategori, Jumlah, Satuan, Kondisi, Deskripsi
- Category-specific fields yang muncul kondisional
- Validasi client-side

### InventoryList
**Path**: `src/components/bazaar/InventoryList.tsx`

Komponen untuk display & manage items:
- Grid layout dengan cards
- Edit & delete buttons
- Add new item button
- Conditional rendering category-specific details

### AdminInventoryView
**Path**: `src/components/bazaar/AdminInventoryView.tsx`

Admin view dengan fitur:
- List semua tim yang sudah submit
- Search functionality
- Detail view per tim
- PDF export (individual & all)

## Server Actions

**Path**: `src/actions/inventory.ts`

- `getTeamInventory()`: Get inventory items untuk tim tertentu (participant) atau specified teamId (admin)
- `getAllInventories()`: Get semua inventaris dari semua tim (admin only)
- `addInventoryItem()`: Tambah item baru
- `updateInventoryItem()`: Edit item existing
- `deleteInventoryItem()`: Hapus item
- `submitInventory()`: Submit inventaris (create/update InventorySubmission)

## PDF Export

Menggunakan **jsPDF** dan **jspdf-autotable**:
- Auto-table dengan headers & styling
- Category-specific details dalam spesifikasi column
- Kondisi, catatan, dan informasi lengkap
- Format: `Inventaris_[NamaTim].pdf` atau `Inventaris_Semua_Tim.pdf`

## Sidebar Navigation

### Peserta
```
📦 Inventaris Barang → /my-inventory
```

### Admin
```
📦 Inventaris Tim → /inventory
```

## Instalasi

### Dependencies
```bash
npm install jspdf jspdf-autotable
```

### Database Migration
```bash
npx prisma db push
npx prisma generate
```

## Workflow Peserta

1. **Login** sebagai participant
2. **Navigate** ke "Inventaris Barang" di sidebar
3. **Klik "Tambah Item"**
4. **Pilih kategori** barang
5. **Isi form** (fields akan menyesuaikan kategori)
6. **Simpan item**
7. **Ulangi** untuk semua barang
8. **Klik "Submit Inventaris"** ketika sudah lengkap
9. **Download PDF** untuk dokumentasi
10. **Edit kapan saja** jika ada perubahan

## Workflow Admin

1. **Login** sebagai admin
2. **Navigate** ke "Inventaris Tim" di sidebar
3. **Lihat daftar** tim yang sudah submit
4. **Search** tim tertentu jika perlu
5. **Klik "Lihat Detail"** untuk melihat inventaris lengkap
6. **Download PDF** per tim atau semua tim sekaligus

## Security & Authorization

- **Participant**: Hanya bisa akses inventaris tim sendiri
- **Admin**: Bisa lihat semua inventaris
- Server actions menggunakan `getServerSession` untuk validasi
- Team ownership di-check sebelum CRUD operations

## Field Validation

### Required Fields
- Nama Barang
- Kategori
- Jumlah

### Optional Fields
- Semua field lainnya optional untuk fleksibilitas

### Client-side Validation
- Input type number untuk quantity, watt, ampere, voltage, weight
- Step 0.01 untuk decimal numbers
- Min value untuk quantity

## Notes
- Peserta **dapat mengedit setelah submit** untuk fleksibilitas
- PDF auto-generated dengan format rapi
- Search case-insensitive untuk admin view
- Responsive design untuk mobile & desktop
