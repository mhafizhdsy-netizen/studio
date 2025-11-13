
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from 'firebase/firestore';
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
  const firestore = useFirestore();

  const expensesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
  }, [user, firestore]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

  if (isLoading) {
    return <Skeleton className="h-28 w-full" />;
  }

  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

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

    