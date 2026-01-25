'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { updateUserSchema, type UpdateUserSchema } from '@/schema/user.schema';
import { getCurrentUser, updateUser, updateAvatar, getCompleteUserProfile } from '@/API/user.api';
import { useAuthStore } from '@/store/auth.store';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { Gender } from '@/lib/enums';
import { z } from 'zod';

const formSchema = updateUserSchema;
type FormData = z.infer<typeof formSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const result = await getCompleteUserProfile(user.id);
      if (!result.success) {
        toast.error(typeof result.response === 'string' ? result.response : 'Failed to load profile');
        return null;
      }
      return result.response;
    },
    enabled: !!user?.id,
  });

  const currentUser = profileData?.user || user;
  const userProfile = profileData?.user?.userProfile;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser?.name || '',
      gender: userProfile?.gender || undefined,
      age: userProfile?.age || undefined,
      address: userProfile?.address || '',
      city: userProfile?.city || '',
      state: userProfile?.state || '',
      country: userProfile?.country || '',
      postalCode: userProfile?.postalCode || '',
      phone: userProfile?.phone || '',
      website: userProfile?.website || '',
      bio: userProfile?.bio || '',
      longitude: userProfile?.longitude || undefined,
      latitude: userProfile?.latitude || undefined,
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (currentUser) {
      setValue('name', currentUser.name);
    }
    if (userProfile) {
      setValue('gender', userProfile.gender || undefined);
      setValue('age', userProfile.age || undefined);
      setValue('address', userProfile.address || '');
      setValue('city', userProfile.city || '');
      setValue('state', userProfile.state || '');
      setValue('country', userProfile.country || '');
      setValue('postalCode', userProfile.postalCode || '');
      setValue('phone', userProfile.phone || '');
      setValue('website', userProfile.website || '');
      setValue('bio', userProfile.bio || '');
      setValue('longitude', userProfile.longitude || undefined);
      setValue('latitude', userProfile.latitude || undefined);
    }
  }, [currentUser, userProfile, setValue]);

  const { mutateAsync: updateUserMutate, isPending: isUpdating } = useMutation({
    mutationFn: updateUser,
  });

  const { mutateAsync: updateAvatarMutate, isPending: isUpdatingAvatar } = useMutation({
    mutationFn: updateAvatar,
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const { success, response } = await updateAvatarMutate(avatarFile);
    if (!success) {
      toast.error(typeof response === 'string' ? response : 'Failed to update avatar');
      return;
    }

    if ('id' in response) {
      setUser(response);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Avatar updated successfully');
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleLocationUpdate = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;

        setValue('longitude', longitude);
        setValue('latitude', latitude);

        const { success, response } = await updateUserMutate({
          longitude,
          latitude,
        });

        if (!success) {
          toast.error(typeof response === 'string' ? response : 'Failed to update location');
          return;
        }

        if ('id' in response) {
          setUser(response);
          queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
          toast.success('Location updated successfully');
        }
      },
      (error) => {
        toast.error('Failed to get location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const onSubmit = async (data: FormData) => {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== ''),
    ) as UpdateUserSchema;

    const { success, response } = await updateUserMutate(cleanData);
    if (!success) {
      toast.error(typeof response === 'string' ? response : 'Failed to update profile');
      return;
    }

    if ('id' in response) {
      setUser(response);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully');
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your account information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || currentUser?.avatar || undefined} alt={currentUser?.name} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Label htmlFor="avatar-upload" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                      <Upload className="mr-2 h-4 w-4" />
                      Change Avatar
                    </Label>
                    {avatarFile && (
                      <Button type="button" size="sm" onClick={handleAvatarUpload} disabled={isUpdatingAvatar}>
                        {isUpdatingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload'
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 5MB</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} aria-invalid={errors.name ? 'true' : 'false'} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={currentUser?.email || ''} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={userProfile?.gender || watch('gender') || ''}
                      onValueChange={(value) => setValue('gender', value as Gender)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Gender.MALE}>Male</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                        <SelectItem value={Gender.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      {...register('age', { valueAsNumber: true })}
                      aria-invalid={errors.age ? 'true' : 'false'}
                    />
                    {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      aria-invalid={errors.phone ? 'true' : 'false'}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      {...register('website')}
                      aria-invalid={errors.website ? 'true' : 'false'}
                    />
                    {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" {...register('address')} aria-invalid={errors.address ? 'true' : 'false'} />
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register('city')} aria-invalid={errors.city ? 'true' : 'false'} />
                    {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" {...register('state')} aria-invalid={errors.state ? 'true' : 'false'} />
                    {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register('country')} aria-invalid={errors.country ? 'true' : 'false'} />
                    {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                      aria-invalid={errors.postalCode ? 'true' : 'false'}
                    />
                    {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Location (GPS)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Longitude"
                        value={watch('longitude')?.toString() || ''}
                        disabled
                        className="flex-1"
                      />
                      <Input
                        placeholder="Latitude"
                        value={watch('latitude')?.toString() || ''}
                        disabled
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLocationUpdate}
                        disabled={isUpdating}
                        className="shrink-0"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Update Location
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Click to get your current location using GPS</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  {...register('bio')}
                  aria-invalid={errors.bio ? 'true' : 'false'}
                />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
