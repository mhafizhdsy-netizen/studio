
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Loader2,
  Copy,
  Check,
  Instagram,
  Clapperboard,
  Store,
} from 'lucide-react';
import { generateDescription } from '@/ai/flows/product-description-flow';
import type { ProductDescriptionOutput } from '@/ai/flows/product-description-schemas';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ProductDescriptionGeneratorProps {
  productName: string;
  onDescriptionGenerated: (description: ProductDescriptionOutput) => void;
}

export function ProductDescriptionGenerator({
  productName,
  onDescriptionGenerated,
}: ProductDescriptionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductDescriptionOutput | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!productName) {
      toast({
        title: "Nama Produk Kosong",
        description: "Harap isi nama produk terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const aiResult = await generateDescription({ productName });
      setResult(aiResult);
      onDescriptionGenerated(aiResult); // Pass the whole object up
    } catch (e: any) {
      console.error(e);
      setError('Waduh, AI-nya lagi istirahat. Coba beberapa saat lagi ya!');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({
            title: "Tersalin!",
            description: `Deskripsi untuk ${tabName} berhasil disalin.`,
        });
        setCopiedTab(tabName);
        setTimeout(() => setCopiedTab(null), 2000);
    });
  }

  return (
    <div className="space-y-4">
        <Button variant="accent" className="w-full" disabled={!productName || isLoading} onClick={handleGenerate}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bot className="h-4 w-4 mr-2" />
          )}
          Buat Deskripsi Produk dengan AI
        </Button>
      
      <div className="space-y-4 pt-4">
        {isLoading && (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )}
        
        {error && (
            <Alert variant="destructive">
                <Bot className="h-4 w-4" />
                <AlertTitle>Gagal Membuat Deskripsi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {result && (
          <div className="mt-2">
            <Tabs defaultValue="marketplace" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="marketplace"><Store className="h-4 w-4 mr-2"/>Marketplace</TabsTrigger>
                    <TabsTrigger value="instagram"><Instagram className="h-4 w-4 mr-2"/>Instagram</TabsTrigger>
                    <TabsTrigger value="tiktok"><Clapperboard className="h-4 w-4 mr-2"/>TikTok</TabsTrigger>
                </TabsList>
                <div className="relative mt-2">
                    <TabsContent value="instagram">
                        <DescriptionTabContent text={result.instagram} onCopy={() => handleCopy(result.instagram, "Instagram")} isCopied={copiedTab === "instagram"} />
                    </TabsContent>
                    <TabsContent value="tiktok">
                        <DescriptionTabContent text={result.tiktok} onCopy={() => handleCopy(result.tiktok, "TikTok")} isCopied={copiedTab === "tiktok"} />
                    </TabsContent>
                    <TabsContent value="marketplace">
                        <DescriptionTabContent text={result.marketplace} onCopy={() => handleCopy(result.marketplace, "Marketplace")} isCopied={copiedTab === "marketplace"} />
                    </TabsContent>
                </div>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}


interface DescriptionTabContentProps {
    text: string;
    onCopy: () => void;
    isCopied: boolean;
}

function DescriptionTabContent({ text, onCopy, isCopied }: DescriptionTabContentProps) {
    return (
        <div className="relative p-4 border rounded-lg bg-muted/50 min-h-[150px]">
            <p className="text-sm whitespace-pre-wrap">{text}</p>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onCopy}
                className="absolute top-2 right-2 h-7 w-7"
            >
                {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    )
}
