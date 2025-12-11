"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Edit2,
  Loader,
  Lock,
  Mail,
  MapPin,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  updateProfileAvatarUrl,
  updateUserProfile,
} from "../../../actions/profile";
import { useAuth } from "../../../hooks/useAuth";
import {
  emailConfirmedAt,
  getMemberSinceFormatted,
} from "../../../lib/date/date";
import { createClient } from "../../../lib/supabase/client";
import { uploadAvatar } from "../../../lib/uploadFile";

export default function UserProfile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    first_name: user?.user_metadata?.first_name || "",
    last_name: user?.user_metadata?.last_name || "",
    location: user?.user_metadata?.location || "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  const fileInputRef = useRef(null);
  const supabase = createClient();
  console.log("user", user);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await updateUserProfile(profileData, user!.id);
      console.log("res", res);

      if (res.success) {
        toast.success(res.message);
        setIsEditing(false);

        // Optionally refresh the user session to get updated metadata
        await supabase.auth.refreshSession();
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };
  // Helper function to extract file path from URL
  const getFilePathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      // Extract path after /storage/v1/object/public/avatars/
      const match = pathname.match(/\/avatars\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Helper function to delete old avatar from storage
  const deleteOldAvatar = async (oldUrl: string) => {
    if (!oldUrl) return;

    const filePath = getFilePathFromUrl(oldUrl);
    if (!filePath) return;

    try {
      const { error } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting old avatar:", error);
      } else {
        console.log("Old avatar deleted successfully");
      }
    } catch (error) {
      console.error("Error in deleteOldAvatar:", error);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);

    // Show preview immediately
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader?.result);
    };
    reader.readAsDataURL(file);

    try {
      // Get old avatar URL before uploading new one
      const oldAvatarUrl = user?.user_metadata?.avatar_url;

      // 1. Upload new avatar to storage
      const newUrl = await uploadAvatar(file, user.id);
      if (!newUrl) {
        toast.error("Failed to upload avatar");
        setIsUploading(false);
        return;
      }

      // 2. Update user metadata using Supabase's updateUser
      const { data, error } = await supabase.auth.updateUser({
        data: {
          avatar_url: newUrl,
        },
      });

      if (error) {
        toast.error(error.message);
        setIsUploading(false);
        return;
      }

      // 3. Update the profile table if you have one
      const res = await updateProfileAvatarUrl(user.id, newUrl);

      if (res.success) {
        // 4. Delete old avatar from storage (after successful update)
        if (oldAvatarUrl) {
          await deleteOldAvatar(oldAvatarUrl);
        }

        toast.success("Avatar updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Avatar update error:", error);
      toast.error("Failed to update avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.id) return;

    setIsUploading(true);

    try {
      const oldAvatarUrl = user?.user_metadata?.avatar_url;

      // Update user metadata to remove avatar
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
        },
      });

      if (error) {
        toast.error(error.message);
        setIsUploading(false);
        return;
      }

      // Update profile table
      await updateProfileAvatarUrl(user.id, null);

      // Delete from storage
      if (oldAvatarUrl) {
        await deleteOldAvatar(oldAvatarUrl);
      }

      setPreviewUrl(null);
      setSelectedImage(null);
      toast.success("Avatar removed successfully");
    } catch (error) {
      console.error("Remove avatar error:", error);
      toast.error("Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Initialize preview from user data
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setPreviewUrl(user.user_metadata.avatar_url);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        location: user.user_metadata?.location || "",
      });
    }
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Profile & Settings
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              Manage your account settings and preferences
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            {user?.email_confirmed_at ? (
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 shadow-lg bg-green-500/10 border-green-500/20"
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Verified Account
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-sm px-4 py-2 shadow-lg bg-yellow-500/10 border-yellow-500/20"
              >
                <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                Unverified Account
              </Badge>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 lg:grid-cols-[380px_1fr]"
        >
          {/* Profile Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <CardContent className="relative flex flex-col items-center gap-6 p-8">
                {/* Avatar */}
                <motion.div
                  className="relative group"
                  whileHover={{ scale: isUploading ? 1 : 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full blur-2xl group-hover:blur-3xl transition-all" />

                  <Avatar className="relative h-36 w-36 border-4 border-background shadow-2xl ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarImage
                      src={
                        previewUrl ||
                        user?.user_metadata?.avatar_url ||
                        "/placeholder-user.jpg"
                      }
                      className={
                        isUploading
                          ? "opacity-50"
                          : "group-hover:opacity-70 transition-opacity"
                      }
                    />
                    <AvatarFallback className="text-5xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                      {user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Hover Overlay with Icons */}
                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                      <motion.button
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-all"
                        title="Change avatar"
                      >
                        <Camera className="h-5 w-5" />
                      </motion.button>

                      {previewUrl && (
                        <motion.button
                          initial={{ scale: 0 }}
                          whileHover={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: 0.05,
                          }}
                          onClick={handleRemoveImage}
                          className="h-12 w-12 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center shadow-lg transition-all"
                          title="Remove avatar"
                        >
                          <X className="h-5 w-5" />
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Loader className="h-8 w-8 text-white animate-spin" />
                        <span className="text-white text-xs font-medium">
                          Uploading...
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </motion.div>

                {/* User Info */}
                <div className="text-center space-y-2 w-full">
                  <h3 className="text-2xl font-bold">
                    {" "}
                    {user?.user_metadata?.first_name?.toUpperCase() ||
                      "John Doe"}
                  </h3>
                  <p className="text-muted-foreground">Product Designer</p>
                  <div className="flex justify-center gap-2 pt-2">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 shadow-md">
                      Premium Member
                    </Badge>
                    <Badge variant="outline" className="border-primary/50">
                      Pro
                    </Badge>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Contact Details */}
                <div className="w-full space-y-2">
                  <motion.div
                    whileHover={{
                      x: 6,
                      backgroundColor: "hsl(var(--accent))",
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Email
                      </p>
                      <p className="text-sm font-medium truncate">
                        {user?.user_metadata?.email}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{
                      x: 6,
                      backgroundColor: "hsl(var(--accent))",
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Email Confirmed At
                      </p>
                      <p className="text-sm font-medium">
                        {emailConfirmedAt(user?.email_confirmed_at) ??
                          "Not confirmed"}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{
                      x: 6,
                      backgroundColor: "hsl(var(--accent))",
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Location
                      </p>
                      <p className="text-sm font-medium">
                        {user?.user_metadata?.location}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{
                      x: 6,
                      backgroundColor: "hsl(var(--accent))",
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Member Since
                      </p>
                      <p className="text-sm font-medium">
                        {getMemberSinceFormatted(user?.created_at) ?? "-"}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full max-w-xl grid-cols-3 bg-muted/50 p-1.5 h-auto shadow-sm">
                <TabsTrigger
                  value="general"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-2.5 rounded-lg transition-all"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-2.5 rounded-lg transition-all"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-2.5 rounded-lg transition-all"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <div>
                            <CardTitle className="text-xl">
                              Personal Information
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Update your personal details and public profile
                            </CardDescription>
                          </div>
                        </div>
                        {!isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-semibold"
                          >
                            First Name
                          </Label>
                          <Input
                            disabled={!isEditing}
                            className="transition-all focus:ring-2 focus:ring-primary disabled:opacity-60"
                            value={profileData.first_name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                first_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-semibold"
                          >
                            Last Name
                          </Label>
                          <Input
                            disabled={!isEditing}
                            className="transition-all focus:ring-2 focus:ring-primary disabled:opacity-60"
                            value={profileData.last_name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                last_name: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="text-sm font-semibold"
                          >
                            Location
                          </Label>
                          <Input
                            disabled={!isEditing}
                            className="transition-all focus:ring-2 focus:ring-primary disabled:opacity-60"
                            value={profileData.location}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                location: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex justify-end gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-xl"
                          >
                            {isLoading ? (
                              "Saving..."
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <div>
                          <CardTitle className="text-xl">
                            Notification Preferences
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Choose what you want to be notified about
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Bell className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base font-semibold cursor-pointer">
                              Bill Reminders
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications when bills are due soon
                            </p>
                          </div>
                        </div>
                        <Switch
                          defaultChecked
                          className="data-[state=checked]:bg-primary"
                        />
                      </motion.div>

                      <Separator className="my-2" />

                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Bell className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base font-semibold cursor-pointer">
                              Task Updates
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified about task assignments and due dates
                            </p>
                          </div>
                        </div>
                        <Switch
                          defaultChecked
                          className="data-[state=checked]:bg-primary"
                        />
                      </motion.div>

                      <Separator className="my-2" />

                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Bell className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base font-semibold cursor-pointer">
                              Weekly Summary
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Receive a weekly digest of your productivity
                            </p>
                          </div>
                        </div>
                        <Switch className="data-[state=checked]:bg-primary" />
                      </motion.div>

                      <Separator className="my-2" />

                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Bell className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base font-semibold cursor-pointer">
                              Marketing Emails
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Receive updates about new features and offers
                            </p>
                          </div>
                        </div>
                        <Switch className="data-[state=checked]:bg-primary" />
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <div>
                          <CardTitle className="text-xl">
                            Security Settings
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Manage your password and account security
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="current"
                            className="text-sm font-semibold"
                          >
                            Current Password
                          </Label>
                          <Input
                            id="current"
                            type="password"
                            placeholder="Enter current password"
                            className="transition-all focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="new"
                            className="text-sm font-semibold"
                          >
                            New Password
                          </Label>
                          <Input
                            id="new"
                            type="password"
                            placeholder="Enter new password"
                            className="transition-all focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="confirm"
                            className="text-sm font-semibold"
                          >
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirm"
                            type="password"
                            placeholder="Confirm new password"
                            className="transition-all focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button className="shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-xl">
                          <Save className="mr-2 h-4 w-4" /> Update Password
                        </Button>
                      </div>

                      <Separator className="my-6" />

                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 hover:border-green-500/40 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Shield className="h-6 w-6 text-green-500" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base font-semibold">
                              Two-Factor Authentication
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="shadow-sm hover:bg-green-500/10 border-green-500/30"
                        >
                          Enable 2FA
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Lock className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base font-semibold">
                              Active Sessions
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Manage devices where you're logged in
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="shadow-sm hover:bg-blue-500/10 border-blue-500/30"
                        >
                          View Sessions
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
