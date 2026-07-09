"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="font-display text-base font-bold text-foreground tracking-tight">
            Ka Sari-Sari
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
          <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ButtonLink variant="outline" size="sm" href="/login">Sign in</ButtonLink>
          <ButtonLink size="sm" href="/register">Get started</ButtonLink>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl hover:bg-muted transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-2">
          <Link href="/#how-it-works" className="block px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-xl" onClick={() => setOpen(false)}>How it works</Link>
          <Link href="/#pricing" className="block px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-xl" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/#about" className="block px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-xl" onClick={() => setOpen(false)}>About</Link>
          <div className="pt-2 flex flex-col gap-2">
            <ButtonLink variant="outline" size="md" href="/login" className="w-full">Sign in</ButtonLink>
            <ButtonLink size="md" href="/register" className="w-full">Get started - PHP 1,000</ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
