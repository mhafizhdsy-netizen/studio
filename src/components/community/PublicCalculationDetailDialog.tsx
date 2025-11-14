
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Lightbulb, Package, ShoppingCart, Shield, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { CommentSection } from "./CommentSection";
import { Button } from "../ui/button";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

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
    const { toast } = useToast();

  if (!calculation) {
    return null;
  }

  const {
    id,
    productName,
    productDescription,
    productImageUrl,
    materials,
    laborCost,
    overhead,
    packaging,
    totalHPP,
    suggestedPrice,
    margin,
    userName,
    userPhotoURL,
    productQuantity,
    productionTips,
    userIsAdmin,
  } = calculation;

  const safeMaterials = materials || [];
  
  const totalMaterialCostForBatch = safeMaterials.reduce((acc, mat) => acc + (mat.isTotalCost ? (mat.cost || 0) : (mat.cost || 0) * (mat.qty || 0)), 0);
  
  const totalBatchCost = totalMaterialCostForBatch + (laborCost || 0) + (overhead || 0);
  
  const costPerProductBeforePackaging = productQuantity > 0 ? totalBatchCost / productQuantity : 0;
  
  const materialCostPerProduct = productQuantity > 0 ? totalMaterialCostForBatch / productQuantity : 0;
  const laborCostPerProduct = productQuantity > 0 ? (laborCost || 0) / productQuantity : 0;
  const overheadPerProduct = productQuantity > 0 ? (overhead || 0) / productQuantity : 0;
  const packagingPerProduct = packaging || 0;

  const pieChartData = [
    { name: "Bahan Baku", value: materialCostPerProduct, fill: "hsl(var(--chart-1))" },
    { name: "Tenaga Kerja", value: laborCostPerProduct, fill: "hsl(var(--chart-2))" },
    { name: "Overhead", value: overheadPerProduct, fill: "hsl(var(--chart-3))" },
    { name: "Kemasan", value: packagingPerProduct, fill: "hsl(var(--chart-4))" },
  ].filter((item) => item.value > 0);

  const getInitials = (name: string) => (name || "A").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  
  const handleReport = () => {
    toast({
        title: "Laporan Terkirim",
        description: "Terima kasih atas masukanmu. Tim kami akan meninjau konten ini.",
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[90vw] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-4 md:p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{productName}</DialogTitle>
                <div className="flex items-center gap-2 pt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={userPhotoURL || undefined} alt={userName} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <DialogDescription className="flex items-center gap-2">
                    Oleh {userName || "Anonim"}
                    {userIsAdmin && (
                        <Badge variant="accent" className="text-xs px-1.5 py-0">
                            <Shield className="h-3 w-3 mr-1"/>Admin
                        </Badge>
                    )}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  {productImageUrl ? (
                      <Image src={productImageUrl} alt={productName} layout="fill" className="object-cover" />
                  ) : (
                      <div className="flex items-center justify-center h-full">
                          <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                  )}
                   <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                               <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                  onClick={handleReport}
                              >
                                  <AlertTriangle className="h-4 w-4"/>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Laporkan Konten</p>
                          </TooltipContent>
                      </Tooltip>
                   </TooltipProvider>
              </div>

              {productDescription && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p>{productDescription}</p>
                  </div>
              )}
              
              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline text-xl">Ringkasan Finansial</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="h-64">
                        <CostPieChart data={pieChartData} />
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-muted-foreground">Total HPP</span>
                              <span className="font-bold text-xl">{formatCurrency(totalHPP)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                              <span className="text-primary font-bold text-lg">Saran Harga Jual</span>
                              <span className="font-extrabold text-xl text-primary">
                              {formatCurrency(suggestedPrice)}
                              </span>
                          </div>
                          <div className="flex justify-center">
                              <Badge>Margin Profit: {margin}%</Badge>
                          </div>
                      </div>
                  </CardContent>
              </Card>

              <Separator/>
              
              <div className="space-y-4">
                <h3 className="font-semibold font-headline text-xl">Rincian Bahan Baku</h3>
                  {safeMaterials.length > 0 ? (
                      <ul className="space-y-3">
                          {safeMaterials.map((material, index) => (
                              <li key={index} className="p-3 border rounded-md bg-muted/30">
                                  <div className="flex justify-between items-start gap-2">
                                      <div className="flex-1">
                                          <span className="font-semibold">{material.name}</span>
                                          <span className="text-xs text-muted-foreground ml-2">{material.qty} {material.unit}</span>
                                      </div>
                                      <span className="text-sm font-mono">{formatCurrency((material.cost || 0) * (material.qty || 1))}</span>
                                  </div>
                                  {material.description && <p className="text-xs text-muted-foreground mt-1">{material.description}</p>}
                                  {material.purchaseLink && (
                                      <Button asChild size="sm" className="mt-2">
                                          <Link href={material.purchaseLink} target="_blank" rel="noopener noreferrer">
                                              <ShoppingCart className="mr-2 h-4 w-4"/>
                                              Beli Bahan
                                          </Link>
                                      </Button>
                                  )}
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground">Tidak ada rincian bahan baku.</p>
                  )}
              </div>

              {productionTips && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                      <Lightbulb className="text-primary" />
                      Tips dari Pembuat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-muted-foreground">{productionTips}</p>
                  </CardContent>
                </Card>
              )}

              <CommentSection calculationId={id} />
            </div>
          </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
