
import { ProfitAnalysisReport } from "@/components/reports/ProfitAnalysisReport";
import { BarChart2 } from "lucide-react";


export default function ReportsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
       <div className="flex items-center gap-2">
        <BarChart2 className="h-6 w-6" />
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Laporan Analisis Keuntungan
        </h1>
      </div>
      <p className="text-muted-foreground">Lihat rangkuman performa bisnismu berdasarkan data HPP dan pengeluaran operasional yang telah kamu catat.</p>

      <div className="flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm p-4 lg:p-6">
        <ProfitAnalysisReport />
      </div>
    </main>
  );
}

    