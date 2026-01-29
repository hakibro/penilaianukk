import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@ukk.id' },
    update: {},
    create: {
      email: 'superadmin@ukk.id',
      name: 'Superadmin',
      password: 'demo123',
      role: 'SUPERADMIN',
    },
  });
  console.log('Created superadmin:', superadmin.email);

  // Create admin jurusan
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ukk.id' },
    update: {},
    create: {
      email: 'admin@ukk.id',
      name: 'Admin Jurusan',
      password: 'demo123',
      role: 'ADMIN_JURUSAN',
    },
  });

  // Create penilai
  const penilaiUser = await prisma.user.upsert({
    where: { email: 'penilai@ukk.id' },
    update: {},
    create: {
      email: 'penilai@ukk.id',
      name: 'Penilai',
      password: 'demo123',
      role: 'PENILAI',
    },
  });

  // Create jurusans
  const dkv = await prisma.jurusan.upsert({
    where: { kode: 'DKV' },
    update: {},
    create: {
      nama: 'Desain Komunikasi Visual',
      kode: 'DKV',
    },
  });
  console.log('Created jurusan:', dkv.nama);

  const tkj = await prisma.jurusan.upsert({
    where: { kode: 'TKJ' },
    update: {},
    create: {
      nama: 'Teknik Komputer dan Jaringan',
      kode: 'TKJ',
    },
  });
  console.log('Created jurusan:', tkj.nama);

  const rpl = await prisma.jurusan.upsert({
    where: { kode: 'RPL' },
    update: {},
    create: {
      nama: 'Rekayasa Perangkat Lunak',
      kode: 'RPL',
    },
  });
  console.log('Created jurusan:', rpl.nama);

  // Link admin to jurusan
  await prisma.adminJurusan.upsert({
    where: {
      userId_jurusanId: {
        userId: adminUser.id,
        jurusanId: dkv.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      jurusanId: dkv.id,
    },
  });

  // Create kriteria penilaian
  const kriterias = [
    {
      nama: 'Sangat Baik',
      nilaiMin: 85,
      nilaiMax: 100,
      keterangan: 'Memenuhi semua kriteria dengan sangat baik',
    },
    {
      nama: 'Baik',
      nilaiMin: 70,
      nilaiMax: 84,
      keterangan: 'Memenuhi sebagian besar kriteria dengan baik',
    },
    {
      nama: 'Cukup',
      nilaiMin: 55,
      nilaiMax: 69,
      keterangan: 'Memenuhi kriteria dengan cukup',
    },
    {
      nama: 'Kurang',
      nilaiMin: 40,
      nilaiMax: 54,
      keterangan: 'Memenuhi kriteria dengan kurang',
    },
    {
      nama: 'Sangat Kurang',
      nilaiMin: 0,
      nilaiMax: 39,
      keterangan: 'Tidak memenuhi kriteria',
    },
  ];

  for (const kriteria of kriterias) {
    await prisma.kriteriaPenilaian.upsert({
      where: {
        id: kriteria.nama.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {},
      create: kriteria,
    });
    console.log('Created kriteria:', kriteria.nama);
  }

  // Create penilai
  await prisma.penilai.upsert({
    where: { id: 'penilai-1' },
    update: {},
    create: {
      id: 'penilai-1',
      nama: 'Budi Santoso',
      jenis: 'INTERNAL',
      jurusanId: dkv.id,
    },
  });

  await prisma.penilai.upsert({
    where: { id: 'penilai-2' },
    update: {},
    create: {
      id: 'penilai-2',
      nama: 'PT Digital Kreatif',
      jenis: 'EKSTERNAL',
      instansi: 'PT Digital Kreatif',
      jurusanId: dkv.id,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
