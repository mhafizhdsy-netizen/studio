
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle, TrendingUp } from 'lucide-react';

export interface CampaignResult {
  name: string;
  platform: string;
  cost: number;
  sales: number;
  avgPrice: number;
  revenue: number;
  roas: number;
  roi: number;
}

interface AdsAnalysisResultProps {
  results: CampaignResult[];
}

const ROAS_COLORS = {
    good: 'text-green-500',
    ok: 'text-yellow-500',
    bad: 'text-destructive'
};

const getRoasInterpretation = (roas: number) => {
    if (roas > 1) return { text: "Kampanye ini menguntungkan.", icon: <CheckCircle className="h-4 w-4 text-green-500"/>, color: ROAS_COLORS.good };
    if (roas === 1) return { text: "Modal iklan kembali, belum untung.", icon: <AlertCircle className="h-4 w-4 text-yellow-500"/>, color: ROAS_COLORS.ok };
    return { text: "Kampanye ini belum menguntungkan.", icon: <ArrowDown className="h-4 w-4 text-destructive"/>, color: ROAS_COLORS.bad };
};

const SimpleAIInsight = ({ results }: { results: CampaignResult[] }) => {
    const bestCampaign = useMemo(() => results.reduce((prev, current) => (prev.roas > current.roas) ? prev : current), [results]);
    const worstCampaign = useMemo(() => results.reduce((prev, current) => (prev.roas < current.roas) ? prev : current), [results]);

    return (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <TrendingUp className="text-primary"/>
                    Insight Cepat
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
               <p>
                Kampanye <strong>{bestCampaign.name}</strong> di platform <strong>{bestCampaign.platform}</strong> memiliki efisiensi tertinggi dengan ROAS <strong>{bestCampaign.roas.toFixed(2)}x</strong>.
               </p>
               {results.length > 1 && bestCampaign.name !== worstCampaign.name && (
                 <p>
                    Perhatikan kampanye <strong>{worstCampaign.name}</strong>, karena memiliki ROAS terendah yaitu <strong>{worstCampaign.roas.toFixed(2)}x</strong>.
                 </p>
               )}
            </CardContent>
        </Card>
    )
}

export function AdsAnalysisResult({ results }: AdsAnalysisResultProps) {
  const chartData = results.map(r => ({
    name: r.name,
    Biaya: r.cost,
    Pendapatan: r.revenue,
  }));
  
  const roasChartData = results.map(r => ({
    name: r.name,
    ROAS: r.roas,
  })).sort((a,b) => b.ROAS - a.ROAS);

  const chartHeight = useMemo(() => Math.max(250, results.length * 60), [results.length]);

  return (
    <div className="sticky top-6 space-y-6">
        <SimpleAIInsight results={results}/>
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Biaya & Pendapatan</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <YAxis tickFormatter={(value) => formatCurrency(value as number, true)} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                />
                <Bar dataKey="Biaya" fill="hsl(var(--chart-4))" radius={4} />
                <Bar dataKey="Pendapatan" fill="hsl(var(--chart-1))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Peringkat ROAS Kampanye</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={roasChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent formatter={(value) => `${(value as number).toFixed(2)}x`} />}
                />
                <Bar dataKey="ROAS" fill="hsl(var(--chart-2))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-headline text-xl">Rincian Hasil Kampanye</h3>
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
                <CardTitle className='font-headline'>{result.name}</CardTitle>
                <CardDescription>{result.platform}</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Pendapatan</p>
                    <p className="font-bold text-lg">{formatCurrency(result.revenue)}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">ROAS</p>
                    <p className={`font-bold text-lg ${getRoasInterpretation(result.roas).color}`}>{result.roas.toFixed(2)}x</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">ROI</p>
                    <p className={`font-bold text-lg ${result.roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>{result.roi.toFixed(1)}%</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 p-3 border rounded-lg">
                    {getRoasInterpretation(result.roas).icon}
                    <span className="text-muted-foreground">{getRoasInterpretation(result.roas).text}</span>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
