'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserRole } from '@paperless/shared';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // Don't show navigation on login/register pages
  if (!isAuthenticated || !user || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isSuperAdmin = user.roles.includes(UserRole.SUPER_ADMIN);

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Paperless Exam
            </Link>
            <div className="ml-10 flex gap-4">
              {isSuperAdmin && (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link href="/universities">
                    <Button variant="ghost">Universities</Button>
                  </Link>
                  <Link href="/create-admin">
                    <Button variant="ghost">Create Admin</Button>
                  </Link>
                </>
              )}
              {!isSuperAdmin && (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {user.firstName} {user.lastName}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
