'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, UserCheck, ClipboardList, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalJurusan: number;
  totalAdmin: number;
  totalSiswa: number;
  totalKriteria: number;
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [jurusanRes, adminRes, siswaRes, kriteriaRes] = await Promise.all([
        fetch('/api/jurusan'),
        fetch('/api/admin-jurusan'),
        fetch('/api/siswa'),
        fetch('/api/kriteria'),
      ]);

      const jurusanData = await jurusanRes.json();
      const adminData = await adminRes.json();
      const siswaData = await siswaRes.json();
      const kriteriaData = await kriteriaRes.json();

      setStats({
        totalJurusan: jurusanData.total || 0,
        totalAdmin: adminData.total || 0,
        totalSiswa: siswaData.total || 0,
        totalKriteria: kriteriaData.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Jurusan',
      value: stats?.totalJurusan || 0,
      icon: GraduationCap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Admin Jurusan',
      value: stats?.totalAdmin || 0,
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Siswa',
      value: stats?.totalSiswa || 0,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Kriteria Penilaian',
      value: stats?.totalKriteria || 0,
      icon: ClipboardList,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Superadmin</h1>
        <p className="text-muted-foreground">
          Selamat datang di sistem penilaian UKK
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px]" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`rounded-full p-2 ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Akses menu utama dengan cepat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm font-medium">Tambah Jurusan</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm font-medium">Import Siswa</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm font-medium">Setup Kriteria</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
            <CardDescription>
              Status dan informasi sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Versi</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-green-500">Aktif</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-sm font-medium">SQLite</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Panduan</CardTitle>
            <CardDescription>
              Langkah-langkah penggunaan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Setup Jurusan</p>
                <p className="text-xs text-muted-foreground">
                  Buat dan kelola jurusan
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Import Siswa</p>
                <p className="text-xs text-muted-foreground">
                  Import data siswa dari API
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Setup Penilaian</p>
                <p className="text-xs text-muted-foreground">
                  Konfigurasi kriteria dan aspek
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
