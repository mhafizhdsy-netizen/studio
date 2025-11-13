
"use client";

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ArrowUp, ArrowDown, DollarSign, LineChart, Hash, Percent, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Calculation } from "./CalculationHistory";

interface AnalyticsData {
    totalProducts: number;
    averageMargin: number;
    totalRevenue: number;
    totalProductionCost: number;
    estimatedProfit: number;
}

const calculateStats = (calculations: Calculation[] | null): AnalyticsData => {
    if (!calculations || calculations.length === 0) {
        return { totalProducts: 0, averageMargin: 0, totalRevenue: 0, totalProductionCost: 0, estimatedProfit: 0 };
    }

    const totalProducts = calculations.length;
    const totalMargin = calculations.reduce((sum, calc) => sum + (calc.margin || 0), 0);
    const averageMargin = totalProducts > 0 ? totalMargin / totalProducts : 0;
    const totalRevenue = calculations.reduce((sum, calc) => sum + (calc.suggestedPrice || 0), 0);
    const totalProductionCost = calculations.reduce((sum, calc) => sum + (calc.totalHPP || 0), 0);
    const estimatedProfit = totalRevenue - totalProductionCost;

    return { totalProducts, averageMargin, totalRevenue, totalProductionCost, estimatedProfit };
}

type TimeRange = 'month' | 'week' | 'day';

export function DashboardAnalytics() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    const { currentRange, previousRange } = useMemo(() => {
        const now = new Date();
        switch (timeRange) {
            case 'day':
                return {
                    currentRange: { start: startOfDay(now), end: endOfDay(now) },
                    previousRange: { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) }
                };
            case 'week':
                return {
                    currentRange: { start: startOfWeek(now), end: endOfWeek(now) },
                    previousRange: { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) }
                };
            case 'month':
            default:
                return {
                    currentRange: { start: startOfMonth(now), end: endOfMonth(now) },
                    previousRange: { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }
                };
        }
    }, [timeRange]);

    const currentQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'calculations'),
            where('createdAt', '>=', Timestamp.fromDate(currentRange.start)),
            where('createdAt', '<=', Timestamp.fromDate(currentRange.end))
        );
    }, [user, firestore, currentRange]);

    const previousQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'calculations'),
            where('createdAt', '>=', Timestamp.fromDate(previousRange.start)),
            where('createdAt', '<=', Timestamp.fromDate(previousRange.end))
        );
    }, [user, firestore, previousRange]);

    const { data: currentCalculations, isLoading: isLoadingCurrent } = useCollection<Calculation>(currentQuery);
    const { data: prevCalculations, isLoading: isLoadingPrev } = useCollection<Calculation>(previousQuery);

    const currentStats = useMemo(() => calculateStats(currentCalculations), [currentCalculations]);
    const prevStats = useMemo(() => calculateStats(prevCalculations), [prevCalculations]);
    
    const changePeriodText = useMemo(() => {
        switch (timeRange) {
            case 'day': return 'dari kemarin';
            case 'week': return 'dari minggu lalu';
            case 'month': return 'dari bulan lalu';
        }
    }, [timeRange]);

    const isLoading = isLoadingCurrent || isLoadingPrev;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                    <TabsList>
                        <TabsTrigger value="day">Hari Ini</TabsTrigger>
                        <TabsTrigger value="week">Minggu Ini</TabsTrigger>
                        <TabsTrigger value="month">Bulan Ini</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            {isLoading ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        title="Estimasi Profit"
                        value={formatCurrency(currentStats.estimatedProfit)}
                        icon={DollarSign}
                        change={currentStats.estimatedProfit - prevStats.estimatedProfit}
                        changeType="value"
                        periodText={changePeriodText}
                    />
                    <StatCard 
                        title="Total Pendapatan"
                        value={formatCurrency(currentStats.totalRevenue)}
                        icon={LineChart}
                        change={currentStats.totalRevenue - prevStats.totalRevenue}
                        changeType="value"
                        periodText={changePeriodText}
                    />
                    <StatCard 
                        title="Margin Rata-rata"
                        value={`${currentStats.averageMargin.toFixed(1)}%`}
                        icon={Percent}
                        change={currentStats.averageMargin - prevStats.averageMargin}
                        changeType="percentage"
                        periodText={changePeriodText}
                    />
                    <StatCard 
                        title="Produk Dihitung"
                        value={currentStats.totalProducts.toString()}
                        icon={Hash}
                        change={currentStats.totalProducts - prevStats.totalProducts}
                        changeType="number"
                        periodText={changePeriodText}
                    />
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    change: number;
    changeType: 'percentage' | 'value' | 'number';
    periodText: string;
}

function StatCard({ title, value, icon: Icon, change, changeType, periodText }: StatCardProps) {
    const isPositive = change >= 0;
    const isNeutral = change === 0 || !isFinite(change);

    const formatChange = () => {
        const absChange = Math.abs(change);
        if (!isFinite(absChange)) return 'N/A';
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
        if (isNeutral) {
            return `Tidak ada data ${periodText}`;
        }
        const formattedChange = formatChange();
        return `${isPositive ? `+${formattedChange}` : `-${formattedChange}`} ${periodText}`;
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
                    {!isNeutral ? (
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
