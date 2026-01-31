/*
  Warnings:

  - You are about to drop the column `bobot` on the `elemen_kompetensi` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_elemen_kompetensi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "aspekId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "elemen_kompetensi_aspekId_fkey" FOREIGN KEY ("aspekId") REFERENCES "aspek_penilaian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_elemen_kompetensi" ("aspekId", "createdAt", "id", "nama", "updatedAt") SELECT "aspekId", "createdAt", "id", "nama", "updatedAt" FROM "elemen_kompetensi";
DROP TABLE "elemen_kompetensi";
ALTER TABLE "new_elemen_kompetensi" RENAME TO "elemen_kompetensi";
CREATE INDEX "elemen_kompetensi_aspekId_idx" ON "elemen_kompetensi"("aspekId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
