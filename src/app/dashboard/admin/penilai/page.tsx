'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Plus, Trash2, Search, Building, GraduationCap, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Penilai {
  id: string;
  nama: string;
  jenis: 'INTERNAL' | 'EKSTERNAL';
  instansi: string | null;
  jurusan: {
    nama: string;
  };
  user?: {
    id: string;
    email: string;
    password?: string;
  };
}

interface Jurusan {
  id: string;
  nama: string;
}

interface AdminJurusan {
  jurusanId: string;
  jurusan: {
    id: string;
    nama: string;
    kode: string;
  };
}

export default function PenilaiPage() {
  console.log('🔥 [PENILAI PAGE LOADED] - Version 2.0.7', new Date().toISOString());

  const [penilais, setPenilais] = useState<Penilai[]>([]);
  const [jurusans, setJurusans] = useState<Jurusan[]>([]);
  const [adminJurusan, setAdminJurusan] = useState<AdminJurusan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPenilai, setEditingPenilai] = useState<Penilai | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    jenis: 'INTERNAL' as 'INTERNAL' | 'EKSTERNAL',
    instansi: '',
    email: '',
    password: '', // ✅ Required for both INTERNAL and EKSTERNAL
    jurusanId: '',
  });

  useEffect(() => {
    fetchAdminJurusan();
  }, []);

  useEffect(() => {
    fetchData();
    fetchJurusans();
  }, [adminJurusan]);

  const fetchAdminJurusan = async () => {
    try {
      const response = await fetch('/api/admin/jurusan-mine');
      if (response.ok) {
        const data = await response.json();
        setAdminJurusan(data);
        console.log('✅ Admin jurusan fetched:', data.jurusan?.nama);
      } else {
        console.log('ℹ️ Not an admin jurusan or no jurusan assigned');
      }
    } catch (error) {
      console.error('Failed to fetch admin jurusan:', error);
    }
  };

  const fetchData = async () => {
    try {
      let url = '/api/admin/penilai';
      if (adminJurusan?.jurusanId) {
        url += `?jurusanId=${adminJurusan.jurusanId}`;
        console.log('🔍 Fetching penilai with jurusanId:', adminJurusan.jurusanId);
      }

      const penilaiRes = await fetch(url);
      const penilaiData = await penilaiRes.json();

      setPenilais(penilaiData.penilais || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJurusans = async () => {
    try {
      const response = await fetch('/api/jurusan');
      const data = await response.json();
      setJurusans(data.jurusans || []);
    } catch (error) {
      console.error('Failed to fetch jurusans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-set jurusanId if admin jurusan
    const jurusanIdToUse = adminJurusan?.jurusanId || formData.jurusanId;

    // Validation
    if (!formData.nama || !formData.jenis) {
      toast.error('Nama dan jenis penilai harus diisi');
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      toast.error('Email harus diisi untuk penilai');
      return;
    }

    if (!jurusanIdToUse) {
      toast.error('Jurusan harus dipilih');
      return;
    }

    if (!formData.password || formData.password.trim() === '') {
      toast.error('Password harus diisi untuk penilai');
      return;
    }

    const submitData = {
      nama: formData.nama,
      jenis: formData.jenis,
      instansi: formData.instansi,
      email: formData.email,
      password: formData.password,
      jurusanId: jurusanIdToUse,
    };

    try {
      const response = await fetch('/api/admin/penilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Gagal menambahkan penilai');
      }

      toast.success('Penilai berhasil ditambahkan');
      setIsDialogOpen(false);
      setFormData({
        nama: '',
        jenis: 'INTERNAL',
        instansi: '',
        email: '',
        password: '',
        jurusanId: adminJurusan?.jurusanId || ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penilai ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/penilai/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus penilai');
      }

      toast.success('Penilai berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (penilai: Penilai) => {
    setEditingPenilai(penilai);
    setFormData({
      nama: penilai.nama,
      jenis: penilai.jenis,
      instansi: penilai.instansi || '',
      email: penilai.user?.email || '',
      password: penilai.user?.password || '', // Include existing password
      jurusanId: penilai.jurusanId,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPenilai) {
      toast.error('Tidak ada penilai yang sedang diedit');
      return;
    }

    try {
      const response = await fetch(`/api/admin/penilai/${editingPenilai.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          jenis: formData.jenis,
          instansi: formData.instansi,
          email: formData.email,
          password: formData.password,
          jurusanId: adminJurusan?.jurusanId || formData.jurusanId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Gagal mengupdate penilai');
      }

      toast.success('Penilai berhasil diupdate');
      setIsEditDialogOpen(false);
      setEditingPenilai(null);
      setFormData({
        nama: '',
        jenis: 'INTERNAL',
        instansi: '',
        email: '',
        password: '',
        jurusanId: adminJurusan?.jurusanId || ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {adminJurusan && (
        <Alert className="bg-primary/10 border-primary/20">
          <GraduationCap className="h-4 w-4" />
          <AlertDescription>
            Admin Jurusan: {adminJurusan.jurusan.nama} ({adminJurusan.jurusan.kode}) - Hanya menampilkan data untuk jurusan ini
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Penilai</h1>
          <p className="text-muted-foreground">
            Tambah dan kelola penilai internal (guru) dan eksternal (industri)
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" onClick={() => {
              setFormData({
                nama: '',
                jenis: 'INTERNAL',
                instansi: '',
                email: '',
                password: '',
                jurusanId: adminJurusan?.jurusanId || ''
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Penilai
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Penilai</DialogTitle>
              <DialogDescription>
                Tambah penilai internal atau eksternal
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Penilai</Label>
                  <Input
                    id="nama"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jenis Penilai</Label>
                  <RadioGroup
                    value={formData.jenis}
                    onValueChange={(value: 'INTERNAL' | 'EKSTERNAL') =>
                      setFormData({ ...formData, jenis: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="INTERNAL" id="internal" />
                      <Label htmlFor="internal" className="font-normal">
                        Internal (Guru)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="EKSTERNAL" id="eksternal" />
                      <Label htmlFor="eksternal" className="font-normal">
                        Eksternal (Industri)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Login</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Contoh: penilai@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Email akan digunakan untuk login penilai di sistem penilaian
                  </p>
                </div>

                {formData.jenis === 'EKSTERNAL' && (
                  <div className="space-y-2">
                    <Label htmlFor="instansi">Nama Instansi</Label>
                    <Input
                      id="instansi"
                      placeholder="Contoh: PT. Digital Kreatif"
                      value={formData.instansi}
                      onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                      required={formData.jenis === 'EKSTERNAL'}
                    />
                  </div>
                )}

                {/* Password field - required for both INTERNAL and EKSTERNAL */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password Login</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={
                      formData.jenis === 'INTERNAL'
                        ? 'Masukkan password untuk login penilai'
                        : 'Masukkan password untuk login penilai (akan digenerate otomatis)'
                    }
                    value={formData.password}
                    onChange={(e) => {
                      console.log('💻 [PENILAI] Password input changed:', e.target.value);
                      setFormData({ ...formData, password: e.target.value });
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Password akan digunakan untuk login penilai di sistem penilaian
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jurusan">Jurusan</Label>
                  <Select
                    value={formData.jurusanId || (adminJurusan?.jurusanId || '')}
                    onValueChange={(value) => setFormData({ ...formData, jurusanId: value })}
                    required
                    disabled={!!adminJurusan}
                  >
                    <SelectTrigger id="jurusan">
                      <SelectValue placeholder="Pilih jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurusans.map((jurusan) => (
                        <SelectItem key={jurusan.id} value={jurusan.id}>
                          {jurusan.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {adminJurusan && (
                    <p className="text-xs text-muted-foreground">
                      Jurusan otomatis diatur: {adminJurusan.jurusan.nama}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="rounded-xl">
                  Tambah Penilai
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Daftar Penilai</CardTitle>
          <CardDescription>
            Total {penilais.length} penilai terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : penilais.length === 0 ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Belum ada penilai yang ditambahkan
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Instansi</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penilais.map((penilai) => (
                    <TableRow key={penilai.id}>
                      <TableCell className="font-medium">{penilai.nama}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            penilai.jenis === 'INTERNAL'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {penilai.jenis === 'INTERNAL' ? (
                            <>
                              <GraduationCap className="mr-1 h-3 w-3" />
                              Internal
                            </>
                          ) : (
                            <>
                              <Building className="mr-1 h-3 w-3" />
                              Eksternal
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{penilai.user?.email || '-'}</TableCell>
                      <TableCell>{penilai.instansi || '-'}</TableCell>
                      <TableCell>{penilai.jurusan.nama}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(penilai)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(penilai.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Penilai Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Penilai</DialogTitle>
            <DialogDescription>
              Edit data penilai internal atau eksternal
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Penilai</Label>
                <Input
                  id="edit-nama"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Penilai</Label>
                <RadioGroup
                  value={formData.jenis}
                  onValueChange={(value: 'INTERNAL' | 'EKSTERNAL') =>
                    setFormData({ ...formData, jenis: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INTERNAL" id="edit-internal" />
                    <Label htmlFor="edit-internal" className="font-normal">
                      Internal (Guru)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EKSTERNAL" id="edit-eksternal" />
                    <Label htmlFor="edit-eksternal" className="font-normal">
                      Eksternal (Industri)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Login</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Contoh: penilai@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Email akan digunakan untuk login penilai di sistem penilaian
                </p>
              </div>

              {formData.jenis === 'EKSTERNAL' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-instansi">Nama Instansi</Label>
                  <Input
                    id="edit-instansi"
                    placeholder="Contoh: PT. Digital Kreatif"
                    value={formData.instansi}
                    onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                    required={formData.jenis === 'EKSTERNAL'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-password">Password Login</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Masukkan password baru (biarkan kosong jika tidak ingin mengubah)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Biarkan kosong jika tidak ingin mengubah password
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-jurusan">Jurusan</Label>
                <Select
                  value={formData.jurusanId || (adminJurusan?.jurusanId || '')}
                  onValueChange={(value) => setFormData({ ...formData, jurusanId: value })}
                  required
                  disabled={!!adminJurusan}
                >
                  <SelectTrigger id="edit-jurusan">
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusans.map((jurusan) => (
                      <SelectItem key={jurusan.id} value={jurusan.id}>
                        {jurusan.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {adminJurusan && (
                  <p className="text-xs text-muted-foreground">
                    Jurusan otomatis diatur: {adminJurusan.jurusan.nama}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="rounded-xl">
                Update Penilai
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
