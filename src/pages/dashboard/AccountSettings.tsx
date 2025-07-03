import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Clock, CreditCard } from 'lucide-react';

export default function AccountSettings() {
  const { user, subscriptionStatus } = useAuth();
  const { profile, userData, loading, updateProfile, updateUserData } = useUserProfile();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    first_name: userData?.first_name || '',
    last_name: userData?.last_name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    timezone: profile?.timezone || 'UTC',
  });

  React.useEffect(() => {
    if (userData && profile) {
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        timezone: profile.timezone || 'UTC',
      });
    }
  }, [userData, profile]);

  const handleSave = async () => {
    setIsUpdating(true);
    
    try {
      // Update user data (first_name, last_name)
      await updateUserData({
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      // Update profile data (phone, bio, timezone)
      await updateProfile({
        phone: formData.phone,
        bio: formData.bio,
        timezone: formData.timezone,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getSubscriptionBadgeVariant = (status: string) => {
    switch (status) {
      case 'enterprise':
        return 'default';
      case 'pro':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{userData?.email}</p>
                <p className="text-sm text-muted-foreground">Email address</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Subscription Status</p>
                <p className="text-sm text-muted-foreground">Current plan</p>
              </div>
            </div>
            <Badge variant={getSubscriptionBadgeVariant(subscriptionStatus)}>
              {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="last_name" className="text-sm font-medium">
                Last Name
              </label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timezone
            </label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
              placeholder="e.g., UTC, America/New_York"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}