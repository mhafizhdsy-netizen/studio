import { CalculatorForm } from "@/components/calculator/CalculatorForm";

export default function NewCalculatorPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Kalkulator HPP</h1>
      </div>
      <div
        className="flex flex-1 rounded-lg border border-dashed shadow-sm p-4 lg:p-6"
      >
        <CalculatorForm />
      </div>
    </main>
  );
}
