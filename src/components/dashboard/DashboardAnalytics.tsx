
"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/supabase/auth-provider";
import { supabase } from "@/lib/supabase";
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
    const totalMargin = calculations.reduce((sum, calc) => sum + (Number(calc.margin) || 0), 0);
    const averageMargin = totalProducts > 0 ? totalMargin / totalProducts : 0;
    const totalRevenue = calculations.reduce((sum, calc) => sum + (Number(calc.suggestedPrice) || 0), 0);
    const totalProductionCost = calculations.reduce((sum, calc) => sum + (Number(calc.totalHPP) || 0), 0);
    const estimatedProfit = totalRevenue - totalProductionCost;

    return { totalProducts, averageMargin, totalRevenue, totalProductionCost, estimatedProfit };
}

export type TimeRange = 'month' | 'week' | 'day';

interface DashboardAnalyticsProps {
    timeRange: TimeRange;
}

export function DashboardAnalytics({ timeRange }: DashboardAnalyticsProps) {
    const { user } = useAuth();
    
    const [currentCalculations, setCurrentCalculations] = useState<Calculation[] | null>(null);
    const [prevCalculations, setPrevCalculations] = useState<Calculation[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            setIsLoading(true);

            // Fetch current period data
            const { data: currentData } = await supabase
                .from('calculations')
                .select('*')
                .eq('userId', user.id)
                .gte('createdAt', currentRange.start.toISOString())
                .lte('createdAt', currentRange.end.toISOString());
            
            setCurrentCalculations(currentData || []);

            // Fetch previous period data
            const { data: prevData } = await supabase
                .from('calculations')
                .select('*')
                .eq('userId', user.id)
                .gte('createdAt', previousRange.start.toISOString())
                .lte('createdAt', previousRange.end.toISOString());
            
            setPrevCalculations(prevData || []);
            
            setIsLoading(false);
        };
        
        fetchData();

    }, [user, currentRange, previousRange]);

    const currentStats = useMemo(() => calculateStats(currentCalculations), [currentCalculations]);
    const prevStats = useMemo(() => calculateStats(prevCalculations), [prevCalculations]);
    
    const periodText = useMemo(() => {
        switch (timeRange) {
            case 'day': return 'hari ini';
            case 'week': return 'minggu ini';
            case 'month': return 'bulan ini';
        }
    }, [timeRange]);

    const comparisonText = useMemo(() => {
        switch (timeRange) {
            case 'day': return 'dibanding kemarin';
            case 'week': return 'dibanding minggu lalu';
            case 'month': return 'dibanding bulan lalu';
        }
    }, [timeRange]);

    return (
        <div>
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
                        hasComparison={prevCalculations !== null && prevCalculations.length > 0}
                        changeType="value"
                        periodText={periodText}
                        comparisonText={comparisonText}
                    />
                    <StatCard 
                        title="Total Pendapatan"
                        value={formatCurrency(currentStats.totalRevenue)}
                        icon={LineChart}
                        change={currentStats.totalRevenue - prevStats.totalRevenue}
                        hasComparison={prevCalculations !== null && prevCalculations.length > 0}
                        changeType="value"
                        periodText={periodText}
                        comparisonText={comparisonText}
                    />
                    <StatCard 
                        title="Margin Rata-rata"
                        value={`${currentStats.averageMargin.toFixed(1)}%`}
                        icon={Percent}
                        change={currentStats.averageMargin - prevStats.averageMargin}
                        hasComparison={prevCalculations !== null && prevCalculations.length > 0}
                        changeType="percentage"
                        periodText={periodText}
                        comparisonText={comparisonText}
                    />
                    <StatCard 
                        title="Produk Dihitung"
                        value={currentStats.totalProducts.toString()}
                        icon={Hash}
                        change={currentStats.totalProducts - prevStats.totalProducts}
                        hasComparison={prevCalculations !== null && prevCalculations.length > 0}
                        changeType="number"
                        periodText={periodText}
                        comparisonText={comparisonText}
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
    comparisonText: string;
    hasComparison: boolean;
}

function StatCard({ title, value, icon: Icon, change, changeType, periodText, comparisonText, hasComparison }: StatCardProps) {
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
        if (!hasComparison) {
            return `Total untuk ${periodText}`;
        }
        if (isNeutral) {
            return `Tidak berubah ${comparisonText}`;
        }
        const formattedChange = formatChange();
        return `${isPositive ? `+${formattedChange}` : `-${formattedChange}`} ${comparisonText}`;
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
                    {hasComparison && !isNeutral ? (
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
