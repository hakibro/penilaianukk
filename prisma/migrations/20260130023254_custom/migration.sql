-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "jurusanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "jurusan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jurusan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admin_jurusan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jurusanId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "admin_jurusan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "admin_jurusan_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "jurusan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kriteria_penilaian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "nilaiMin" INTEGER NOT NULL DEFAULT 0,
    "nilaiMax" INTEGER NOT NULL DEFAULT 100,
    "keterangan" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idperson" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "lahirTempat" TEXT NOT NULL DEFAULT '',
    "lahirTanggal" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "idkelasFormal" TEXT NOT NULL DEFAULT '',
    "kelasFormal" TEXT NOT NULL DEFAULT '',
    "asramaPondok" TEXT NOT NULL DEFAULT '',
    "kamarPondok" TEXT NOT NULL DEFAULT '',
    "tingkatDiniyah" TEXT NOT NULL DEFAULT '',
    "kelasDiniyah" TEXT NOT NULL DEFAULT '',
    "siswaStatus" TEXT NOT NULL DEFAULT '1',
    "personStatus" TEXT NOT NULL DEFAULT '1',
    "jurusanId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "siswa_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "jurusan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "penilai" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "instansi" TEXT,
    "jurusanId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "penilai_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "jurusan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "penilai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aspek_penilaian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "jurusanId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "aspek_penilaian_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "jurusan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "elemen_kompetensi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "bobot" REAL NOT NULL,
    "aspekId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "elemen_kompetensi_aspekId_fkey" FOREIGN KEY ("aspekId") REFERENCES "aspek_penilaian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sub_elemen_kompetensi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "elemenId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sub_elemen_kompetensi_elemenId_fkey" FOREIGN KEY ("elemenId") REFERENCES "elemen_kompetensi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "penilaian_aspek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siswaId" TEXT NOT NULL,
    "penilaiId" TEXT NOT NULL,
    "elemenId" TEXT NOT NULL,
    "nilai" REAL NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "penilaian_aspek_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penilaian_aspek_penilaiId_fkey" FOREIGN KEY ("penilaiId") REFERENCES "penilai" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penilaian_aspek_elemenId_fkey" FOREIGN KEY ("elemenId") REFERENCES "elemen_kompetensi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "penilaian_aspek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "penilaian_kriteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "penilaianAspekId" TEXT NOT NULL,
    "kriteriaId" TEXT NOT NULL,
    "userId" TEXT,
    "penilaiId" TEXT,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "nilai" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "penilaian_kriteria_penilaianAspekId_fkey" FOREIGN KEY ("penilaianAspekId") REFERENCES "penilaian_aspek" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "penilaian_kriteria_kriteriaId_fkey" FOREIGN KEY ("kriteriaId") REFERENCES "kriteria_penilaian" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "penilaian_kriteria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "penilaian_kriteria_penilaiId_fkey" FOREIGN KEY ("penilaiId") REFERENCES "penilai" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_jurusanId_idx" ON "User"("jurusanId");

-- CreateIndex
CREATE UNIQUE INDEX "jurusan_nama_key" ON "jurusan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "jurusan_kode_key" ON "jurusan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "admin_jurusan_userId_jurusanId_key" ON "admin_jurusan"("userId", "jurusanId");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_idperson_key" ON "siswa"("idperson");

-- CreateIndex
CREATE INDEX "siswa_jurusanId_idx" ON "siswa"("jurusanId");

-- CreateIndex
CREATE INDEX "penilai_jurusanId_idx" ON "penilai"("jurusanId");

-- CreateIndex
CREATE INDEX "aspek_penilaian_jurusanId_idx" ON "aspek_penilaian"("jurusanId");

-- CreateIndex
CREATE INDEX "elemen_kompetensi_aspekId_idx" ON "elemen_kompetensi"("aspekId");

-- CreateIndex
CREATE INDEX "sub_elemen_kompetensi_elemenId_idx" ON "sub_elemen_kompetensi"("elemenId");

-- CreateIndex
CREATE INDEX "penilaian_aspek_siswaId_idx" ON "penilaian_aspek"("siswaId");

-- CreateIndex
CREATE INDEX "penilaian_aspek_penilaiId_idx" ON "penilaian_aspek"("penilaiId");

-- CreateIndex
CREATE INDEX "penilaian_aspek_elemenId_idx" ON "penilaian_aspek"("elemenId");

-- CreateIndex
CREATE INDEX "penilaian_kriteria_penilaianAspekId_idx" ON "penilaian_kriteria"("penilaianAspekId");

-- CreateIndex
CREATE INDEX "penilaian_kriteria_kriteriaId_idx" ON "penilaian_kriteria"("kriteriaId");
