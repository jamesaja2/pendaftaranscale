import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create Admin User
  const adminEmail = 'admin@admin.com';
  const adminPassword = await bcrypt.hash('admin', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
        password: adminPassword,
        role: 'ADMIN'
    },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin: ${admin.email} (password: admin)`);

  // Seed Students
  const students = [
    { nis: '12345', name: 'Budi Santoso', class: 'XII RPL 1' },
    { nis: '12346', name: 'Siti Aminah', class: 'XII TKJ 2' },
    { nis: '12347', name: 'Rudi Hartono', class: 'XI MM 1' },
    { nis: '12348', name: 'Dewi Lestari', class: 'X OTP 3' },
    { nis: '12349', name: 'Eko Prasetyo', class: 'XII RPL 1' },
  ];

  for (const s of students) {
    const student = await prisma.student.upsert({
      where: { nis: s.nis },
      update: {},
      create: s,
    });
    console.log(`Created student with id: ${student.id}`);
  }

  // Seed GlobalSettings
  const settings = [
    { key: 'guidebook', value: 'https://example.com/guidebook.pdf', description: 'Link to PDF Guidebook' },
    { key: 'event_poster', value: '/images/cards/card-01.png', description: 'Main event poster image URL' },
    { key: 'slider_images', value: JSON.stringify(['/images/carousel/slide1.jpg', '/images/carousel/slide2.jpg']), description: 'JSON array of slider image URLs' },
    { key: 'whatsapp_group_link', value: 'https://chat.whatsapp.com/invite/code', description: 'WhatsApp Group Invite Link' },
    { key: 'payment_qr_image', value: '/images/cards/card-02.png', description: 'QR Code for Payment' },
    { key: 'payment_gateway_id', value: 'YOUR_MERCHANT_ID', description: 'YoGateway Merchant ID' },
    { key: 'payment_gateway_key', value: 'YOUR_SECRET_KEY', description: 'YoGateway Secret Key' },
  ];

  for (const s of settings) {
    const setting = await prisma.globalSettings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
    console.log(`Created setting: ${setting.key}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
