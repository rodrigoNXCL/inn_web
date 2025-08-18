// /components/Layout.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import styles from '../styles/Layout.module.css'

type Usuario = { nombre: string | null; email?: string | null; correo?: string | null }

export default function Layout({ children }: { children: React.ReactNode }) {
  const [userRow, setUserRow] = useState<Usuario | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      // 1) Usuario autenticado
      const { data: auth } = await supabase.auth.getUser()
      const emailAuth = auth?.user?.email ?? null
      if (!emailAuth) return

      // 2) Buscar en tu tabla "usuarios"
      //    Primero por 'email'. Si no existe, intentamos por 'correo'.
      const byEmail = await supabase
        .from('usuarios')
        .select('nombre, email, correo')
        .eq('email', emailAuth)
        .single()

      if (byEmail.data) {
        setUserRow(byEmail.data)
        return
      }

      const byCorreo = await supabase
        .from('usuarios')
        .select('nombre, email, correo')
        .eq('correo', emailAuth)
        .single()

      if (byCorreo.data) {
        setUserRow(byCorreo.data)
      } else {
        // Fallback: al menos mostrar el correo del auth
        setUserRow({ nombre: emailAuth.split('@')[0], email: emailAuth })
      }
    }

    load()

    // Si cambia la sesión, recargar
    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => sub.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nombre = userRow?.nombre ?? 'Usuario'
  const correo = userRow?.email ?? userRow?.correo ?? ''
  const inicial = (nombre?.trim()?.charAt(0) || correo?.trim()?.charAt(0) || 'U').toUpperCase()

  const menu = [
    { href: '/panel', label: 'Panel' },
    { href: '/mantenedor/usuarios', label: 'Usuarios' },
    { href: '/mantenedor/maquinas', label: 'Máquinas' },
    { href: '/mantenedor/tipos', label: 'Tipos' },
    { href: '/mantenedor/areas', label: 'Áreas' },
    { href: '/mantenedor/items', label: 'Ítems' },
    { href: '/checklist', label: 'Checklist' }, // ruta correcta
  ]

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>NXChile</div>

        <div className={styles.userBox}>
          <div className={styles.avatar}>{inicial}</div>
          <div className={styles.userMeta}>
            <div className={styles.userName}>{nombre}</div>
            <div className={styles.userEmail}>{correo}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {menu.map(m => (
            <Link
              key={m.href}
              href={m.href}
              className={`${styles.navLink} ${router.pathname === m.href ? styles.active : ''}`}
            >
              {m.label}
            </Link>
          ))}
        </nav>

        <div className={styles.supportBox}>
          <div className={styles.supportLine}>Soporte: soporte@nxchile.com</div>
          <div className={styles.supportLine}>+56 9 7741 2178</div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  )
}
