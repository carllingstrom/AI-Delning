import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-[#121f2b] text-[#fffefa] py-4 px-6 flex items-center justify-between shadow">
      <Link href="/" className="text-2xl font-bold text-[#fecb00]">Koncept projektdelning AI-lösningar</Link>
      <nav className="flex gap-6 text-sm font-semibold">
        <Link href="/about" className="hover:text-[#fecb00]">Om</Link>
        <Link href="/projects" className="hover:text-[#fecb00]">Projekt</Link>
        <Link href="/map" className="hover:text-[#fecb00]">Karta</Link>
      </nav>
    </header>
  );
} 