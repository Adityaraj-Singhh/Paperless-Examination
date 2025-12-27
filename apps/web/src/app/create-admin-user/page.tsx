'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/store/auth.store';
import { UserRole } from '@paperless/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, handleApiError } from '@/lib/api-client';
import Link from 'next/link';

const createAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  universityId: z.string().uuid('Valid university ID is required'),
  phone: z.string().optional(),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

export default function CreateAdminUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, hasRole } = useAuth();
  const [universities, setUniversities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUnis, setIsFetchingUnis] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const prefilledUniversityId = searchParams.get('universityId');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/dashboard');
      return;
    }

    fetchUniversities();
  }, [isAuthenticated, router]);

  const fetchUniversities = async () => {
    try {
      setIsFetchingUnis(true);
      const response = await api.universities.getAll();
      setUniversities(response.data.data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsFetchingUnis(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      universityId: prefilledUniversityId || '',
    },
  });

  const onSubmit = async (data: CreateAdminFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.users.createAdmin(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.universityId,
        data.phone
      );

      setSuccess(true);
      reset();

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard">
          <Button variant="outline" className="mb-6">
            ← Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create Admin User</CardTitle>
            <CardDescription>
              Create a new administrator for a university to manage schools,
              departments, and courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                  ✓ Admin user created successfully! Redirecting...
                </div>
              )}

              {/* University Selection */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Select University</h3>

                <div className="space-y-2">
                  <Label htmlFor="universityId">University *</Label>
                  <Select
                    disabled={isLoading || isFetchingUnis}
                    value={watch('universityId') || ''}
                    onValueChange={(value) => setValue('universityId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a university..." />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.name} ({uni.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.universityId && (
                    <p className="text-sm text-red-600">
                      {errors.universityId.message}
                    </p>
                  )}
                  {universities.length === 0 && !isFetchingUnis && (
                    <div className="rounded bg-blue-50 p-3 text-sm text-blue-800">
                      No universities found.{' '}
                      <Link href="/create-university" className="font-semibold underline">
                        Create one first
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Information */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Admin Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      {...register('firstName')}
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      {...register('lastName')}
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@university.edu"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1-555-0100"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Credentials</h3>

                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 mb-4">
                  <p className="font-semibold mb-1">Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character (@, $, !, %, *, ?, &)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Admin@12345"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || isFetchingUnis || universities.length === 0}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Admin'}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
