"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center w-10 h-10 rounded-xl border border-border hover:bg-muted transition-colors"
      aria-label="Logout"
    >
      <LogOut className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
