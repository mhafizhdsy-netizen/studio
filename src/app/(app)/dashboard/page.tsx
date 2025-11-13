
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { CalculationHistory } from "@/components/dashboard/CalculationHistory";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyExpenseSummary } from "@/components/expenses/MonthlyExpenseSummary";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
        <Button asChild className="font-bold">
          <Link href="/calculator">
            <PlusCircle className="h-4 w-4 mr-2" />
            Buat Perhitungan Baru
          </Link>
        </Button>
      </div>

       <Suspense fallback={<Skeleton className="h-24 rounded-lg" />}>
        <MonthlyExpenseSummary />
      </Suspense>

      <div
        className="flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm p-4"
      >
        <Suspense fallback={<DashboardSkeleton />}>
          <CalculationHistory />
        </Suspense>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-8 w-1/4" />
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  )
}

    