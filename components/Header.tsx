'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/crm/contactar-hoy', label: 'Contactar hoy' },
  { href: '/crm',               label: 'Todos los leads' },
  { href: '/crm/dashboard',     label: 'Dashboard' },
  { href: '/crm/plantillas',    label: 'Plantillas' },
]

export default function Header() {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <header className="bg-petrol-700 text-white shadow-md">
      <div className="container mx-auto max-w-7xl px-4 flex items-center gap-6 h-14">
        <Link href="/crm/contactar-hoy" className="flex items-center gap-2 shrink-0">
          <Image
              src="/logo-linkamp.png"
              alt="Linkamp Precisión SRL"
              width={140}
              height={45}
              className="object-contain h-[45px] w-auto"
              priority
            />
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {NAV.map(({ href, label }) => {
            const active = href === '/crm'
              ? pathname === '/crm'
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={logout}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
