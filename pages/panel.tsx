import { useEffect, useState } from 'react'
import Layout from '../components/Layout'

type Noticia = { titulo: string; link: string; resumen?: string }

export default function Panel() {
  const [user, setUser] = useState<{ nombre: string, rol: string, correo: string } | null>(null)
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [fuente, setFuente] = useState('chilevalora')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))

    async function fetchNoticias() {
      const res = await fetch(`/api/news?fuente=${fuente}`)
      const data = await res.json()
      setNoticias(data)
    }
    fetchNoticias()
  }, [fuente])

  if (!user) return null

  return (
    <Layout>
      <div style={{ padding: 32 }}>
        <h1>Bienvenido/a, {user.nombre}</h1>
        <div style={{ margin: '10px 0 36px 0', color: '#2260a8' }}>
          <b>Rol:</b> {user.rol} &nbsp; | &nbsp;
          <b>Correo:</b> {user.correo}
        </div>
        <section style={{
          marginTop: 36,
          background: '#f2f7ff',
          padding: 26,
          borderRadius: 8,
          boxShadow: '0 2px 8px #cadbfa55'
        }}>
          <div style={{ marginBottom: 18 }}>
            <button onClick={() => setFuente('chilevalora')} style={{
              fontWeight: 600, color: fuente === 'chilevalora' ? '#fff' : '#005bb5',
              background: fuente === 'chilevalora' ? '#005bb5' : '#fff',
              border: '1px solid #005bb5', borderRadius: 4, padding: '6px 16px', marginRight: 8
            }}>ChileValora</button>
            <button onClick={() => setFuente('inn')} style={{
              fontWeight: 600, color: fuente === 'inn' ? '#fff' : '#005bb5',
              background: fuente === 'inn' ? '#005bb5' : '#fff',
              border: '1px solid #005bb5', borderRadius: 4, padding: '6px 16px'
            }}>INN</button>
          </div>
          {noticias.length === 0 && <p>No hay noticias recientes.</p>}
          <ul style={{ margin: '16px 0', padding: 0 }}>
            {noticias.map((n, i) => (
              <li key={i} style={{ marginBottom: 16, listStyle: 'none', borderBottom: '1px solid #e3e9f2' }}>
                <a href={n.link} target="_blank" rel="noopener noreferrer"
                  style={{ fontWeight: 600, color: '#0070f3', fontSize: 18, textDecoration: 'none' }}>
                  {n.titulo}
                </a>
                {n.resumen && <div style={{ color: '#444', fontSize: 15, marginTop: 4 }}>{n.resumen}</div>}
              </li>
            ))}
          </ul>
          <a href={`https://news.google.com/search?q=${fuente === 'chilevalora' ? 'chilevalora' : 'INN+normas'}&hl=es-419&gl=CL&ceid=CL:es-419`}
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#1564ad', textDecoration: 'underline', fontWeight: 600 }}>
            Ver más en Google News
          </a>
        </section>
      </div>
    </Layout>
  )
}
