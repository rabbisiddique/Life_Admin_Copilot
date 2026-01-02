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
  FileText,
  GraduationCap,
  Loader,
  Mail,
  MapPin,
  Save,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getUserPreferences,
  updateProfileAvatarUrl,
  updateUserPreferences,
  updateUserProfile,
} from "../../../actions/profile";
import { useProfileAuth } from "../../../hooks/useAuth";
import { getMemberSinceFormatted } from "../../../lib/date/date";
import { createClient } from "../../../lib/supabase/client";
import { uploadAvatar } from "../../../lib/uploadFile";

interface Preferences {
  bill_reminders: boolean;
  task_updates: boolean;
  document_expiry: boolean;
  habit_reminders: boolean;
}

export default function UserProfile() {
  const { userProfile } = useProfileAuth();
  const [profileData, setProfileData] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    location: userProfile?.location || "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({
    bill_reminders: true,
    task_updates: true,
    document_expiry: true,
    habit_reminders: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await updateUserProfile(profileData, userProfile!.id);

      if (res.success) {
        toast.success(res.message);
        setIsEditing(false);
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

  const getFilePathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\/avatars\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader?.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const oldAvatarUrl = userProfile?.avatar_url;
      const newUrl = await uploadAvatar(file, userProfile.id);

      if (!newUrl) {
        toast.error("Failed to upload avatar");
        setIsUploading(false);
        return;
      }

      const { data, error } = await supabase.auth.updateUser({
        data: { avatar_url: newUrl },
      });

      if (error) {
        toast.error(error.message);
        setIsUploading(false);
        return;
      }

      const res = await updateProfileAvatarUrl(userProfile.id, newUrl);

      if (res.success) {
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
    if (!userProfile?.id) return;

    setIsUploading(true);

    try {
      const oldAvatarUrl = userProfile?.avatar_url;

      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      if (error) {
        toast.error(error.message);
        setIsUploading(false);
        return;
      }

      await updateProfileAvatarUrl(userProfile.id, "");

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

  useEffect(() => {
    if (userProfile?.avatar_url) {
      setPreviewUrl(userProfile?.avatar_url);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        first_name: userProfile?.first_name || "",
        last_name: userProfile?.last_name || "",
        location: userProfile?.location || "",
      });
    }
  }, [userProfile]);

  useEffect(() => {
    const loadPreferences = async () => {
      const res = await getUserPreferences();
      if (res.success && res.data) {
        setPreferences({
          bill_reminders: res.data.bill_reminders,
          task_updates: res.data.task_updates,
          document_expiry: res.data.document_expiry,
          habit_reminders: res.data.habit_reminders,
        });
      }
      setIsLoading(false);
    };

    loadPreferences();
  }, []);

  const handleToggle = async (key: keyof Preferences) => {
    const newValue = !preferences[key];
    setPreferences((prev) => ({ ...prev, [key]: newValue }));

    const res = await updateUserPreferences({ [key]: newValue });

    if (!res.success) {
      setPreferences((prev) => ({ ...prev, [key]: !newValue }));
      toast.error("Failed to update preference");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Profile & Settings
            </h2>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Manage your account settings and preferences
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="self-start sm:self-auto"
          >
            {userProfile?.is_verified ? (
              <Badge
                variant="secondary"
                className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg bg-green-500/10 border-green-500/20"
              >
                <CheckCircle2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                Verified Account
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg bg-yellow-500/10 border-yellow-500/20"
              >
                <AlertCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                Unverified Account
              </Badge>
            )}
          </motion.div>
        </motion.div>

        {/* Main Content - Responsive Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr]"
        >
          {/* Profile Card - Full width on mobile, sidebar on desktop */}
          <motion.div variants={itemVariants}>
            <Card className="border-primary/20 bg-linear-to-br from-card via-card to-primary/5 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <CardContent className="relative flex flex-col items-center gap-4 sm:gap-5 lg:gap-6 p-4 sm:p-6 lg:p-8">
                {/* Avatar - Responsive sizing */}
                <motion.div
                  className="relative group"
                  whileHover={{ scale: isUploading ? 1 : 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/40 rounded-full blur-2xl group-hover:blur-3xl transition-all" />

                  <Avatar className="relative h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36 border-3 sm:border-4 border-background shadow-2xl ring-3 sm:ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarImage
                      src={
                        previewUrl ||
                        userProfile?.avatar_url ||
                        "/placeholder-userProfile.jpg"
                      }
                      className={
                        isUploading
                          ? "opacity-50"
                          : "group-hover:opacity-70 transition-opacity"
                      }
                    />
                    <AvatarFallback className="text-3xl sm:text-4xl lg:text-5xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                      {userProfile?.first_name?.[0]?.toUpperCase() ||
                        userProfile?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Hover Overlay - Responsive buttons */}
                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3">
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
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-all"
                        title="Change avatar"
                      >
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
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
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center shadow-lg transition-all"
                          title="Remove avatar"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5" />
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
                        <Loader className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
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

                {/* userProfile Info - Responsive text */}
                <div className="text-center space-y-1.5 sm:space-y-2 w-full">
                  <h3 className="text-xl sm:text-2xl font-bold">
                    {userProfile?.first_name?.toUpperCase() || "John Doe"}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Product Designer
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                    <Badge className="text-xs sm:text-sm bg-linear-to-r from-primary to-primary/80 shadow-md">
                      Premium Member
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs sm:text-sm border-primary/50"
                    >
                      Pro
                    </Badge>
                  </div>
                </div>

                <Separator className="my-1 sm:my-2" />

                {/* Contact Details - Responsive padding and text */}
                <div className="w-full space-y-1.5 sm:space-y-2">
                  <motion.div
                    whileHover={{
                      x: 6,
                      backgroundColor: "hsl(var(--accent))",
                    }}
                    className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Email
                      </p>
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {userProfile?.email}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{
                      x: 6,
                      backgroundColor: "hsl(var(--accent))",
                    }}
                    className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Location
                      </p>
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {userProfile?.location || "Not set"}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{
                      x: 6,
                      backgroundColor: "hsl(var(--accent))",
                    }}
                    className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Member Since
                      </p>
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {getMemberSinceFormatted(userProfile?.created_at) ??
                          "-"}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs Section - Responsive */}
          <motion.div
            variants={itemVariants}
            className="space-y-4 sm:space-y-5 lg:space-y-6"
          >
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 sm:p-1.5 h-auto shadow-sm">
                <TabsTrigger
                  value="general"
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm"
                >
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg py-2 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm"
                >
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-4 sm:mt-5 lg:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="p-4 sm:p-5 lg:p-6 pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                          <div>
                            <CardTitle className="text-lg sm:text-xl">
                              Personal Information
                            </CardTitle>
                            <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                              Update your personal details and public profile
                            </CardDescription>
                          </div>
                        </div>
                        {!isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="gap-1.5 sm:gap-2 self-start sm:self-auto text-xs sm:text-sm h-8 sm:h-9"
                          >
                            <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
                      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:gap-6">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label
                            htmlFor="firstName"
                            className="text-xs sm:text-sm font-semibold"
                          >
                            First Name
                          </Label>
                          <Input
                            disabled={!isEditing}
                            className="h-9 sm:h-10 text-sm transition-all focus:ring-2 focus:ring-primary disabled:opacity-60"
                            value={profileData.first_name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                first_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label
                            htmlFor="lastName"
                            className="text-xs sm:text-sm font-semibold"
                          >
                            Last Name
                          </Label>
                          <Input
                            disabled={!isEditing}
                            className="h-9 sm:h-10 text-sm transition-all focus:ring-2 focus:ring-primary disabled:opacity-60"
                            value={profileData.last_name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                last_name: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                          <Label
                            htmlFor="location"
                            className="text-xs sm:text-sm font-semibold"
                          >
                            Location
                          </Label>
                          <Input
                            disabled={!isEditing}
                            className="h-9 sm:h-10 text-sm transition-all focus:ring-2 focus:ring-primary disabled:opacity-60"
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
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="h-9 sm:h-10 text-sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="h-9 sm:h-10 text-sm shadow-lg bg-linear-to-r from-primary to-primary/90 hover:shadow-xl"
                          >
                            {isLoading ? (
                              "Saving..."
                            ) : (
                              <>
                                <Save className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />{" "}
                                Save Changes
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
              <TabsContent
                value="notifications"
                className="mt-4 sm:mt-5 lg:mt-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                        <div>
                          <CardTitle className="text-lg sm:text-xl">
                            Notification Preferences
                          </CardTitle>
                          <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                            Choose what you want to be notified about
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 lg:p-6 space-y-1">
                      <div className="space-y-1">
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-linear-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                              <Label className="text-sm sm:text-base font-semibold cursor-pointer">
                                Bill Reminders
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Receive notifications when bills are due soon
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.bill_reminders}
                            onCheckedChange={() =>
                              handleToggle("bill_reminders")
                            }
                            className="data-[state=checked]:bg-primary flex-shrink-0 ml-2"
                          />
                        </motion.div>

                        <Separator className="my-1 sm:my-2" />

                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-linear-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                              <Label className="text-sm sm:text-base font-semibold cursor-pointer">
                                Task Updates
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Get notified about task assignments and due
                                dates
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.task_updates}
                            onCheckedChange={() => handleToggle("task_updates")}
                            className="data-[state=checked]:bg-primary flex-shrink-0 ml-2"
                          />
                        </motion.div>

                        <Separator className="my-1 sm:my-2" />

                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-linear-to-br from-green-500/20 to-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                              <Label className="text-sm sm:text-base font-semibold cursor-pointer">
                                Document Expiry Alerts
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Receive alerts when documents are about to
                                expire
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.document_expiry}
                            onCheckedChange={() =>
                              handleToggle("document_expiry")
                            }
                            className="data-[state=checked]:bg-primary flex-shrink-0 ml-2"
                          />
                        </motion.div>

                        <Separator className="my-1 sm:my-2" />

                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                              <Label className="text-sm sm:text-base font-semibold cursor-pointer">
                                Habit Reminders
                              </Label>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Get reminders for your habits and routines
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.habit_reminders}
                            onCheckedChange={() =>
                              handleToggle("habit_reminders")
                            }
                            className="data-[state=checked]:bg-primary flex-shrink-0 ml-2"
                          />
                        </motion.div>
                      </div>
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
