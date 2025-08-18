import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabaseClient'

type Tipo = { id: number; nombre: string }
type Maquina = { id: number; nombre: string }

export default function MantTipos() {
  const [rol, setRol] = useState('')
  const [list, setList] = useState<Tipo[]>([])
  const [q, setQ] = useState('')
  const [nuevo, setNuevo] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')

  // asignaciones
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [mSel, setMSel] = useState('')
  const [tiposAsig, setTiposAsig] = useState<number[]>([])
  const [tSel, setTSel] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) { try { setRol((JSON.parse(raw).rol||'').toLowerCase()) } catch{} }
  }, [])

  async function loadTipos() {
    let qy = supabase.from('checklist_tipos').select('id,nombre')
    if (q) qy = qy.ilike('nombre', `%${q}%`)
    const { data } = await qy.order('nombre')
    setList(data || [])
  }
  async function loadMaquinas() {
    const { data } = await supabase.from('maquinas').select('id,nombre').order('nombre')
    setMaquinas(data || [])
  }
  useEffect(() => { loadTipos() }, [q])
  useEffect(() => { loadMaquinas() }, [])

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevo.trim()) return
    setSaving(true)
    const { error } = await supabase.from('checklist_tipos').insert({ nombre: nuevo.trim() })
    setSaving(false)
    if (error) return alert(error.message)
    setNuevo(''); loadTipos()
  }

  function startEdit(r: Tipo) { setEditId(r.id); setEditNombre(r.nombre) }
  function cancelEdit() { setEditId(null); setEditNombre('') }
  async function guardarEdit(id: number) {
    if (!editNombre.trim()) return
    const { error } = await supabase.from('checklist_tipos').update({ nombre: editNombre.trim() }).eq('id', id)
    if (error) return alert(error.message)
    cancelEdit(); loadTipos()
  }
  async function eliminar(id: number) {
    if (!confirm('¿Eliminar tipo?')) return
    const { error } = await supabase.from('checklist_tipos').delete().eq('id', id)
    if (error) return alert(error.message)
    loadTipos()
  }

  // asignaciones tipos ↔ máquinas
  async function loadAsignaciones(mid: number) {
    const { data } = await supabase.from('checklist_tipos_maquina').select('id_tipo').eq('id_maquina', mid)
    setTiposAsig((data || []).map((r:any)=>r.id_tipo))
  }
  useEffect(() => { if (mSel) loadAsignaciones(Number(mSel)); else setTiposAsig([]) }, [mSel])

  async function asignarTipo() {
    if (!mSel || !tSel) return
    const { error } = await supabase.from('checklist_tipos_maquina').insert({ id_maquina: Number(mSel), id_tipo: Number(tSel) })
    if (error) return alert(error.message)
    setTSel(''); loadAsignaciones(Number(mSel))
  }
  async function quitarTipo(idTipo: number) {
    if (!mSel) return
    const { error } = await supabase.from('checklist_tipos_maquina')
      .delete()
      .eq('id_maquina', Number(mSel))
      .eq('id_tipo', idTipo)
    if (error) return alert(error.message)
    loadAsignaciones(Number(mSel))
  }

  if (!['superadmin','administrador'].includes(rol)) {
    return <Layout><div style={{padding:24}}><h2>Acceso restringido</h2></div></Layout>
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1000, margin: 'auto', padding: 24 }}>
        {/* NUEVO */}
        <form onSubmit={crear} className="admin-card">
          <h3>Nuevo tipo</h3>
          <div className="form-row">
            <div className="form-col">
              <label>Nombre</label>
              <input className="checklist-input" value={nuevo} onChange={e=>setNuevo(e.target.value)} placeholder="Ej: Preoperacional / Motor" required />
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
              <input className="checklist-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre del tipo..." />
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div className="admin-card" style={{padding:0}}>
          <table className="nx-table">
            <thead>
              <tr>
                <th className="nx-th" style={{width:80}}>ID</th>
                <th className="nx-th">Tipo</th>
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

        {/* ASIGNACIÓN TIPOS ↔ MÁQUINAS */}
        <div className="admin-card">
          <h3>Asignar tipos a máquina</h3>
          <div className="form-row">
            <div className="form-col">
              <label>Máquina</label>
              <select className="checklist-select" value={mSel} onChange={e=>setMSel(e.target.value)}>
                <option value="">Seleccione...</option>
                {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="form-col">
              <label>Agregar tipo</label>
              <div className="input-with-btn">
                <select className="checklist-select" value={tSel} onChange={e=>setTSel(e.target.value)} disabled={!mSel}>
                  <option value="">Seleccione...</option>
                  {list
                    .filter(t => !tiposAsig.includes(t.id))
                    .map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <button type="button" className="btn-ghost" onClick={asignarTipo} disabled={!mSel || !tSel}>Asignar</button>
              </div>
            </div>
          </div>

          {mSel && (
            <div style={{marginTop:14}}>
              <div style={{marginBottom:8, fontWeight:700}}>Tipos asignados</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                {tiposAsig.length===0 && <span style={{color:'#6b7280'}}>Ninguno</span>}
                {tiposAsig.map(id => {
                  const t = list.find(x=>x.id===id)
                  return (
                    <span key={id} style={{background:'#eef2ff', border:'1px solid #c7d2fe', color:'#1e3a8a', padding:'6px 10px', borderRadius:999}}>
                      {t?.nombre || id}
                      <button onClick={()=>quitarTipo(id)} style={{marginLeft:8, background:'transparent', border:'none', color:'#1e3a8a', cursor:'pointer'}}>✕</button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
