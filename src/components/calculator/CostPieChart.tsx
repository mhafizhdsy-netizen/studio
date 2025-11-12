"use client"

import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

interface CostPieChartProps {
    data: { name: string; value: number, fill: string }[];
}

export function CostPieChart({ data }: CostPieChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                Tidak ada data untuk ditampilkan.
            </div>
        )
    }

  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as any)

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent 
                formatter={(value) => formatCurrency(value as number)}
                hideLabel 
            />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="40%"
            strokeWidth={5}
            paddingAngle={5}
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
          </Pie>
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{paddingTop: '20px'}}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
