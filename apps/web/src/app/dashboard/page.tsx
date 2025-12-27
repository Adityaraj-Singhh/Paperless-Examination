'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth.store';
import { UserRole } from '@paperless/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasRole } = useAuth();
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [adminsByUniversity, setAdminsByUniversity] = useState<Record<string, any[]>>({});
  const queryClient = useQueryClient();
  const [allAdmins, setAllAdmins] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.roles.includes(UserRole.SUPER_ADMIN)) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uniRes, userRes] = await Promise.all([
        api.universities.getAll(),
        api.users.getAll(),
      ]);
      const universities = uniRes.data.data || [];
      const users = userRes.data.data || [];
      setUniversities(universities);
      setUsers(users);
      // Build adminsByUniversity map
      const adminsMap: Record<string, any[]> = {};
      for (const uni of universities) {
        adminsMap[uni.id] = users.filter(
          (u) =>
            u.university &&
            u.university.id === uni.id &&
            u.userRoles.some((ur: any) => ur.role.name === UserRole.ADMIN)
        );
      }
      setAdminsByUniversity(adminsMap);

      // Extract all admins
      const allAdminsList = users.filter((u) =>
        u.userRoles.some((ur: any) => ur.role.name === UserRole.ADMIN)
      );
      setAllAdmins(allAdminsList);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, universityId: string) => {
    if (!confirm('Are you sure you want to remove this admin? This will permanently delete the admin user.')) {
      return;
    }

    try {
      await api.users.delete(adminId);
      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Failed to remove admin:', error);
      alert('Failed to remove admin. Please try again.');
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // SUPER_ADMIN Dashboard
  if (hasRole(UserRole.SUPER_ADMIN)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              SUPER ADMIN Dashboard
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {user.firstName}!</CardTitle>
              <CardDescription>
                Manage universities and system administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                As a SUPER_ADMIN, you have access to create universities and assign
                administrators to manage them.
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add University</CardTitle>
                <CardDescription>
                  Create a new university in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/create-university">
                  <Button className="w-full">Create University</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Admin</CardTitle>
                <CardDescription>
                  Create a new administrator user for a university
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/create-admin-user">
                  <Button className="w-full">Create Admin User</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* System Administrators Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>System Administrators</CardTitle>
              <CardDescription>
                {allAdmins.length} administrator(s) in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading administrators...</p>
              ) : allAdmins.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    No administrators yet. Create one to get started.
                  </p>
                  <Link href="/create-admin-user">
                    <Button>Create First Admin</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          University
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allAdmins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {admin.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {admin.university ? (
                              <>
                                {admin.university.name}
                                <span className="text-gray-400 ml-1">({admin.university.code})</span>
                              </>
                            ) : (
                              <span className="text-red-500">No University</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              admin.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {admin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Universities List */}
          <Card>
            <CardHeader>
              <CardTitle>Universities</CardTitle>
              <CardDescription>
                {universities.length} university(ies) registered in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading universities...</p>
              ) : universities.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    No universities yet. Create one to get started.
                  </p>
                  <Link href="/create-university">
                    <Button>Create First University</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schools
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Admins
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {universities.map((uni) => (
                        <tr key={uni.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {uni.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {uni.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {uni._count?.users || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {uni._count?.schools || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(uni.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col gap-2">
                              {adminsByUniversity[uni.id]?.length > 0 ? (
                                <div className="space-y-1">
                                  {adminsByUniversity[uni.id].map((admin) => (
                                    <div key={admin.id} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-xs">
                                      <span className="text-gray-900">
                                        {admin.firstName} {admin.lastName}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-red-600 hover:text-red-800"
                                        onClick={() => handleRemoveAdmin(admin.id, uni.id)}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">No admin assigned</span>
                              )}
                              <Link href={`/create-admin-user?universityId=${uni.id}`}>
                                <Button variant="outline" size="sm" className="w-full text-xs">
                                  {adminsByUniversity[uni.id]?.length > 0 ? 'Add Another Admin' : 'Assign Admin'}
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Regular User Dashboard
  // Admin/Teacher/Student Dashboard: Show university name if available
  const [university, setUniversity] = useState<any | null>(null);

  useEffect(() => {
    // Only fetch if user has universityId and not SUPER_ADMIN
    if (
      user?.universityId &&
      !user.roles.includes(UserRole.SUPER_ADMIN)
    ) {
      // Try to get university name from user.university (if present)
      if ((user as any).university && (user as any).university.name) {
        setUniversity((user as any).university);
      } else {
        // Fetch from API
        api.universities.getById(user.universityId)
          .then((res) => setUniversity(res.data.data))
          .catch(() => setUniversity(null));
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {user.firstName} {user.lastName}!
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Roles:</strong> {user.roles.join(', ')}
            </p>
            {user.universityId && !user.roles.includes(UserRole.SUPER_ADMIN) && (
              <p>
                <strong>University:</strong>{' '}
                {university ? (
                  <>
                    {university.name}
                    {university.code ? ` (${university.code})` : ''}
                  </>
                ) : (
                  'Loading...'
                )}
              </p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex gap-3">
              <Link href="/admin">
                <Button>Academic Management</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
