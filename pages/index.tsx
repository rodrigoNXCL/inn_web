import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      {/* LOGO, pon tu logo nxchile.com en /public/logo_nxchile.png */}
      <img src="/logo_nxchile.png" alt="Nexo Chile" className={styles.logo} />
      <h1 className={styles.title}>INN Web – NXChile</h1>
      <p className={styles.subtitle}>
        Soluciones digitales para gestión, control y cumplimiento normativo.
      </p>
      <p className={styles.description}>
        Plataforma creada por <b>nxchile.com</b> para digitalizar procesos, reducir errores y asegurar trazabilidad de operaciones y controles según normativas nacionales.<br />
        Accede a la mejor tecnología, pensada en Chile y para Chile.
      </p>
      <Link href="/login">
        <button className={styles.button}>
          Ingresar al sistema
        </button>
      </Link>
    </div>
  )
}
