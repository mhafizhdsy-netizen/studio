
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl font-headline">
            Profil Saya
          </h1>
        </div>
        <div className="flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-6">
          <ProfileForm />
        </div>
      </div>
    </main>
  );
}
