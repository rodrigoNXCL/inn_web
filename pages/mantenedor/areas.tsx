import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabaseClient'

type Area = { id: number; areas: string }

export default function MantAreas() {
  const [rol, setRol] = useState('')
  const [list, setList] = useState<Area[]>([])
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
    let query = supabase.from('checklist_areas').select('id,areas')
    if (q) query = query.ilike('areas', `%${q}%`)
    const { data } = await query.order('id')
    setList(data || [])
  }
  useEffect(() => { load() }, [q])

  // id no es autoincremental → calculamos siguiente
  async function getNextId(): Promise<number> {
    const { data } = await supabase.from('checklist_areas').select('id').order('id', { ascending: false }).limit(1)
    const max = data && data.length ? Number(data[0].id) : 0
    return max + 1
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoNombre.trim()) return
    setSaving(true)
    const nextId = await getNextId()
    const { error } = await supabase.from('checklist_areas').insert({ id: nextId, areas: nuevoNombre.trim() })
    setSaving(false)
    if (error) { alert(error.message); return }
    setNuevoNombre(''); load()
  }

  function startEdit(row: Area) { setEditId(row.id); setEditNombre(row.areas) }
  function cancelEdit() { setEditId(null); setEditNombre('') }
  async function guardarEdit(id: number) {
    if (!editNombre.trim()) return
    const { error } = await supabase.from('checklist_areas').update({ areas: editNombre.trim() }).eq('id', id)
    if (error) { alert(error.message); return }
    cancelEdit(); load()
  }
  async function eliminar(id: number) {
    if (!confirm('¿Eliminar área?')) return
    const { error } = await supabase.from('checklist_areas').delete().eq('id', id)
    if (error) { alert(error.message); return }
    load()
  }

  if (!['superadmin','administrador'].includes(rol)) {
    return <Layout><div style={{padding:24}}><h2>Acceso restringido</h2></div></Layout>
  }

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: 'auto', padding: 24 }}>
        {/* NUEVA ÁREA */}
        <form onSubmit={crear} className="admin-card">
          <h3>Nueva área</h3>
          <div className="form-row">
            <div className="form-col">
              <label>Nombre del área</label>
              <input className="checklist-input" value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} placeholder="Ej: Motor" required />
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
              <input className="checklist-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre del área..." />
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div className="admin-card" style={{padding:0}}>
          <table className="nx-table">
            <thead>
              <tr>
                <th className="nx-th" style={{width:80}}>ID</th>
                <th className="nx-th">Área</th>
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
                      : r.areas}
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
