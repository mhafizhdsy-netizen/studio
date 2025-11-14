
"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { CalculationHistory } from "@/components/dashboard/CalculationHistory";
import { Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyExpenseSummary } from "@/components/expenses/MonthlyExpenseSummary";
import { DashboardAnalytics, type TimeRange } from "@/components/dashboard/DashboardAnalytics";
import { OnboardingGuide } from "@/components/dashboard/OnboardingGuide";
import { useAuth } from "@/supabase/auth-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <OnboardingGuide />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
            <div className="flex flex-wrap items-center gap-4">
                <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)} className="order-2 sm:order-1">
                    <TabsList>
                        <TabsTrigger value="day">Hari Ini</TabsTrigger>
                        <TabsTrigger value="week">Minggu Ini</TabsTrigger>
                        <TabsTrigger value="month">Bulan Ini</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button asChild className="font-bold order-1 sm:order-2 w-full sm:w-auto">
                    <Link href="/calculator">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Buat Perhitungan Baru
                    </Link>
                </Button>
            </div>
        </div>
        
        <Suspense fallback={<AnalyticsSkeleton />}>
          <DashboardAnalytics timeRange={timeRange}/>
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
