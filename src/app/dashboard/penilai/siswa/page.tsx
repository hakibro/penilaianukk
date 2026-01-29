'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, Search, CheckCircle, Clock, ArrowRight, GraduationCap, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Penilai {
  id: string;
  nama: string;
  jenis: 'INTERNAL' | 'EKSTERNAL';
  instansi: string | null;
  jurusan: {
    id: string;
    nama: string;
    kode: string;
  };
}

interface Siswa {
  id: string;
  idperson: string;
  nama: string;
  kelasFormal: string;
  jurusan: {
    id: string;
    nama: string;
    kode: string;
  };
  _count?: {
    penilaianAspeks: number;
  };
}

export default function PenilaiSiswaPage() {
  const router = useRouter();
  const [penilai, setPenilai] = useState<Penilai | null>(null);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPenilaiData();
  }, []);

  const fetchPenilaiData = async () => {
    try {
      const response = await fetch('/api/penilai/mine');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal mengambil data penilai');
      }

      const data = await response.json();
      setPenilai(data.penilai);
      console.log('✅ Penilai loaded:', data.penilai.nama, 'Jurusan:', data.penilai.jurusan.nama);

      // Fetch students for the penilai's jurusan
      if (data.penilai.jurusanId) {
        fetchSiswas(data.penilai.jurusanId);
      }
    } catch (error: any) {
      console.error('Error fetching penilai:', error);
      toast.error(error.message || 'Gagal memuat data penilai');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSiswas = async (jurusanId: string) => {
    try {
      const response = await fetch(`/api/siswa?jurusanId=${jurusanId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data siswa');
      }

      const data = await response.json();
      setSiswas(data.siswas || []);
      console.log('✅ Siswas loaded:', data.siswas.length, 'siswa');
    } catch (error: any) {
      console.error('Error fetching siswas:', error);
      toast.error(error.message || 'Gagal memuat data siswa');
    }
  };

  const filteredSiswas = siswas.filter((siswa) => {
    return (
      siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siswa.idperson.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEvaluate = (siswaId: string) => {
    router.push(`/dashboard/penilai/penilaian?siswaId=${siswaId}`);
  };

  const hasBeenEvaluated = (siswa: Siswa) => {
    return siswa._count && siswa._count.penilaianAspeks > 0;
  };

  return (
    <div className="space-y-6">
      {/* Penilai Info Banner */}
      {penilai && (
        <Card className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {penilai.jenis === 'INTERNAL' ? (
                    <GraduationCap className="h-5 w-5" />
                  ) : (
                    <Building className="h-5 w-5" />
                  )}
                  {penilai.nama}
                </CardTitle>
                <CardDescription className="mt-2">
                  <span className="font-medium">{penilai.jurusan.nama}</span> ({penilai.jurusan.kode})
                  {penilai.instansi && ` • ${penilai.instansi}`}
                </CardDescription>
              </div>
              <Badge
                variant={penilai.jenis === 'INTERNAL' ? 'default' : 'secondary'}
                className="rounded-full px-4 py-1"
              >
                {penilai.jenis === 'INTERNAL' ? 'Internal' : 'Eksternal'}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Siswa
            </CardTitle>
            <div className="rounded-full p-2 bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siswas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Siswa di jurusan Anda
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sudah Dinilai
            </CardTitle>
            <div className="rounded-full p-2 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {siswas.filter(s => hasBeenEvaluated(s)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Penilaian selesai
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Belum Dinilai
            </CardTitle>
            <div className="rounded-full p-2 bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {siswas.filter(s => !hasBeenEvaluated(s)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Menunggu penilaian
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Siswa yang Dinilai</CardTitle>
          <CardDescription>
            Daftar siswa jurusan {penilai?.jurusan.nama || ''} yang perlu Anda nilai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari siswa berdasarkan nama atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md rounded-xl"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredSiswas.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchTerm
                  ? 'Tidak ada siswa yang cocok dengan pencarian'
                  : 'Tidak ada siswa di jurusan ini'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSiswas.map((siswa) => {
                    const evaluated = hasBeenEvaluated(siswa);
                    return (
                      <TableRow key={siswa.id}>
                        <TableCell className="font-mono text-sm">{siswa.idperson}</TableCell>
                        <TableCell className="font-medium">{siswa.nama}</TableCell>
                        <TableCell>{siswa.kelasFormal}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{siswa.jurusan.kode}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={evaluated ? 'default' : 'secondary'}
                            className={
                              evaluated
                                ? 'bg-green-500/10 text-green-700 border-green-500/20'
                                : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            }
                          >
                            {evaluated ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Selesai
                              </>
                            ) : (
                              <>
                                <Clock className="mr-1 h-3 w-3" />
                                Belum
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={evaluated ? 'outline' : 'default'}
                            onClick={() => handleEvaluate(siswa.id)}
                            className="rounded-xl"
                          >
                            {evaluated ? (
                              <>
                                Lihat Penilaian
                              </>
                            ) : (
                              <>
                                Nilai
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
