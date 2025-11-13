
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
      { name: "Pendapatan", value: totalRevenue, fill: "hsl(var(--chart-2))" },
      { name: "Profit", value: Math.max(0, estimatedProfit), fill: "hsl(var(--chart-1))" },
      { name: "Biaya", value: totalProductionCost + totalOperationalCost, fill: "hsl(var(--chart-5))" },
    ];
  }, [calculations, expenses]);

  const expenseCategoryData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    
    // Define a broader color palette to ensure uniqueness
    const categoryColors: { [key: string]: string } = {
        "Sewa Tempat": "hsl(var(--chart-1))",
        "Listrik & Air": "hsl(var(--chart-2))",
        "Gaji Karyawan": "hsl(var(--chart-3))",
        "Biaya Pengemasan": "hsl(var(--chart-4))",
        "Pemasaran": "hsl(var(--chart-5))",
        "Lainnya": "hsl(220 71% 52%)", // Adding a new distinct color
    };

    const fallbackColors = ["hsl(260 71% 52%)", "hsl(300 71% 52%)", "hsl(340 71% 52%)"];
    
    return Object.entries(categoryMap)
        .map(([name, value], index) => ({
            name,
            value,
            fill: categoryColors[name] || fallbackColors[index % fallbackColors.length]
        }))
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
