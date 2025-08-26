import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabaseClient'

type Maquina = { id: number; nombre: string }

export default function MantMaquinas() {
  const [rol, setRol] = useState('')
  const [list, setList] = useState<Maquina[]>([])
  const [q, setQ] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) { try { setRol((JSON.parse(raw).rol||'').toLowerCase()) } catch{} }
  }, [])

  async function load() {
    let query = supabase.from('maquinas').select('id,nombre')
    if (q) query = query.ilike('nombre', `%${q}%`)
    const { data } = await query.order('nombre')
    setList(data || [])
  }
  useEffect(() => { load() }, [q])

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoNombre.trim()) return
    setSaving(true)
    const { error } = await supabase.from('maquinas').insert({ nombre: nuevoNombre.trim() })
    setSaving(false)
    if (error) { alert(error.message); return }
    setNuevoNombre(''); load()
  }

  function startEdit(row: Maquina) { setEditId(row.id); setEditNombre(row.nombre) }
  function cancelEdit() { setEditId(null); setEditNombre('') }
  async function guardarEdit(id: number) {
    if (!editNombre.trim()) return
    const { error } = await supabase.from('maquinas').update({ nombre: editNombre.trim() }).eq('id', id)
    if (error) { alert(error.message); return }
    cancelEdit(); load()
  }
  async function eliminar(id: number) {
    if (!confirm('¿Eliminar máquina?')) return
    const { error } = await supabase.from('maquinas').delete().eq('id', id)
    if (error) { alert(error.message); return }
    load()
  }

  if (!['superadmin','administrador'].includes(rol)) {
    return <Layout><div style={{padding:24}}><h2>Acceso restringido</h2></div></Layout>
  }

  return (
    <Layout>
      <div className="mant-container">
        {/* NUEVO */}
        <form onSubmit={crear} className="admin-card">
          <h3>Nueva máquina</h3>
          <div className="form-row">
            <div className="form-col">
              <label>Nombre</label>
              <input 
                className="form-input" 
                value={nuevoNombre} 
                onChange={e=>setNuevoNombre(e.target.value)} 
                placeholder="Ej: Retroexcavadora" 
                required 
              />
            </div>
            <div className="form-col" style={{maxWidth:220}}>
              <button type="submit" className="form-btn" disabled={saving}>{saving?'Guardando...':'Agregar'}</button>
            </div>
          </div>
        </form>

        {/* FILTRO */}
        <div className="admin-card">
          <div className="form-row">
            <div className="form-col" style={{maxWidth:340}}>
              <label>Buscar</label>
              <input 
                className="form-input" 
                value={q} 
                onChange={e=>setQ(e.target.value)} 
                placeholder="Nombre de máquina..." 
              />
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div className="admin-card" style={{padding:0}}>
          <table className="mant-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th style={{width:240}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.length===0 && <tr><td colSpan={3} className="no-results">Sin resultados.</td></tr>}
              {list.map(r=>(
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>
                    {editId===r.id
                      ? <input className="form-input" value={editNombre} onChange={e=>setEditNombre(e.target.value)} />
                      : r.nombre}
                  </td>
                  <td>
                    {editId!==r.id ? (
                      <div className="btn-group">
                        <button className="btn-edit" onClick={()=>startEdit(r)}>Editar</button>
                        <button className="btn-delete" onClick={()=>eliminar(r.id)}>Eliminar</button>
                      </div>
                    ) : (
                      <div className="btn-group">
                        <button className="form-btn" style={{backgroundColor:'#28a745'}} onClick={()=>guardarEdit(r.id)}>Guardar</button>
                        <button className="form-btn" style={{backgroundColor:'#6c757d'}} onClick={cancelEdit}>Cancelar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  )
}