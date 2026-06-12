import Link from "next/link";
import { UserSwitcher } from "@/components/layout/user-switcher";

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/gigs">Gigs</Link>
          <Link href="/saved">Saved</Link>
        </nav>
        <UserSwitcher />
      </div>
    </header>
  );
}
