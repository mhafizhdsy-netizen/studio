
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { QuickCalculatorForm } from "@/components/calculator/QuickCalculatorForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidersHorizontal, Zap } from "lucide-react";

export default function NewCalculatorPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Kalkulator HPP
        </h1>
      </div>

      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="detailed">
            <SlidersHorizontal className="mr-2 h-4 w-4"/>
            Mode Rinci
          </TabsTrigger>
          <TabsTrigger value="quick">
            <Zap className="mr-2 h-4 w-4"/>
            Mode Cepat
            </TabsTrigger>
        </TabsList>
        <TabsContent value="detailed">
           <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-4">
                <CalculatorForm />
            </div>
        </TabsContent>
        <TabsContent value="quick">
            <div className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6 mt-4">
                <QuickCalculatorForm />
            </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
