import UserProfile from "@/components/profile/user-profile";

const ProfilePage = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto ">
        <div className="mx-auto max-w-7xl">
          <div className="">
            <UserProfile />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
