
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart as RechartsPieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Calculation } from '../dashboard/CalculationHistory';
import type { Expense } from '../expenses/ExpenseList';

interface ReportChartsProps {
  calculations: Calculation[];
  expenses: Expense[];
}

export function ReportCharts({ calculations, expenses }: ReportChartsProps) {

  const costBreakdownData = useMemo(() => {
    const totalProductionCost = calculations.reduce((sum, calc) => sum + calc.totalHPP, 0);
    const totalOperationalCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalRevenue = calculations.reduce((sum, calc) => sum + calc.suggestedPrice, 0);
    const estimatedProfit = totalRevenue - (totalProductionCost + totalOperationalCost);
    
    return [
      { name: "Pendapatan", value: totalRevenue, fill: "hsl(142.1 76.2% 36.3%)" }, // Green for Revenue
      { name: "Profit", value: Math.max(0, estimatedProfit), fill: "hsl(221.2 83.2% 53.3%)" }, // Blue for Profit
      { name: "Biaya", value: totalProductionCost + totalOperationalCost, fill: "hsl(19.1 91.2% 55.3%)" }, // Orange/Red for Cost
    ];
  }, [calculations, expenses]);

  const expenseCategoryData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    
    // Define a more distinct and vibrant color palette
    const categoryColors: { [key: string]: string } = {
        "Sewa Tempat": "hsl(221.2 83.2% 53.3%)", // Bright Blue
        "Listrik & Air": "hsl(47.9 95.8% 53.1%)",  // Bright Yellow
        "Gaji Karyawan": "hsl(142.1 76.2% 36.3%)", // Bright Green
        "Biaya Pengemasan": "hsl(262.1 83.3% 57.8%)", // Bright Purple
        "Pemasaran": "hsl(346.8 77.2% 49.8%)",     // Bright Pink
        "Lainnya": "hsl(215.4 16.3% 46.9%)",       // Cool Gray
    };

    const fallbackColors = [
        "hsl(19.1 91.2% 55.3%)", // Orange
        "hsl(172.9 70.1% 40.2%)", // Teal
        "hsl(291.8 63.3% 53.1%)", // Magenta
    ];
    
    let colorIndex = 0;
    return Object.entries(categoryMap)
        .map(([name, value]) => {
          const fill = categoryColors[name] || fallbackColors[colorIndex++ % fallbackColors.length];
          return { name, value, fill };
        })
        .sort((a,b) => b.value - a.value);

  }, [expenses]);
  
  const chartConfig = {
      value: {
          label: "Jumlah",
      },
      ...expenseCategoryData.reduce((acc, cur) => ({ ...acc, [cur.name]: { label: cur.name, color: cur.fill } }), {}),
  }


  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Alokasi Biaya & Profit</CardTitle>
          <CardDescription>Perbandingan antara pendapatan, total biaya, dan profit.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="min-h-[250px] w-full">
            <BarChart
                accessibilityLayer
                data={costBreakdownData}
                layout="vertical"
                margin={{left: 10}}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <XAxis dataKey="value" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number)}
                    hideLabel
                />}
              />
              <Bar dataKey="value" radius={5}>
                {costBreakdownData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Biaya Operasional</CardTitle>
          <CardDescription>Distribusi pengeluaran berdasarkan kategori.</CardDescription>
        </CardHeader>
        <CardContent>
            {expenses.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                    <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" formatter={(value) => formatCurrency(value as number)} />} />
                    <Pie data={expenseCategoryData} dataKey="value" nameKey="name" innerRadius="50%" />
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </RechartsPieChart>
                </ChartContainer>
            ) : (
                <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
                    Tidak ada data pengeluaran.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
