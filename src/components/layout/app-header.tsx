
"use client";

import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Store, Package, FileText, Printer, Settings, Download, Upload, Keyboard, BarChart3, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logoutUser } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  activeSection: string;
  setActiveSection: Dispatch<SetStateAction<string>>;
  onPrint: () => void;
  onExportData: () => void;
  onImportData: (files: FileList | null) => void;
  onShowShortcuts: () => void;
}

export default function AppHeader({
  activeSection,
  setActiveSection,
  onPrint,
  onExportData,
  onImportData,
  onShowShortcuts,
}: AppHeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files; 
    onImportData(selectedFiles); 
    
    if (event.target) { 
        (event.target as HTMLInputElement).value = ''; 
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.'});
      router.push('/login');
    } catch (error) {
      toast({ title: 'Logout Failed', description: 'Could not log out. Please try again.', variant: 'destructive'});
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 no-print shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Store className="h-8 w-8" />
          <h1 className="text-2xl font-headline">InvoiceFlow</h1>
        </div>
        <nav className="flex items-center space-x-2">
          <Button
            variant={activeSection === 'inventory' ? "secondary" : "ghost"}
            onClick={() => setActiveSection('inventory')}
            className="text-primary-foreground hover:bg-primary/80"
          >
            <Package className="mr-2 h-5 w-5" /> Manage Inventory
          </Button>
          <Button
            variant={activeSection === 'invoice' ? "secondary" : "ghost"}
            onClick={() => setActiveSection('invoice')}
            className="text-primary-foreground hover:bg-primary/80"
          >
            <FileText className="mr-2 h-5 w-5" /> Create Invoice
          </Button>
          <Button
            variant={activeSection === 'reports' ? "secondary" : "ghost"}
            onClick={() => setActiveSection('reports')}
            className="text-primary-foreground hover:bg-primary/80"
          >
            <BarChart3 className="mr-2 h-5 w-5" /> Reports
          </Button>
          <Button variant="ghost" onClick={onPrint} className="text-primary-foreground hover:bg-primary/80">
            <Printer className="mr-2 h-5 w-5" /> Print Invoice
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </DropdownMenuItem>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onShowShortcuts}>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}

    