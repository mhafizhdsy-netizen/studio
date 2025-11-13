
"use client";

import { useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ArrowUp, ArrowDown, DollarSign, LineChart, Hash, Percent, AlertCircle } from "lucide-react";
import type { Calculation } from "./CalculationHistory";

interface AnalyticsData {
    totalProducts: number;
    averageMargin: number;
    totalRevenue: number;
    totalProductionCost: number;
    estimatedProfit: number;
}

const calculateStats = (calculations: Calculation[]): AnalyticsData => {
    if (!calculations || calculations.length === 0) {
        return { totalProducts: 0, averageMargin: 0, totalRevenue: 0, totalProductionCost: 0, estimatedProfit: 0 };
    }

    const totalProducts = calculations.length;
    const totalMargin = calculations.reduce((sum, calc) => sum + calc.margin, 0);
    const averageMargin = totalMargin / totalProducts;
    const totalRevenue = calculations.reduce((sum, calc) => sum + calc.suggestedPrice, 0);
    const totalProductionCost = calculations.reduce((sum, calc) => sum + calc.totalHPP, 0);
    const estimatedProfit = totalRevenue - totalProductionCost;

    return { totalProducts, averageMargin, totalRevenue, totalProductionCost, estimatedProfit };
}

export function DashboardAnalytics() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Date ranges for current and previous month
    const { currentMonthRange, prevMonthRange } = useMemo(() => {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const prevMonthStart = startOfMonth(subMonths(now, 1));
        const prevMonthEnd = endOfMonth(subMonths(now, 1));
        return {
            currentMonthRange: { start: currentMonthStart, end: currentMonthEnd },
            prevMonthRange: { start: prevMonthStart, end: prevMonthEnd }
        };
    }, []);

    // Query for current month's calculations
    const currentMonthQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'calculations'),
            where('createdAt', '>=', currentMonthRange.start),
            where('createdAt', '<=', currentMonthRange.end)
        );
    }, [user, firestore, currentMonthRange]);

    // Query for previous month's calculations
    const prevMonthQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'calculations'),
            where('createdAt', '>=', prevMonthRange.start),
            where('createdAt', '<=', prevMonthRange.end)
        );
    }, [user, firestore, prevMonthRange]);

    const { data: currentCalculations, isLoading: isLoadingCurrent } = useCollection<Calculation>(currentMonthQuery);
    const { data: prevCalculations, isLoading: isLoadingPrev } = useCollection<Calculation>(prevMonthQuery);

    const currentStats = useMemo(() => calculateStats(currentCalculations || []), [currentCalculations]);
    const prevStats = useMemo(() => calculateStats(prevCalculations || []), [prevCalculations]);
    
    if (isLoadingCurrent || isLoadingPrev) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
        );
    }
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Estimasi Profit"
                value={formatCurrency(currentStats.estimatedProfit)}
                icon={DollarSign}
                change={currentStats.estimatedProfit - prevStats.estimatedProfit}
                changeType="value"
            />
             <StatCard 
                title="Total Pendapatan"
                value={formatCurrency(currentStats.totalRevenue)}
                icon={LineChart}
                change={currentStats.totalRevenue - prevStats.totalRevenue}
                changeType="value"
            />
            <StatCard 
                title="Margin Rata-rata"
                value={`${currentStats.averageMargin.toFixed(1)}%`}
                icon={Percent}
                change={currentStats.averageMargin - prevStats.averageMargin}
                changeType="percentage"
            />
             <StatCard 
                title="Produk Dihitung"
                value={currentStats.totalProducts.toString()}
                icon={Hash}
                change={currentStats.totalProducts - prevStats.totalProducts}
                changeType="number"
            />
        </div>
    );
}


interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    change: number;
    changeType: 'percentage' | 'value' | 'number';
}

function StatCard({ title, value, icon: Icon, change, changeType }: StatCardProps) {
    const isPositive = change >= 0;

    const formatChange = () => {
        const absChange = Math.abs(change);
        switch (changeType) {
            case 'value':
                return formatCurrency(absChange);
            case 'percentage':
                return `${absChange.toFixed(1)}%`;
            case 'number':
                return absChange.toFixed(0);
        }
    };
    
    const changeText = () => {
        if (change === 0) {
            return "Tidak ada perubahan dari bulan lalu";
        }
        const formattedChange = formatChange();
        return `${isPositive ? `+${formattedChange}` : `-${formattedChange}`} dari bulan lalu`;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground flex items-center">
                    {change !== 0 ? (
                        isPositive ? <ArrowUp className="h-4 w-4 text-green-500"/> : <ArrowDown className="h-4 w-4 text-destructive"/>
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="ml-1">{changeText()}</span>
                </div>
            </CardContent>
        </Card>
    );
}

