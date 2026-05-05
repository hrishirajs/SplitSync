"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { BarLoader } from "react-spinners";
import { LayoutDashboard, Sparkles } from "lucide-react";
import { useStoreUser } from "@/hooks/use-store-user";
import { Button } from "./ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  const { isLoading } = useStoreUser();
  const pathname = usePathname();

  if (pathname === "/") return null;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/contacts", label: "Contacts" },
    { href: "/expenses/new", label: "Add expense" },
  ];

  return (
    <header className="fixed left-0 top-0 z-50 w-full px-3 pt-3 sm:px-4">
      <div className="premium-shell">
        <div className="premium-surface panel-glow flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full border border-border/70 bg-background/70 p-1.5">
              <Image
                src="/logos/logo-s.png"
                alt="SplitSync"
                fill
                className="object-contain p-1"
                sizes="44px"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-semibold tracking-tight text-foreground">
                SplitSync
              </div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Shared money, polished
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {navLinks.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="rounded-full border border-border/70 bg-background/70 text-foreground hover:bg-accent/70" />

            <Authenticated>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10",
                    userButtonPopoverCard: "shadow-2xl",
                    userPreviewMainIdentifier: "font-semibold",
                  },
                }}
                afterSignOutUrl="/"
              />
            </Authenticated>

            <Unauthenticated>
              <SignInButton mode="modal">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-primary text-primary-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Get Started
                  </span>
                </Button>
              </SignUpButton>
            </Unauthenticated>
          </div>
        </div>
      </div>
      {isLoading && <BarLoader width={"100%"} color="#7ccfaa" />}
    </header>
  );
}
