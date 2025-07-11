import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { User, Mail, Phone, MapPin, FileText, Camera } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  farm_location?: string;
  profile_image_url?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

const ProfileModal = ({ isOpen, onClose, onProfileUpdate }: ProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
    farm_location: "",
    profile_image_url: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
        return;
      }

      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
        bio: data.bio || "",
        farm_location: data.farm_location || "",
        profile_image_url: data.profile_image_url || ""
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .rpc('update_user_profile', {
        user_name: formData.name || null,
        user_phone: formData.phone || null,
        user_bio: formData.bio || null,
        user_farm_location: formData.farm_location || null,
        user_profile_image_url: formData.profile_image_url || null
      });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const updatedProfile = data as UserProfile;
        setProfile(updatedProfile);
        onProfileUpdate(updatedProfile);
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <User className="h-6 w-6 text-grass-600" />
            <span>Edit Profile</span>
          </DialogTitle>
          <DialogDescription>
            Update your personal information and farming details
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-grass-600"></div>
            <span className="ml-2">Loading profile...</span>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4 p-4 bg-grass-50 rounded-lg">
              <div className="w-16 h-16 bg-grass-200 rounded-full flex items-center justify-center">
                {profile.profile_image_url ? (
                  <img 
                    src={profile.profile_image_url} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-grass-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                  {profile.email_verified && (
                    <span className="text-green-600 text-xs">✓ Verified</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Member since {formatDate(profile.created_at)}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Full Name *</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="farm_location" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Farm Location</span>
                </Label>
                <Input
                  id="farm_location"
                  value={formData.farm_location}
                  onChange={(e) => handleInputChange('farm_location', e.target.value)}
                  placeholder="City, State, Country"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Bio</span>
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself and your farming experience..."
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile_image_url" className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Profile Image URL</span>
                </Label>
                <Input
                  id="profile_image_url"
                  value={formData.profile_image_url}
                  onChange={(e) => handleInputChange('profile_image_url', e.target.value)}
                  placeholder="https://example.com/your-image.jpg"
                />
              </div>
            </div>

            {/* Account Information */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{profile.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-medium ${profile.email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {profile.email_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Login:</span>
                  <span className="ml-2 font-medium">
                    {profile.last_login ? formatDate(profile.last_login) : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Profile Updated:</span>
                  <span className="ml-2 font-medium">{formatDate(profile.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim()}
                className="flex-1 bg-grass-600 hover:bg-grass-700"
              >
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Failed to load profile data</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;