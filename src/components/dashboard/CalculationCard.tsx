
"use client";

import type { Calculation } from "@/components/dashboard/CalculationHistory";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import Image from "next/image";

interface CalculationCardProps {
  calculation: Calculation;
  onDelete: (id: string) => void;
}

export function CalculationCard({ calculation, onDelete }: CalculationCardProps) {
  const router = useRouter();
  
  const handleEdit = () => {
    router.push(`/calculator/${calculation.id}`);
  };

  const handleDelete = () => {
    onDelete(calculation.id);
  };
  
  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return 'No date';
  }

  return (
    <Card className="flex flex-col h-full hover:border-primary transition-all duration-200 group overflow-hidden">
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
            {calculation.productImageUrl ? (
                <Image src={calculation.productImageUrl} alt={calculation.productName} layout="fill" className="object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 text-muted-foreground" />
                </div>
            )}
        </div>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline text-lg truncate">{calculation.productName}</CardTitle>
          <CardDescription>
            {formatDate(calculation.createdAt)}
          </CardDescription>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Hapus</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">Total HPP</p>
          <p className="text-xl font-bold">{formatCurrency(calculation.totalHPP)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saran Harga Jual</p>
          <p className="text-lg font-semibold text-primary">{formatCurrency(calculation.suggestedPrice)}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Badge variant="secondary">Margin: {calculation.margin}%</Badge>
      </CardFooter>
    </Card>
  );
}
