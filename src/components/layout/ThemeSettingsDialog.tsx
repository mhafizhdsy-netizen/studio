
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Palette } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { themes, type ThemeName } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface ThemeSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ThemeSettingsDialog({
  isOpen,
  onOpenChange,
}: ThemeSettingsDialogProps) {
  const { theme: activeTheme, setTheme } = useTheme();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Palette />
            Pilih Tema
          </DialogTitle>
          <DialogDescription>
            Pilih palet warna yang paling nyaman untuk matamu. Tema akan
            tersimpan otomatis di akunmu.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {themes.map((theme) => {
            const isActive = activeTheme === theme.name;
            return (
              <div
                key={theme.name}
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => setTheme(theme.name as ThemeName)}
              >
                <div
                  className={cn(
                    "h-16 w-full rounded-lg flex items-center justify-center border-2",
                    isActive
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  style={{
                    backgroundColor: `hsl(${theme.cssVars['--theme-background']})`,
                  }}
                >
                  <div className="flex -space-x-2">
                     <div className="h-8 w-8 rounded-full border-2 border-card" style={{backgroundColor: `hsl(${theme.cssVars['--theme-primary']})`}} />
                     <div className="h-8 w-8 rounded-full border-2 border-card" style={{backgroundColor: `hsl(${theme.cssVars['--theme-accent']})`}} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {isActive && <Check className="h-4 w-4 text-primary" />}
                    <p className={cn("text-sm", isActive ? "font-semibold text-primary" : "text-muted-foreground")}>
                        {theme.displayName}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
