import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

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

    // Consulta al usuario por correo y password (en texto plano para demo, mejorar luego)
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

    // Guarda datos del usuario en localStorage/session (puedes usar context o cookies en producción)
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      nombre: data.nombre,
      correo: data.correo,
      rol: data.rol
    }))

    // Redirige al panel
    router.push('/panel')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f4f6f8'
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          background: '#fff', padding: '2.5rem 2rem', borderRadius: '10px', boxShadow: '0 4px 24px #b5cffc40', minWidth: 320
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#005bb5', fontWeight: 700, marginBottom: 24 }}>
          CheckList Maquinaria INN by NXChile
        </h2>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 18, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 18, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red', marginBottom: 14 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            background: 'linear-gradient(90deg, #005bb5, #0070f3 80%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
