
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Keyboard } from "lucide-react";

interface ShortcutsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShortcutsDialog({ isOpen, onOpenChange }: ShortcutsDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center font-headline">
            <Keyboard className="mr-2 h-6 w-6" /> Keyboard Shortcuts
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left whitespace-pre-line pt-2">
            {`Ctrl + I / Cmd + I : Go to Inventory Section
Ctrl + B / Cmd + B : Go to Invoice Builder Section
Ctrl + S / Cmd + S : Go to Direct Sale Section
Ctrl + R / Cmd + R : Go to Reports Section

When in Invoice Builder:
  Ctrl + P / Cmd + P : Print Current Invoice
  Ctrl + N / Cmd + N : New Invoice (Clear Current Invoice Items)`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
