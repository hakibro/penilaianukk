import { LayoutWrapper } from '@/components/layout-wrapper';
import { getUser } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('=== DashboardLayout ===');
  const user = await getUser();
  console.log('User from getUser:', user);

  return <LayoutWrapper user={user}>{children}</LayoutWrapper>;
}
