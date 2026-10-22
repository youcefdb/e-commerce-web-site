'use client';

import React, { useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User as UserIcon, Heart, Mail, Save, ShoppingBag, ShieldCheck, LogOut, Calendar, Key, Upload, Link2, CheckCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';
import { useRemoveProfileImage, useUpdateProfile, useUploadProfileImage } from '@/features/users/hooks/useUser';
import { authService } from '@/features/auth/services/auth.service';
import { getApiErrorMessage } from '@/lib/api/errors';
import { ProtectedRoute } from '@/components/route-guard';
import ProductCard from '@/components/shared/ProductCard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from '@/types/api.types';

const configuredProfileImageLimit = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_FILE_SIZE_BYTES);
const profileImageMaxBytes = Number.isSafeInteger(configuredProfileImageLimit) && configuredProfileImageLimit > 0
  ? configuredProfileImageLimit
  : 5 * 1024 * 1024;
const profileImageMaxLabel = `${(profileImageMaxBytes / (1024 * 1024)).toLocaleString()} MB`;

function ProfileAccountEditor({ user }: { user: User | null }) {
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: uploadProfileImage, isPending: isUploadingImage } = useUploadProfileImage();
  const { mutate: removeProfileImage, isPending: isRemovingImage } = useRemoveProfileImage();
  const imageInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const emailChanged = email.trim().toLowerCase() !== user?.email?.toLowerCase();
    const passwordChangeRequested = Boolean(newPassword || confirmNewPassword);
    const passwordChanged = Boolean(newPassword);
    const nameChanged = name.trim() !== user?.name;

    if (passwordChangeRequested && newPassword.trim().length < 8) {
      setAccountError('New password must be at least 8 characters.');
      setAccountMessage(null);
      return;
    }
    if (passwordChangeRequested && newPassword !== confirmNewPassword) {
      setAccountError('The new passwords do not match.');
      setAccountMessage(null);
      return;
    }
    if ((emailChanged || passwordChangeRequested) && !currentPassword.trim()) {
      setAccountError('Enter your current password to change your email or password.');
      setAccountMessage(null);
      return;
    }
    if (!emailChanged && !nameChanged && !passwordChanged) return;

    setAccountMessage(null);
    setAccountError(null);
    setIsSubmittingAccount(true);
    try {
      const result = await updateProfile({
        ...(nameChanged ? { name: name.trim() } : {}),
        ...(emailChanged ? { email: email.trim() } : {}),
        ...(passwordChanged ? { password: newPassword } : {}),
        ...(emailChanged || passwordChanged ? { currentPassword } : {}),
      });
      if (emailChanged) setEmail(email.trim());
      if (emailChanged) setAccountMessage(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: unknown) {
      setAccountError(getApiErrorMessage(error, 'Could not update account details.'));
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleSendVerification = async () => {
    if (!user?.email) {
      setAccountError('Could not determine the email address for this account.');
      return;
    }
    if (!currentPassword.trim()) {
      setAccountError('Enter your current password to request a verification email.');
      return;
    }

    setIsSendingVerification(true);
    setAccountError(null);
    setAccountMessage(null);
    try {
      const result = await authService.requestEmailVerification({
        email: user.email,
        password: currentPassword,
      });
      setAccountMessage(result.message);
    } catch (error: unknown) {
      setAccountError(getApiErrorMessage(error, 'Could not send a verification email.'));
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleGoogleLink = async () => {
    setIsLinkingGoogle(true);
    setAccountError(null);
    try {
      const url = await authService.beginGoogleLink(currentPassword || undefined);
      window.location.assign(url);
    } catch (error: unknown) {
      setAccountError(getApiErrorMessage(error, 'Could not start Google account linking.'));
      setIsLinkingGoogle(false);
    }
  };

  const handleRemoveProfileImage = () => {
    if (window.confirm('Are you sure you want to remove your profile photo?')) {
      removeProfileImage();
    }
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      <Card className="border border-border">
        <CardContent className="p-6 sm:p-8">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-6">
            <UserIcon className="h-5 w-5 text-muted-foreground" /> Personal Details
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name" className="text-xs font-semibold">Full Name</Label>
              <Input
                id="prof-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-email" className="text-xs font-semibold">Email Address</Label>
              <div className="relative">
                <Input
                  id="prof-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 h-10"
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              </div>
              {user?.email_verified_at ? (
                <p className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Email verified</p>
              ) : (
                <Button type="button" variant="link" size="sm" disabled={isSendingVerification} onClick={handleSendVerification} className="h-auto p-0 text-xs">
                  {isSendingVerification ? 'Sending verification email…' : 'Verify this email address'}
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-current-password" className="text-xs font-semibold">Current password</Label>
              <Input
                id="account-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Required for password-based accounts"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Your current password is required to change your email or password, link Google, or request another verification email.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-new-password" className="text-xs font-semibold">New password</Label>
              <Input
                id="account-new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Leave blank to keep your current password"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-confirm-password" className="text-xs font-semibold">Confirm new password</Label>
              <Input
                id="account-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                className="h-10"
              />
            </div>

            {(accountMessage || accountError) && (
              <p role={accountError ? 'alert' : 'status'} className={`text-sm ${accountError ? 'text-destructive' : 'text-emerald-600'}`}>
                {accountError || accountMessage}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="prof-image" className="text-xs font-semibold">Profile Photo</Label>
              <input
                ref={imageInput}
                id="prof-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const image = event.currentTarget.files?.[0];
                  if (image) {
                    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!supportedTypes.includes(image.type)) {
                      toast.error('Choose a JPEG, PNG, or WebP image.');
                    } else if (image.size > profileImageMaxBytes) {
                      toast.error(`Choose an image no larger than ${profileImageMaxLabel}.`);
                    } else {
                      setImageUploadProgress(0);
                      uploadProfileImage({ image, onProgress: setImageUploadProgress });
                    }
                  }
                  event.currentTarget.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingImage || isRemovingImage}
                onClick={() => imageInput.current?.click()}
                className="h-10"
              >
                <Upload className="h-4 w-4" />
                {isUploadingImage
                  ? imageUploadProgress >= 100 ? 'Processing image…' : `Uploading ${imageUploadProgress}%`
                  : 'Choose an image'}
              </Button>
              {(user?.avatar || user?.avatarUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploadingImage || isRemovingImage}
                  onClick={handleRemoveProfileImage}
                  className="h-10 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isRemovingImage ? 'Removing…' : 'Remove photo'}
                </Button>
              )}
              {isUploadingImage && (
                <div
                  role="progressbar"
                  aria-label="Profile photo upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={imageUploadProgress}
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${imageUploadProgress}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP, up to {profileImageMaxLabel}.</p>
            </div>

            <Button
              type="submit"
              disabled={isUpdating || isSubmittingAccount}
              className="rounded-full font-bold h-10 px-6 mt-4 flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" /> {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLinkingGoogle}
              onClick={handleGoogleLink}
              className="rounded-full font-bold h-10 px-6 mt-4 ml-2 inline-flex items-center gap-1.5"
            >
              <Link2 className="h-4 w-4" /> {isLinkingGoogle ? 'Opening Google…' : 'Link Google account'}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items: wishlistItems, isLoading: isWishlistLoading, isError: isWishlistError } = useWishlist();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Signed out locally, but the backend session could not be ended.'));
    } finally {
      router.push('/');
    }
  };

  const defaultTab = searchParams.get('tab') || 'info';

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 sm:px-6">
        {searchParams.get('googleLinked') === 'success' && (
          <p role="status" className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            Google is now securely linked to this account.
          </p>
        )}
        {searchParams.get('googleLinkError') === 'failed' && (
          <p role="alert" className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Google could not be linked. It may already belong to another account, or the linking request expired. Sign in to the intended account and try again.
          </p>
        )}

        {/* Header summary info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b pb-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {user?.avatar || user?.avatarUrl ? (
              <img
                src={user.avatar || user.avatarUrl}
                alt={user.name}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl uppercase">
                {user?.name?.slice(0, 2)}
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{user?.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
              <div className="flex gap-2 justify-center sm:justify-start mt-3">
                {user?.role?.toUpperCase() === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                    <ShieldCheck className="h-3 w-3" /> Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
                    Customer
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/orders')}
              variant="outline"
              size="sm"
              className="rounded-full font-bold flex items-center gap-1.5"
            >
              <ShoppingBag className="h-4 w-4" /> View Orders
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="rounded-full font-bold flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>

        {/* Tab contents */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="border-b w-full justify-start rounded-none bg-transparent h-12 p-0 space-x-6">
            <TabsTrigger
              value="info"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-semibold text-sm h-full"
            >
              Account Information
            </TabsTrigger>
            <TabsTrigger
              value="wishlist"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-semibold text-sm h-full"
            >
              My Wishlist ({wishlistItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Account profile editing form tab */}
          <TabsContent value="info" className="pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <ProfileAccountEditor key={user?.id || 'profile-editor'} user={user} />

              {/* Account Metadata / Info Section */}
              <div className="space-y-6">
                <Card className="border border-border">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-6">
                      <Key className="h-5 w-5 text-muted-foreground" /> Account Information
                    </h3>

                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground font-medium">User ID</span>
                        <span className="font-mono text-xs">{user?.id}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground font-medium">Role</span>
                        <span className="font-semibold uppercase tracking-wider text-xs">
                          {user?.role}
                        </span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground font-medium">Member Since</span>
                        <span className="font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground font-medium">Account Status</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Link Card to Order History */}
                <Card className="border border-border bg-primary/5 border-primary/10">
                  <CardContent className="p-6 text-center">
                    <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-bold text-sm">Order History</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Check your order details, status updates, and tracking information.
                    </p>
                    <Button
                      onClick={() => router.push('/orders')}
                      variant="default"
                      size="sm"
                      className="rounded-full text-xs font-bold w-full"
                    >
                      Go to My Orders
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* Wishlist display tab */}
          <TabsContent value="wishlist" className="pt-8">
            {isWishlistLoading ? (
              <p role="status" className="py-16 text-center text-sm text-muted-foreground">Loading your wishlist…</p>
            ) : isWishlistError ? (
              <p role="alert" className="py-16 text-center text-sm text-destructive">Unable to load your wishlist. Please try again.</p>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl border-dashed bg-muted/15">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-base">Your wishlist is empty</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Browse products and save your favorites to view them later.
                </p>
                <Button onClick={() => router.push('/products')} size="sm" className="rounded-full text-xs">
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlistItems.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </ProtectedRoute>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
