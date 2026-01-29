'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Jurusan {
  id: string;
  nama: string;
  kode: string;
  createdAt: string;
}

export default function JurusanPage() {
  const [jurusans, setJurusans] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJurusan, setEditingJurusan] = useState<Jurusan | null>(null);
  const [formData, setFormData] = useState({ nama: '', kode: '' });

  useEffect(() => {
    fetchJurusans();
  }, []);

  const fetchJurusans = async () => {
    try {
      const response = await fetch('/api/jurusan');
      const data = await response.json();
      setJurusans(data.jurusans || []);
    } catch (error) {
      console.error('Failed to fetch jurusans:', error);
      toast.error('Gagal memuat data jurusan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingJurusan
        ? `/api/jurusan/${editingJurusan.id}`
        : '/api/jurusan';

      const method = editingJurusan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan jurusan');
      }

      toast.success(editingJurusan ? 'Jurusan berhasil diperbarui' : 'Jurusan berhasil ditambahkan');
      setIsDialogOpen(false);
      setEditingJurusan(null);
      setFormData({ nama: '', kode: '' });
      fetchJurusans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (jurusan: Jurusan) => {
    setEditingJurusan(jurusan);
    setFormData({ nama: jurusan.nama, kode: jurusan.kode });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jurusan ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/jurusan/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus jurusan');
      }

      toast.success('Jurusan berhasil dihapus');
      fetchJurusans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredJurusans = jurusans.filter(
    (j) =>
      j.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.kode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Jurusan</h1>
          <p className="text-muted-foreground">
            Tambah dan kelola jurusan SMK
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" onClick={() => {
              setEditingJurusan(null);
              setFormData({ nama: '', kode: '' });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jurusan
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingJurusan ? 'Edit Jurusan' : 'Tambah Jurusan'}
              </DialogTitle>
              <DialogDescription>
                {editingJurusan ? 'Edit data jurusan yang ada' : 'Tambah jurusan baru ke sistem'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Jurusan</Label>
                  <Input
                    id="nama"
                    placeholder="Contoh: Desain Komunikasi Visual"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kode">Kode Jurusan</Label>
                  <Input
                    id="kode"
                    placeholder="Contoh: DKV"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="rounded-xl">
                  {editingJurusan ? 'Simpan Perubahan' : 'Tambah Jurusan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Daftar Jurusan</CardTitle>
          <CardDescription>
            Total {filteredJurusans.length} jurusan terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari jurusan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredJurusans.length === 0 ? (
            <Alert>
              <GraduationCap className="h-4 w-4" />
              <AlertDescription>
                {searchTerm ? 'Tidak ada jurusan yang cocok dengan pencarian' : 'Belum ada jurusan yang ditambahkan'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Jurusan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJurusans.map((jurusan) => (
                    <TableRow key={jurusan.id}>
                      <TableCell className="font-medium">{jurusan.kode}</TableCell>
                      <TableCell>{jurusan.nama}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(jurusan)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(jurusan.id)}
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
    </div>
  );
}
