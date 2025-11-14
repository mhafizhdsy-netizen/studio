
import { PublicCalculationList } from "@/components/community/PublicCalculationList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Inspirasi dari Komunitas</h1>
      </div>
       <p className="text-muted-foreground">Lihat perhitungan HPP dari sesama pengusaha muda! Siapa tahu bisa jadi inspirasi buat produkmu selanjutnya.</p>
      <div
        className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4"
      >
        <Suspense fallback={<CommunitySkeleton />}>
          <PublicCalculationList />
        </Suspense>
      </div>
    </main>
  );
}

function CommunitySkeleton() {
  return (
    <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-52 rounded-lg md:hidden lg:block" />
    </div>
  )
}
