'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Plus, Trash2, ChevronRight, X, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface Jurusan {
  id: string;
  nama: string;
  kode: string;
}

interface AdminJurusan {
  jurusanId: string;
  jurusan: {
    id: string;
    nama: string;
    kode: string;
  };
}

interface Aspek {
  id: string;
  nama: string;
  jurusan: {
    nama: string;
  };
  elemens: Elemen[];
}

interface Elemen {
  id: string;
  nama: string;
  bobot: number;
  subElemens?: SubElemen[];
}

interface SubElemen {
  id: string;
  nama: string;
}

interface ElemenForm {
  id: string;
  nama: string;
  bobot: number;
  subElemens: string[];
}

export default function AspekPage() {
  console.log('🔥 [ASPEK PAGE LOADED] - Version 2.0.5', new Date().toISOString());

  const [aspeks, setAspeks] = useState<Aspek[]>([]);
  const [jurusans, setJurusans] = useState<Jurusan[]>([]);
  const [adminJurusan, setAdminJurusan] = useState<AdminJurusan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    jurusanId: '',
  });

  const [elemens, setElemens] = useState<ElemenForm[]>([
    { id: '1', nama: '', bobot: 0, subElemens: [] },
  ]);

  useEffect(() => {
    fetchAdminJurusan();
  }, []);

  useEffect(() => {
    fetchAspeks();
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

  const fetchAspeks = async () => {
    try {
      let url = '/api/admin/aspek';
      if (adminJurusan?.jurusanId) {
        url += `?jurusanId=${adminJurusan.jurusanId}`;
        console.log('🔍 Fetching aspeks with jurusanId:', adminJurusan.jurusanId);
      }

      const response = await fetch(url);
      const data = await response.json();
      setAspeks(data.aspeks || []);
    } catch (error) {
      console.error('Failed to fetch aspeks:', error);
      toast.error('Gagal memuat data aspek');
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
      toast.error('Gagal memuat data jurusan');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addElemen = () => {
    setElemens(prev => [
      ...prev,
      { id: Date.now().toString(), nama: '', bobot: 0, subElemens: [] },
    ]);
  };

  const removeElemen = (id: string) => {
    if (elemens.length === 1) {
      toast.error('Minimal satu elemen harus ada');
      return;
    }
    setElemens(prev => prev.filter(e => e.id !== id));
  };

  const updateElemen = (id: string, field: keyof ElemenForm, value: string | number) => {
    setElemens(prev =>
      prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addSubElemen = (elemenId: string) => {
    setElemens(prev =>
      prev.map(e =>
        e.id === elemenId
          ? { ...e, subElemens: [...e.subElemens, ''] }
          : e
      )
    );
  };

  const removeSubElemen = (elemenId: string, index: number) => {
    setElemens(prev =>
      prev.map(e =>
        e.id === elemenId
          ? { ...e, subElemens: e.subElemens.filter((_, i) => i !== index) }
          : e
      )
    );
  };

  const updateSubElemen = (elemenId: string, index: number, value: string) => {
    setElemens(prev =>
      prev.map(e =>
        e.id === elemenId
          ? {
              ...e,
              subElemens: e.subElemens.map((se, i) => (i === index ? value : se)),
            }
          : e
      )
    );
  };

  const calculateTotalBobot = () => {
    return elemens.reduce((sum, e) => sum + (e.bobot || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [ASPEK SUBMIT] handleSubmit called!', new Date().toISOString());

    // Auto-set jurusanId if admin jurusan
    const submitJurusanId = adminJurusan?.jurusanId || formData.jurusanId;

    // Validation
    if (!formData.nama || !submitJurusanId) {
      toast.error('Nama aspek dan jurusan harus diisi');
      return;
    }

    if (elemens.some(e => !e.nama || e.bobot <= 0)) {
      toast.error('Semua elemen harus memiliki nama dan bobot yang valid');
      return;
    }

    const totalBobot = calculateTotalBobot();
    if (totalBobot !== 100) {
      toast.error(`Total bobot harus 100%. Saat ini: ${totalBobot}%`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/aspek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          jurusanId: submitJurusanId,
          elemens: elemens.map(e => ({
            nama: e.nama,
            bobot: e.bobot,
            subElemens: e.subElemens.filter(se => se.trim()).map(se => ({ nama: se })),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat aspek');
      }

      toast.success('Aspek penilaian berhasil ditambahkan');
      setIsDialogOpen(false);
      resetForm();
      fetchAspeks();
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat aspek');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('🗑️ [ASPEK DELETE] Attempting to delete aspek:', id);

    if (!confirm('Apakah Anda yakin ingin menghapus aspek penilaian ini?')) {
      console.log('🗑️ [ASPEK DELETE] Cancelled by user');
      return;
    }

    console.log('🗑️ [ASPEK DELETE] Starting delete process...');

    try {
      console.log('🗑️ [ASPEK DELETE] Sending DELETE request to:', `/api/admin/aspek/${id}`);
      const response = await fetch(`/api/admin/aspek/${id}`, {
        method: 'DELETE',
      });

      console.log('🗑️ [ASPEK DELETE] Response status:', response.status);

      const data = await response.json();
      console.log('🗑️ [ASPEK DELETE] Response data:', data);

      if (!response.ok) {
        console.error('🗑️ [ASPEK DELETE] Failed to delete:', data.error);
        throw new Error(data.error || 'Gagal menghapus aspek');
      }

      toast.success('Aspek penilaian berhasil dihapus');
      fetchAspeks();
      console.log('🗑️ [ASPEK DELETE] Delete successful, refreshing list...');
    } catch (error: any) {
      console.error('🗑️ [ASPEK DELETE] Error:', error);
      toast.error(error.message || 'Gagal menghapus aspek');
    }
  };

  const resetForm = () => {
    setFormData({ 
      nama: '', 
      jurusanId: adminJurusan?.jurusanId || '' 
    });
    setElemens([{ id: '1', nama: '', bobot: 0, subElemens: [] }]);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setFormData({ 
        nama: '', 
        jurusanId: adminJurusan?.jurusanId || '' 
      });
      setElemens([{ id: '1', nama: '', bobot: 0, subElemens: [] }]);
    }
    setIsDialogOpen(open);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/aspek/template');

      if (!response.ok) {
        throw new Error('Gagal mengunduh template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-aspek-penilaian.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Template berhasil diunduh');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengunduh template');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Silakan pilih file untuk diimpor');
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/admin/aspek/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengimpor data');
      }

      // Show detailed message
      let message = data.message;
      const details: string[] = [];

      if (data.skippedInfo && data.skippedInfo.length > 0) {
        details.push(...data.skippedInfo);
      }

      if (data.errors && data.errors.length > 0) {
        details.push(`Error: ${data.errors.slice(0, 3).join(', ')}`);
        if (data.errors.length > 3) {
          details.push(`...dan ${data.errors.length - 3} error lainnya`);
        }
      }

      if (data.created === 0) {
        toast.error('Tidak ada aspek yang berhasil diimpor', {
          description: details.length > 0 ? details.join('\n') : undefined,
        });
      } else if (details.length > 0) {
        toast.warning(message, {
          description: details.join('\n'),
        });
      } else {
        toast.success(message);
      }

      setIsImportDialogOpen(false);
      setImportFile(null);
      fetchAspeks();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengimpor data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportDialogOpenChange = (open: boolean) => {
    if (!open) {
      setImportFile(null);
    }
    setIsImportDialogOpen(open);
  };

  return (
    <div className="space-y-6">
      {adminJurusan && (
        <Alert className="bg-primary/10 border-primary/20">
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            Admin Jurusan: {adminJurusan.jurusan.nama} ({adminJurusan.jurusan.kode}) - Hanya menampilkan data untuk jurusan ini
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aspek Penilaian</h1>
          <p className="text-muted-foreground">
            Kelola aspek penilaian dengan elemen dan sub-elemen kompetensi
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={handleImportDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <Upload className="mr-2 h-4 w-4" />
                Impor XLSX
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Impor Aspek Penilaian dari XLSX</DialogTitle>
                <DialogDescription>
                  Unggah file XLSX yang berisi data aspek penilaian. Pastikan format sesuai dengan template.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template Contoh
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="importFile">File XLSX</Label>
                  <Input
                    id="importFile"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportFile}
                  />
                  {importFile && (
                    <p className="text-sm text-muted-foreground">
                      File terpilih: {importFile.name}
                    </p>
                  )}
                </div>

                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-line">
                    Format file: Kode Jurusan | Nama Aspek | Nama Elemen | Bobot (%) | Sub-Elemen (opsional)
                    Total bobot setiap aspek harus 100%.
                    Kode jurusan harus sesuai dengan data yang ada di sistem.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleImportDialogOpenChange(false)}
                  disabled={isImporting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                >
                  {isImporting ? 'Mengimpor...' : 'Impor'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" onClick={() => {
                setFormData({ 
                  nama: '', 
                  jurusanId: adminJurusan?.jurusanId || '' 
                });
                setElemens([{ id: '1', nama: '', bobot: 0, subElemens: [] }]);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Aspek
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Aspek Penilaian</DialogTitle>
                <DialogDescription>
                  Buat aspek penilaian baru dengan elemen dan sub-elemen kompetensi
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nama">Nama Aspek</Label>
                    <Input
                      id="nama"
                      name="nama"
                      placeholder="Contoh: Sikap Kerja"
                      value={formData.nama}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="jurusanId">Jurusan</Label>
                    <select
                      id="jurusanId"
                      name="jurusanId"
                      value={formData.jurusanId || (adminJurusan?.jurusanId || '')}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={!!adminJurusan}
                    >
                      <option value="">Pilih Jurusan</option>
                      {jurusans.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.nama} ({j.kode})
                        </option>
                      ))}
                    </select>
                    {adminJurusan && (
                      <p className="text-xs text-muted-foreground">
                        Jurusan otomatis diatur: {adminJurusan.jurusan.nama}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Elemen Kompetensi</Label>
                      <Alert
                        className={`flex-1 ml-4 ${
                          calculateTotalBobot() === 100
                            ? 'bg-green-500/10 border-green-500/20 text-green-700'
                            : 'bg-red-500/10 border-red-500/20 text-red-700'
                        }`}
                      >
                        <AlertDescription>
                          Total Bobot: <strong>{calculateTotalBobot()}%</strong>
                          {calculateTotalBobot() !== 100 && ' (HARUS 100% untuk bisa disimpan)'}
                          {calculateTotalBobot() === 100 && ' ✓ (Valid)'}
                        </AlertDescription>
                      </Alert>
                    </div>

                    {elemens.map((elemen, index) => (
                      <Card key={elemen.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label htmlFor={`elemen-${elemen.id}-nama`}>Nama Elemen {index + 1}</Label>
                              <Input
                                id={`elemen-${elemen.id}-nama`}
                                value={elemen.nama}
                                onChange={(e) => updateElemen(elemen.id, 'nama', e.target.value)}
                                placeholder="Contoh: Tanggung Jawab"
                                required
                              />
                            </div>
                            <div className="w-24">
                              <Label htmlFor={`elemen-${elemen.id}-bobot`}>Bobot (%)</Label>
                              <Input
                                id={`elemen-${elemen.id}-bobot`}
                                type="number"
                                min="1"
                                max="100"
                                value={elemen.bobot || ''}
                                onChange={(e) => updateElemen(elemen.id, 'bobot', parseInt(e.target.value) || 0)}
                                placeholder="50"
                                required
                              />
                            </div>
                            {elemens.length > 1 && (
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeElemen(elemen.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Sub-Elemen</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSubElemen(elemen.id)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Tambah Sub-Elemen
                              </Button>
                            </div>

                            {elemen.subElemens.map((sub, subIndex) => (
                              <div key={subIndex} className="flex gap-2">
                                <Input
                                  value={sub}
                                  onChange={(e) => updateSubElemen(elemen.id, subIndex, e.target.value)}
                                  placeholder="Contoh: Selalu tepat waktu"
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSubElemen(elemen.id, subIndex)}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addElemen}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Elemen
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || calculateTotalBobot() !== 100}
                    onClick={(e) => {
                      console.log('[Aspek Page] Submit button clicked!');
                      console.log('[Aspek Page] Total bobot:', calculateTotalBobot());
                      console.log('[Aspek Page] isSubmitting:', isSubmitting);
                    }}
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Daftar Aspek Penilaian</CardTitle>
          <CardDescription>
            Total {aspeks.length} aspek penilaian terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : aspeks.length === 0 ? (
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                Belum ada aspek penilaian yang ditambahkan
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {aspeks.map((aspek) => (
                <Card key={aspek.id} className="rounded-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{aspek.nama}</CardTitle>
                        <CardDescription>{aspek.jurusan.nama}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(aspek.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Elemen Kompetensi:</p>
                      {aspek.elemens.map((elemen) => (
                        <div
                          key={elemen.id}
                          className="flex items-center justify-between rounded-lg p-3 bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{elemen.nama}</span>
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {elemen.bobot}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
