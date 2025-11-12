
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from "lucide-react";
import type { CalculationResult } from "./CalculatorForm";

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  calculationData: any; 
}

export function ExportDialog({
  isOpen,
  onOpenChange,
  calculationData,
}: ExportDialogProps) {

  const handlePrint = () => {
    onOpenChange(false);
    setTimeout(() => {
        const printContents = document.getElementById("print-area")?.innerHTML;
        const originalContents = document.body.innerHTML;
        if (printContents) {
            document.body.innerHTML = printContents;
            window.print();
            document.body.innerHTML = originalContents;
            // We need to reload to re-initialize the react app state
            window.location.reload();
        }
    }, 100);
  };

  const handleDownloadCsv = () => {
    const {
      productName,
      materials,
      laborCost,
      overhead,
      packaging,
      margin,
      totalHPP,
      suggestedPrice,
    } = calculationData;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Laporan Perhitungan HPP untuk ${productName}\n\n`;
    
    csvContent += "Komponen,Biaya\n";
    csvContent += `Biaya Tenaga Kerja,${laborCost}\n`;
    csvContent += `Biaya Overhead,${overhead}\n`;
    csvContent += `Biaya Kemasan,${packaging}\n\n`;

    csvContent += "Rincian Bahan Baku\n";
    csvContent += "Nama Bahan,Biaya Satuan,Jumlah,Total Biaya Bahan\n";
    materials.forEach((mat: any) => {
      csvContent += `${mat.name},${mat.cost},${mat.qty},${mat.cost * mat.qty}\n`;
    });
    const totalMaterialCost = materials.reduce((acc: number, mat: any) => acc + mat.cost * mat.qty, 0);
    csvContent += `Total Biaya Bahan Baku,${totalMaterialCost}\n\n`;

    csvContent += "Ringkasan Final\n";
    csvContent += `Total HPP,${totalHPP}\n`;
    csvContent += `Margin Profit (%),${margin}\n`;
    csvContent += `Saran Harga Jual,${suggestedPrice}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HPP_${productName.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ekspor Hasil Perhitungan</DialogTitle>
          <DialogDescription>
            Pilih format ekspor yang Anda inginkan. Anda dapat menyimpannya sebagai PDF atau mengunduhnya sebagai file CSV untuk dibuka di Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2" />
            Cetak ke PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadCsv}>
            <FileDown className="mr-2" />
            Unduh CSV (Excel)
          </Button>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
