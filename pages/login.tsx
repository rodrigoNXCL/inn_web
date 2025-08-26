import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import styles from '../styles/login.module.css' // <-- NUEVA IMPORTACIÓN

export default function Login() {
  const router = useRouter()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: supaError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .eq('password', password)
      .eq('activo', true)
      .single()

    setLoading(false)

    if (supaError || !data) {
      setError('Usuario o contraseña incorrectos, o usuario inactivo.')
      return
    }

    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      nombre: data.nombre,
      correo: data.correo,
      rol: data.rol
    }))

    router.push('/panel')
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.formCard}>
        <div className={styles.header}>
          <img src="/logo_nxchile.png" alt="Nexo Chile" className={styles.logo} />
          <h2 className={styles.title}>
            CheckList Maquinaria INN
          </h2>
        </div>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={styles.input}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className={styles.button}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}