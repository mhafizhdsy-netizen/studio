
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CostPieChart } from "@/components/calculator/CostPieChart";
import { type PublicCalculation } from "./PublicCalculationList";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface PublicCalculationDetailDialogProps {
  calculation: PublicCalculation | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PublicCalculationDetailDialog({
  calculation,
  isOpen,
  onOpenChange,
}: PublicCalculationDetailDialogProps) {
  if (!calculation) {
    return null;
  }

  const {
    productName,
    materials,
    laborCost,
    overhead,
    packaging,
    totalHPP,
    suggestedPrice,
    margin,
    userName,
    productQuantity,
  } = calculation;

  const totalMaterialCost = (materials || []).reduce((acc, mat) => acc + mat.cost * mat.qty, 0);
  const laborCostPerProduct = productQuantity ? laborCost / productQuantity : laborCost;
  const overheadPerProduct = productQuantity ? overhead / productQuantity : overhead;

  const pieChartData = [
    { name: "Bahan Baku", value: totalMaterialCost, fill: "hsl(var(--chart-1))" },
    { name: "Tenaga Kerja", value: laborCostPerProduct, fill: "hsl(var(--chart-2))" },
    { name: "Overhead", value: overheadPerProduct, fill: "hsl(var(--chart-3))" },
    { name: "Kemasan", value: packaging, fill: "hsl(var(--chart-4))" },
  ].filter((item) => item.value > 0);

  const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{productName}</DialogTitle>
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <DialogDescription>Oleh {userName || "Anonim"}</DialogDescription>
            </div>
          </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            <div className="h-64">
              <CostPieChart data={pieChartData} />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold font-headline">Rincian Biaya per Produk</h3>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Bahan Baku</span>
                <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Tenaga Kerja</span>
                <span className="font-semibold">{formatCurrency(laborCostPerProduct)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Overhead</span>
                <span className="font-semibold">{formatCurrency(overheadPerProduct)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Kemasan</span>
                <span className="font-semibold">{formatCurrency(packaging)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Total HPP</span>
                <span className="font-bold text-xl">{formatCurrency(totalHPP)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="text-primary font-bold text-lg">Saran Harga Jual</span>
                <span className="font-extrabold text-2xl text-primary">
                  {formatCurrency(suggestedPrice)}
                </span>
              </div>
              <div className="flex justify-center">
                 <Badge>Margin Profit: {margin}%</Badge>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    