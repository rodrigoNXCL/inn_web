import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <img src="/logo_nxchile.png" alt="Nexo Chile" className={styles.logo} />
          <h1 className={styles.title}>INN Web – NXChile</h1>
          <p className={styles.subtitle}>
            Soluciones digitales para gestión, control y cumplimiento normativo.
          </p>
          <p className={styles.description}>
            Plataforma creada por <b>nxchile.com</b> para digitalizar procesos, reducir errores y asegurar trazabilidad de operaciones y controles según normativas nacionales.<br />
            Accede a la mejor tecnología, pensada en Chile y para Chile.
          </p>
          <Link href="/login" passHref>
            <button className={styles.button}>
              Ingresar al sistema
            </button>
          </Link>
        </div>
        <div className={styles.heroImage}>
          {/* Puedes colocar aquí una imagen o un SVG para complementar el texto */}
          <img src="/hero-image.svg" alt="Ilustración de la plataforma" className={styles.responsiveImage} />
        </div>
      </header>
    </div>
  )
}