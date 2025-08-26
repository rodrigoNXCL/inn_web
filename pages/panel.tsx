import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabaseClient'
import styles from '../styles/panel.module.css' // Importa un nuevo CSS

type Noticia = { titulo: string; link: string; resumen?: string }

export default function Panel() {
  const [user, setUser] = useState<{ nombre: string, rol: string, correo: string } | null>(null)
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [fuente, setFuente] = useState('chilevalora')
  const [inspeccionesPendientes, setInspeccionesPendientes] = useState(0) // Nuevo estado

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      loadInspeccionesPendientes(u.id) // Llama a la nueva función
    }

    async function fetchNoticias() {
      const res = await fetch(`/api/news?fuente=${fuente}`)
      const data = await res.json()
      setNoticias(data)
    }
    fetchNoticias()
  }, [fuente])

  async function loadInspeccionesPendientes(userId: string) {
    // Aquí puedes agregar la lógica para contar las inspecciones pendientes
    // Por ahora, lo dejamos en 0. Podrías consultar una tabla de 'checklist_pendientes'
    // o hacer un conteo en tiempo real si tu base de datos lo soporta.
    // Ejemplo:
    // const { count } = await supabase.from('checklist_pendientes').select('*', { count: 'exact' }).eq('id_usuario', userId)
    // setInspeccionesPendientes(count)
  }

  if (!user) return null

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Bienvenido/a, {user.nombre}</h1>
          <div className={styles.userInfo}>
            <b>Rol:</b> {user.rol} &nbsp; | &nbsp; 
            <b>Correo:</b> {user.correo}
          </div>
        </header>

        {/* Sección de tareas pendientes */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>📋 Tareas Pendientes</h3>
          </div>
          <p className={styles.pendingText}>
            Actualmente tienes **<span className={styles.pendingCount}>{inspeccionesPendientes}</span>** inspecciones pendientes.
          </p>
          <a href="/checklist" className={styles.actionBtn}>
            Ir a mis checklists
          </a>
        </section>

        {/* Sección de noticias */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>📰 Noticias del sector</h3>
            <div className={styles.sourceButtons}>
              <button
                onClick={() => setFuente('chilevalora')}
                className={fuente === 'chilevalora' ? styles.activeBtn : ''}>
                ChileValora
              </button>
              <button
                onClick={() => setFuente('inn')}
                className={fuente === 'inn' ? styles.activeBtn : ''}>
                INN
              </button>
            </div>
          </div>
          {noticias.length === 0 && <p className={styles.noResults}>No hay noticias recientes.</p>}
          <ul className={styles.newsList}>
            {noticias.map((n, i) => (
              <li key={i} className={styles.newsItem}>
                <a href={n.link} target="_blank" rel="noopener noreferrer" className={styles.newsLink}>
                  {n.titulo}
                </a>
                {n.resumen && <div className={styles.newsSummary}>{n.resumen}</div>}
              </li>
            ))}
          </ul>
          <a href={`https://news.google.com/search?q=${fuente === 'chilevalora' ? 'chilevalora' : 'INN+normas'}&hl=es-419&gl=CL&ceid=CL:es-419`}
            target="_blank" rel="noopener noreferrer" className={styles.moreNewsLink}>
            Ver más en Google News
          </a>
        </section>
      </div>
    </Layout>
  )
}