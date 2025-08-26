import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/Layout.module.css";
import { useRouter } from "next/router";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed: Usuario = JSON.parse(storedUser);
        setUsuario(parsed);
      } catch (e) {
        console.error("Error al parsear usuario de localStorage", e);
      }
    } else {
      router.push("/login");
    }
  }, [router]);
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };
  
  if (!usuario) {
    return <div className={styles.loadingContainer}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Barra lateral */}
      <aside className={styles.sidebar}>
        <div className={styles.userBox}>
          <div className={styles.avatar}>{usuario.nombre.charAt(0)}</div>
          <div className={styles.userInfo}>
            <strong>{usuario.nombre}</strong>
            <p className={styles.userRole}>{usuario.rol}</p>
          </div>
        </div>

        {/* Menú lateral */}
        <nav className={styles.menu}>
  <ul>
    <li><Link href="/panel" passHref><span className={styles.menuItem}>Panel</span></Link></li>
    {['superadmin', 'administrador'].includes(usuario.rol.toLowerCase()) && (
      <>
        <li><Link href="/mantenedor/usuarios" passHref><span className={styles.menuItem}>Usuarios</span></Link></li>
        <li><Link href="/mantenedor/maquinas" passHref><span className={styles.menuItem}>Máquinas</span></Link></li>
        <li><Link href="/mantenedor/tipos" passHref><span className={styles.menuItem}>Tipos</span></Link></li>
        <li><Link href="/mantenedor/items" passHref><span className={styles.menuItem}>Ítems</span></Link></li>
      </>
    )}
    <li><Link href="/checklist" passHref><span className={styles.menuItem}>Checklist</span></Link></li>
    <li><Link href="/reportes" passHref><span className={styles.menuItem}>Reportes</span></Link></li>
    <li><Link href="/reportes-historial" passHref><span className={styles.menuItem}>Historial de Reportes</span></Link></li>
  </ul>
</nav>

        {/* Sección de soporte + logout */}
        <div className={styles.supportSection}>
          <div className={styles.supportInfo}>
            <a href="mailto:soporte@nxchile.com">📧 soporte@nxchile.com</a>
            <a href="https://wa.me/56977412178" target="_blank" rel="noopener noreferrer">
              📱 WhatsApp
            </a>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🔒 Cerrar sesión
          </button>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}