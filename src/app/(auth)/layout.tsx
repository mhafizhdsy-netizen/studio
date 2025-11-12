import Link from "next/link";
import { Calculator } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <Calculator className="h-6 w-6" />
          <span className="text-xl font-bold font-headline">
            GenHPP
          </span>
        </Link>
      </div>
      {children}
    </div>
  );
}
