
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from "@/supabase/auth-provider";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, ServerCrash, DollarSign, TrendingDown, LineChart, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Calculation } from '../dashboard/CalculationHistory';
import type { Expense } from '../expenses/ExpenseList';
import { ReportCharts } from './ReportCharts';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// Function to get an array of the last 6 months (YYYY-MM)
const getLastSixMonths = () => {
    const months = [];
    let date = new Date();
    for (let i = 0; i < 6; i++) {
        months.push(format(date, 'yyyy-MM'));
        date.setMonth(date.getMonth() - 1);
    }
    return months;
};

export function ProfitAnalysisReport() {
    const { user } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const monthOptions = useMemo(() => getLastSixMonths(), []);

    const [calculations, setCalculations] = useState<Calculation[] | null>(null);
    const [expenses, setExpenses] = useState<Expense[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const dateRange = useMemo(() => {
        if (!selectedMonth) return null;
        const [year, monthIndex] = selectedMonth.split('-').map(Number);
        const startDate = startOfMonth(new Date(year, monthIndex - 1));
        const endDate = endOfMonth(new Date(year, monthIndex - 1));
        return { startDate, endDate };
    }, [selectedMonth]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !dateRange) return;

            setIsLoading(true);
            setError(null);

            const [calcResponse, expResponse] = await Promise.all([
                supabase
                    .from('calculations')
                    .select('*')
                    .eq('userId', user.id)
                    .gte('createdAt', dateRange.startDate.toISOString())
                    .lte('createdAt', dateRange.endDate.toISOString()),
                supabase
                    .from('expenses')
                    .select('*')
                    .eq('userId', user.id)
                    .gte('date', dateRange.startDate.toISOString())
                    .lte('date', dateRange.endDate.toISOString())
            ]);

            if (calcResponse.error || expResponse.error) {
                console.error("Error fetching report data", { calcError: calcResponse.error, expError: expResponse.error });
                setError(calcResponse.error || expResponse.error);
            } else {
                setCalculations(calcResponse.data || []);
                setExpenses(expResponse.data || []);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [user, dateRange]);


    const handleMonthChange = (value: string) => {
        setSelectedMonth(value);
    };

    const stats = useMemo(() => {
        if (!calculations || !expenses) return null;
        
        const totalOperationalCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalProductionCost = calculations.reduce((sum, calc) => sum + (calc.totalHPP * (calc.productQuantity || 1)), 0);
        const totalRevenue = calculations.reduce((sum, calc) => sum + (calc.suggestedPrice * (calc.productQuantity || 1)), 0);
        const estimatedProfit = totalRevenue - (totalProductionCost + totalOperationalCost);
        const averageMargin = calculations.length > 0
            ? calculations.reduce((sum, calc) => sum + calc.margin, 0) / calculations.length
            : 0;

        return {
            totalOperationalCost,
            totalProductionCost,
            totalRevenue,
            estimatedProfit,
            averageMargin,
        }

    }, [calculations, expenses]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
    }

    if (error) {
        return (
            <div className="text-center text-destructive">
                <ServerCrash className="mx-auto h-12 w-12 mb-4" />
                <p className="font-semibold text-lg">Gagal Memuat Laporan</p>
                <p>Terjadi kesalahan saat mengambil data.</p>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-center text-muted-foreground">Pilih bulan untuk melihat laporan.</div>
    }

    return (
        <div className="w-full space-y-6">
            <div className='flex justify-between items-center'>
                 <h2 className="text-xl font-bold font-headline">Laporan Bulan Ini</h2>
                <Select onValueChange={handleMonthChange} defaultValue={selectedMonth}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {monthOptions.map(month => (
                            <SelectItem key={month} value={month}>
                                {format(new Date(month + '-02'), 'MMMM yyyy', { locale: id })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!calculations || !expenses || (calculations.length === 0 && expenses.length === 0) ? (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Data Kosong</AlertTitle>
                    <AlertDescription>
                        Tidak ada data perhitungan HPP atau pengeluaran yang tercatat untuk bulan ini.
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Pendapatan" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} description="Estimasi pendapatan kotor." />
                        <StatCard title="Total Biaya Produksi" value={formatCurrency(stats.totalProductionCost)} icon={TrendingDown} description="Total HPP dari semua produk." />
                        <StatCard title="Biaya Operasional" value={formatCurrency(stats.totalOperationalCost)} icon={TrendingDown} description="Total pengeluaran non-produksi." />
                        <StatCard title="Estimasi Profit" value={formatCurrency(stats.estimatedProfit)} icon={LineChart} description="Pendapatan dikurangi semua biaya." isProfit={true}/>
                    </div>

                    <ReportCharts calculations={calculations} expenses={expenses} />
                </>
            )}

        </div>
    );
}

function StatCard({ title, value, icon: Icon, description, isProfit = false }: { title: string, value: string, icon: React.ElementType, description: string, isProfit?: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${isProfit ? (value.startsWith('-') ? 'text-destructive' : 'text-green-500') : ''}`}>{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

    
