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
import { Store, Package, FileText, Printer, Settings, Download, Upload, Keyboard, Info } from 'lucide-react';
import type { AppData } from '@/types';

interface AppHeaderProps {
  activeSection: string;
  setActiveSection: Dispatch<SetStateAction<string>>;
  onPrint: () => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
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
                onChange={onImportData}
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onShowShortcuts}>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard Shortcuts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
