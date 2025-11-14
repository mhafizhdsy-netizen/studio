'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ServerCrash } from 'lucide-react';
import { FirestorePermissionError } from '@/lib/errors';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  const isPermissionError = error instanceof FirestorePermissionError;

  return (
    <html>
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-destructive">
                <ServerCrash className="h-8 w-8" />
                <span className='text-2xl'>Oops! Terjadi Kesalahan Kritis</span>
              </CardTitle>
              <CardDescription>
                Aplikasi mengalami masalah yang tidak terduga. Detail teknis di bawah ini bisa membantu menemukan penyebabnya.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className='p-4 bg-muted rounded-lg'>
                <h3 className='font-bold text-lg'>{error.name}</h3>
                <p className='text-muted-foreground'>{error.message.split('\n')[0]}</p>
              </div>

              {isPermissionError && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className='font-semibold'>Detail Konteks Error</AccordionTrigger>
                    <AccordionContent>
                      <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-muted p-4 text-sm font-mono">
                        {JSON.stringify((error as FirestorePermissionError).request, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Lihat Stack Trace</AccordionTrigger>
                  <AccordionContent>
                    <pre className="mt-2 h-48 w-full overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-xs font-mono">
                      {error.stack}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button onClick={() => reset()} className="w-full">
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
