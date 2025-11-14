
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth-provider";
import { supabase } from "@/lib/supabase";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Loader2, ServerCrash, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";

export interface Expense {
    id: string;
    name: string;
    amount: number;
    category: string;
    date: string; // From Supabase, it will be an ISO string
}

interface ExpenseListProps {
    refreshKey: number;
}

export function ExpenseList({ refreshKey }: ExpenseListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('userId', user.id)
            .order('date', { ascending: false });

        if (error) {
            console.error("Error fetching expenses", error);
            setError(error);
        } else {
            setExpenses(data);
        }
        setIsLoading(false);
    };
    fetchExpenses();
  }, [user, refreshKey]);


  const handleDelete = async () => {
    if (!user || !deleteId) return;

    setIsDeleting(true);
    const { error } = await supabase.from('expenses').delete().eq('id', deleteId);

    if (error) {
        toast({ title: "Gagal", description: "Gagal menghapus pengeluaran.", variant: "destructive" });
    } else {
        toast({ title: "Berhasil", description: "Data pengeluaran telah dihapus." });
        setExpenses(prev => prev.filter(exp => exp.id !== deleteId));
    }
    
    setDeleteId(null);
    setIsDeleting(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive text-center"><ServerCrash className="mx-auto h-8 w-8 mb-2" /> Gagal memuat data.</div>;
  }

  if (!expenses || expenses.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-10">
            <Inbox className="mx-auto h-12 w-12 mb-4" />
            <p className="font-semibold">Belum ada pengeluaran</p>
            <p>Mulai catat biaya operasionalmu.</p>
        </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'd MMM yyyy', { locale: id })}</TableCell>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap">{expense.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDeleteId(expense.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengeluaran ini akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
