"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown } from "lucide-react";

interface Expense {
    amount: number;
}

export function MonthlyExpenseSummary() {
  const { user } = useUser();
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
        if (!user || !supabase) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);

        const now = new Date();
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);

        const { data, error } = await supabase
            .from('expenses')
            .select('amount')
            .eq('userId', user.uid)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());

        if (error) {
            console.error("Error fetching monthly expenses:", error);
        } else {
            const total = data?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
            setTotalExpenses(total);
        }
        
        setIsLoading(false);
    }

    if (user) {
        fetchExpenses();
    } else {
        setIsLoading(false);
    }

  }, [user]);

  if (isLoading) {
    return <Skeleton className="h-28 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Total Pengeluaran Bulan Ini
        </CardTitle>
        <TrendingDown className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
        <p className="text-xs text-muted-foreground">
          Total semua biaya operasional yang tercatat.
        </p>
      </CardContent>
    </Card>
  );
}