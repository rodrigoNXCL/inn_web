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
      <div style={{ maxWidth: 900, margin: 'auto', padding: 24 }}>
        {/* NUEVO */}
        <form onSubmit={crear} className="admin-card">
          <h3>Nueva máquina</h3>
          <div className="form-row">
            <div className="form-col">
              <label>Nombre</label>
              <input className="checklist-input" value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} placeholder="Ej: Retroexcavadora" required />
            </div>
            <div className="form-col" style={{maxWidth:220}}>
              <button type="submit" className="checklist-btn" disabled={saving}>{saving?'Guardando...':'Agregar'}</button>
            </div>
          </div>
        </form>

        {/* FILTRO */}
        <div className="admin-card">
          <div className="form-row">
            <div className="form-col" style={{maxWidth:340}}>
              <label>Buscar</label>
              <input className="checklist-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre de máquina..." />
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div className="admin-card" style={{padding:0}}>
          <table className="nx-table">
            <thead>
              <tr>
                <th className="nx-th" style={{width:80}}>ID</th>
                <th className="nx-th">Nombre</th>
                <th className="nx-th" style={{width:240}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.length===0 && <tr><td className="nx-td" colSpan={3}>Sin resultados.</td></tr>}
              {list.map(r=>(
                <tr key={r.id}>
                  <td className="nx-td">{r.id}</td>
                  <td className="nx-td">
                    {editId===r.id
                      ? <input className="checklist-input" value={editNombre} onChange={e=>setEditNombre(e.target.value)} />
                      : r.nombre}
                  </td>
                  <td className="nx-td nx-actions">
                    {editId!==r.id ? (
                      <>
                        <button className="checklist-btn" onClick={()=>startEdit(r)}>Editar</button>
                        <button className="checklist-btn" style={{background:'#c0392b'}} onClick={()=>eliminar(r.id)}>Eliminar</button>
                      </>
                    ) : (
                      <>
                        <button className="checklist-btn" style={{background:'#0f7a2a'}} onClick={()=>guardarEdit(r.id)}>Guardar</button>
                        <button className="checklist-btn" style={{background:'#6b7280'}} onClick={cancelEdit}>Cancelar</button>
                      </>
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
