
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4 animate-page-fade-in">
        <div className="w-full max-w-sm">
             <div className="flex items-center justify-center gap-2 mb-6">
                <Link href="/" className="flex items-center gap-3">
                    <Logo />
                    <h1 className="text-2xl font-bold font-headline">HitunginAja</h1>
                </Link>
            </div>
            <Card className="shadow-lg border-border/20">
                <CardContent className="p-6 md:p-8">
                    {children}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
