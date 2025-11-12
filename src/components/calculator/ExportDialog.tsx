
"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Printer, Loader2 } from "lucide-react";
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    const elementToPrint = document.getElementById("print-area");
    if (!elementToPrint) return;

    setIsDownloadingPdf(true);
    
    // Temporarily remove print-only styles to capture full component
    const printStyles = document.querySelectorAll('.hide-on-print');
    printStyles.forEach(el => el.classList.remove('hide-on-print'));


    const canvas = await html2canvas(elementToPrint, {
        scale: 2, // Increase scale for better resolution
        useCORS: true,
        backgroundColor: null,
    });

    // Re-add styles after capture
    printStyles.forEach(el => el.classList.add('hide-on-print'));

    const imgData = canvas.toDataURL("image/png");
    
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const widthInPdf = pdfWidth * 0.8; // Use 80% of width
    const heightInPdf = widthInPdf / ratio;

    const x = (pdfWidth - widthInPdf) / 2;
    let y = (pdfHeight - heightInPdf) / 2;
    if (y < 20) y = 20;


    pdf.addImage(imgData, "PNG", x, y, widthInPdf, heightInPdf);
    pdf.save(`HPP_${calculationData.productName.replace(/ /g, "_")}.pdf`);

    setIsDownloadingPdf(false);
    onOpenChange(false);
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
            Pilih format ekspor yang Anda inginkan. Anda dapat mengunduhnya sebagai berkas PDF atau CSV untuk dibuka di Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
            {isDownloadingPdf ? (
                <Loader2 className="mr-2 animate-spin" />
            ) : (
                <Printer className="mr-2" />
            )}
            Unduh PDF
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
