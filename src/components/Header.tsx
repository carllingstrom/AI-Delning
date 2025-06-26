import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-[#0D1B2A] text-white py-4 px-6 flex items-center justify-between shadow">
      <Link href="/" className="text-2xl font-bold text-[#FECB00]">MVP Initativdelning AI</Link>
      <nav className="flex gap-6 text-sm font-semibold">
        <Link href="/about" className="hover:text-[#FECB00]">Om</Link>
        <Link href="/map" className="hover:text-[#FECB00]">Karta</Link>
        <Link href="/projects" className="hover:text-[#FECB00]">Projekt</Link>
        <Link href="/analytics" className="hover:text-[#FECB00]"> Analytics</Link>
        <Link href="/login" className="hover:text-[#FECB00]">Logga in</Link>
      </nav>
    </header>
  );
} 