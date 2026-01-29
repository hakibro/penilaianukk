'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Plus, Download, RefreshCw, Search, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Jurusan {
  id: string;
  nama: string;
  kode: string;
}

interface Siswa {
  id: string;
  idperson: string;
  nama: string;
  gender: string;
  lahirTempat: string;
  lahirTanggal: string;
  phone: string;
  kelasFormal: string;
  jurusan: {
    nama: string;
    kode: string;
  };
}

export default function SiswaPage() {
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [jurusans, setJurusans] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJurusan, setSelectedJurusan] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [siswaRes, jurusanRes] = await Promise.all([
        fetch('/api/siswa'),
        fetch('/api/jurusan'),
      ]);

      const siswaData = await siswaRes.json();
      const jurusanData = await jurusanRes.json();

      setSiswas(siswaData.siswas || []);
      setJurusans(jurusanData.jurusans || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      const response = await fetch('/api/siswa/import', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengimpor data siswa');
      }

      let message = `Berhasil mengimpor ${data.imported} siswa.`;

      // Tampilkan detail jika ada siswa yang tidak ter-assign jurusan
      const hasUnmatched = data.notMatched > 0 && data.unmatchedJurusans && Object.keys(data.unmatchedJurusans).length > 0;

      if (hasUnmatched) {
        const unmatchedList = Object.entries(data.unmatchedJurusans)
          .map(([kode, students]: [string, string[]]) => `- ${kode}: ${students.length} siswa`)
          .join('\n');

        console.warn('Unmatched jurusans:', data.unmatchedJurusans);

        let deleteMessage = data.deleted > 0 ? `\n${data.deleted} dihapus (tidak ada di API).` : '';

        toast.warning(
          `${message}\n${data.skipped} dilewati.\n${data.notMatched} tidak ter-assign jurusan:\n${unmatchedList}${deleteMessage}`,
          { duration: 10000 }
        );
      } else {
        let extraMessage = '';
        if (data.deleted > 0) {
          extraMessage = ` ${data.deleted} dihapus (tidak ada di API).`;
        }
        toast.success(`${message} ${data.skipped} dilewati.${extraMessage}`);
      }

      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredSiswas = siswas.filter((siswa) => {
    const matchesSearch =
      siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siswa.idperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siswa.kelasFormal.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJurusan =
      selectedJurusan === 'all' || siswa.jurusan.id === selectedJurusan;

    return matchesSearch && matchesJurusan;
  });

  const selectedJurusanName = jurusans.find(j => j.id === selectedJurusan)?.nama || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Siswa</h1>
          <p className="text-muted-foreground">
            Kelola data siswa kelas XII untuk ujian UKK
          </p>
        </div>

        <Button
          className="rounded-xl"
          onClick={handleImport}
          disabled={isImporting || jurusans.length === 0}
        >
          {isImporting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Mengimpor...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Import dari API
            </>
          )}
        </Button>
      </div>

      {jurusans.length === 0 && (
        <Alert>
          <AlertDescription>
            Silakan buat jurusan terlebih dahulu sebelum mengimpor data siswa.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>
            Total {filteredSiswas.length} siswa terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari siswa berdasarkan nama, NIS, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedJurusan} onValueChange={setSelectedJurusan}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter Jurusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jurusan</SelectItem>
                {jurusans.map((jurusan) => (
                  <SelectItem key={jurusan.id} value={jurusan.id}>
                    {jurusan.nama} ({jurusan.kode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredSiswas.length === 0 ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                {searchTerm || selectedJurusan !== 'all'
                  ? 'Tidak ada siswa yang cocok dengan filter'
                  : 'Belum ada data siswa. Silakan import dari API.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-xl border overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>L/P</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSiswas.map((siswa) => (
                    <TableRow key={siswa.id}>
                      <TableCell className="font-medium">{siswa.idperson}</TableCell>
                      <TableCell>{siswa.nama}</TableCell>
                      <TableCell>{siswa.kelasFormal}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span>{siswa.jurusan.nama}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          siswa.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {siswa.gender}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
