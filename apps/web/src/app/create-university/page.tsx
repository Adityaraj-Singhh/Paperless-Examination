'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { api, handleApiError } from '@/lib/api-client';
import Link from 'next/link';

const createUniversitySchema = z.object({
  name: z.string().min(1, 'University name is required'),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logo: z.string().url().optional().or(z.literal('')),
});

type CreateUniversityFormData = z.infer<typeof createUniversitySchema>;

export default function CreateUniversityPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !hasRole(UserRole.SUPER_ADMIN)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, hasRole, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUniversityFormData>({
    resolver: zodResolver(createUniversitySchema),
  });

  const onSubmit = async (data: CreateUniversityFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.universities.create(data);
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
            <CardTitle>Create New University</CardTitle>
            <CardDescription>
              Add a new university to the system. You can then assign administrators to manage it.
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
                  ✓ University created successfully! Redirecting...
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">University Name *</Label>
                  <Input
                    id="name"
                    placeholder="Harvard University"
                    {...register('name')}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">University Code *</Label>
                  <Input
                    id="code"
                    placeholder="HARVARD"
                    {...register('code')}
                    disabled={isLoading}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-600">{errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@harvard.edu"
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
                    placeholder="+1-617-495-1000"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Location</h3>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Massachusetts Hall"
                    {...register('address')}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Cambridge"
                      {...register('city')}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Massachusetts"
                      {...register('state')}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="USA"
                    {...register('country')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional</h3>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.harvard.edu"
                    {...register('website')}
                    disabled={isLoading}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    {...register('logo')}
                    disabled={isLoading}
                  />
                  {errors.logo && (
                    <p className="text-sm text-red-600">{errors.logo.message}</p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create University'}
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
