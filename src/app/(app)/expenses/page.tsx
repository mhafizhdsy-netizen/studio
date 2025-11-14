
import { ExpenseTracker } from "@/components/expenses/ExpenseTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function ExpensesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6" />
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Catatan Pengeluaran
        </h1>
      </div>
      <Card className="border-dashed">
        <CardHeader>
            <CardTitle>Lacak Biaya Operasional</CardTitle>
            <CardDescription>Catat semua pengeluaran bisnismu di sini untuk analisis keuntungan yang lebih akurat.</CardDescription>
        </CardHeader>
        <CardContent>
            <ExpenseTracker />
        </CardContent>
      </Card>
    </main>
  );
}
