import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/Layout.module.css";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed: Usuario = JSON.parse(storedUser);
        setUsuario(parsed);
      } catch (e) {
        console.error("Error al parsear usuario de localStorage", e);
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* Barra lateral */}
      <aside className={styles.sidebar}>
        <div className={styles.userBox}>
          {usuario ? (
            <>
              <div className={styles.avatar}>{usuario.nombre.charAt(0)}</div>
              <div>
                <strong>{usuario.nombre}</strong>
                <p>{usuario.correo}</p>
              </div>
            </>
          ) : (
            <p>Cargando usuario...</p>
          )}
        </div>

        {/* Menú lateral */}
        <nav className={styles.menu}>
          <ul>
            <li><Link href="/panel">Panel</Link></li>
            <li><Link href="/mantenedor/usuarios">Usuarios</Link></li>
            <li><Link href="/mantenedor/maquinas">Máquinas</Link></li>
            <li><Link href="/mantenedor/tipos">Tipos</Link></li>
            <li><Link href="/mantenedor/items">Ítems</Link></li>
            <li><Link href="/checklist">Checklist</Link></li>
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
          <button
            className={styles.logoutBtn}
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
          >
            🔒 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido central */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
