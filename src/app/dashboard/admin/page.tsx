'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardCheck, BookOpen, FileText, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalPenilai: number;
  totalAspek: number;
  totalPenilaian: number;
  totalSiswa: number;
}

/**
 * Dashboard Admin Jurusan
 * Shows statistics and quick access for admin jurusan users
 */
export default function AdminJurusanDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [penilaiRes, aspekRes, penilaianRes, siswaRes] = await Promise.all([
        fetch('/api/admin/penilai'),
        fetch('/api/admin/aspek'),
        fetch('/api/admin/penilaian'),
        fetch('/api/siswa'),
      ]);

      const penilaiData = await penilaiRes.json();
      const aspekData = await aspekRes.json();
      const penilaianData = await penilaianRes.json();
      const siswaData = await siswaRes.json();

      setStats({
        totalPenilai: penilaiData.total || 0,
        totalAspek: aspekData.total || 0,
        totalPenilaian: penilaianData.total || 0,
        totalSiswa: siswaData.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Penilai',
      value: stats?.totalPenilai || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Aspek Penilaian',
      value: stats?.totalAspek || 0,
      icon: BookOpen,
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
      title: 'Penilaian Selesai',
      value: stats?.totalPenilaian || 0,
      icon: ClipboardCheck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin Jurusan</h1>
        <p className="text-muted-foreground">
          Selamat datang di panel admin jurusan
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Menu Cepat</CardTitle>
            <CardDescription>
              Akses menu utama dengan cepat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm font-medium">Kelola Penilai</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm font-medium">Kelola Aspek Penilaian</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm font-medium">Lihat Laporan</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Status Penilaian</CardTitle>
            <CardDescription>
              Progress penilaian UKK
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress Penilaian</span>
                <span className="font-medium">
                  {stats?.totalSiswa ? Math.round((stats.totalPenilaian / stats.totalSiswa) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${stats?.totalSiswa ? (stats.totalPenilaian / stats.totalSiswa) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalPenilaian || 0} dari {stats?.totalSiswa || 0} siswa sudah dinilai
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
