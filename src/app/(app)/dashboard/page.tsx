
"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { CalculationHistory } from "@/components/dashboard/CalculationHistory";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyExpenseSummary } from "@/components/expenses/MonthlyExpenseSummary";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { OnboardingGuide } from "@/components/dashboard/OnboardingGuide";
import { useAuth } from "@/supabase/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <OnboardingGuide />
        
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
          <Button asChild className="font-bold">
            <Link href="/calculator">
              <PlusCircle className="h-4 w-4 mr-2" />
              Buat Perhitungan Baru
            </Link>
          </Button>
        </div>
        
        <Suspense fallback={<AnalyticsSkeleton />}>
          <DashboardAnalytics />
        </Suspense>

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
      </div>
    </main>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
        </div>
    </div>
  )
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
