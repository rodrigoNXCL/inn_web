import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import { supabase } from "../../../lib/supabaseClient";

type Opcion = { id: number; nombre: string };
type ItemRow = { id: number; id_maquina: number; id_tipo: number; id_area: number; item: string };

export default function MantItems() {
  const [rol, setRol] = useState("");

  // catálogos
  const [maquinas, setMaquinas] = useState<Opcion[]>([]);
  const [tipos, setTipos] = useState<Opcion[]>([]);
  const [areas, setAreas] = useState<Opcion[]>([]);

  // diccionarios para la grilla
  const [maquinasMap, setMaquinasMap] = useState<Record<number, string>>({});
  const [tiposMap, setTiposMap] = useState<Record<number, string>>({});
  const [areasMap, setAreasMap] = useState<Record<number, string>>({});

  // nuevo
  const [nMaquina, setNMaquina] = useState<string>("");
  const [nTipo, setNTipo] = useState<string>("");
  const [nArea, setNArea] = useState<string>("");
  const [nDescripcion, setNDescripcion] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // filtros
  const [qMaquina, setQMaquina] = useState<string>("");
  const [qTipo, setQTipo] = useState<string>("");
  const [qArea, setQArea] = useState<string>("");
  const [qText, setQText] = useState<string>("");

  // edición
  const [editId, setEditId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState("");

  const [items, setItems] = useState<ItemRow[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { setRol((JSON.parse(raw).rol || "").toLowerCase()); } catch {}
    }
    loadCatalogos().then(loadItems);
  }, []);

  async function loadCatalogos() {
    const [maqRes, tipRes, arRes] = await Promise.all([
      supabase.from("maquinas").select("id,nombre").order("nombre"),
      supabase.from("checklist_tipos").select("id,nombre").order("nombre"),
      supabase.from("checklist_areas").select("id,areas").order("id"),
    ]);

    const maq = (maqRes.data || []) as { id: number; nombre: string }[];
    const tip = (tipRes.data || []) as { id: number; nombre: string }[];
    const ar  = (arRes.data || []) as { id: number; areas: string }[];

    setMaquinas(maq.map(m => ({ id: m.id, nombre: m.nombre })));
    setTipos(tip.map(t => ({ id: t.id, nombre: t.nombre })));
    setAreas(ar.map(a => ({ id: a.id, nombre: a.areas })));

    setMaquinasMap(Object.fromEntries(maq.map(m => [m.id, m.nombre])));
    setTiposMap(Object.fromEntries(tip.map(t => [t.id, t.nombre])));
    setAreasMap(Object.fromEntries(ar.map(a => [a.id, a.areas])));
  }

  async function loadTiposByMaquina(maquinaId?: string) {
    if (!maquinaId) { setTipos([]); return; }
    const { data, error } = await supabase
      .from("checklist_tipos_maquina")
      .select("id_tipo, checklist_tipos(nombre)")
      .eq("id_maquina", maquinaId);

    if (error) {
      console.error("Error cargando tipos:", error.message);
      setTipos([]);
      return;
    }

    const opts = (data || []).map((r: any) => ({
      id: r.id_tipo,
      nombre: r.checklist_tipos?.nombre || r.id_tipo
    }));
    setTipos(opts);
  }

  async function loadAreasByMaquinaTipo(maquinaId?: string, tipoId?: string) {
    if (!maquinaId || !tipoId) { setAreas([]); return; }
    const { data, error } = await supabase
      .from("checklist_areas_asignadas")
      .select("id_area, checklist_areas(areas)")
      .eq("id_maquina", maquinaId)
      .eq("id_tipo", tipoId);

    if (error) {
      console.error("Error cargando áreas:", error.message);
      setAreas([]);
      return;
    }

    const opts = (data || []).map((r: any) => ({
      id: r.id_area,
      nombre: r.checklist_areas?.areas || r.id_area
    }));
    setAreas(opts);
  }

  async function loadItems() {
    let qy = supabase
      .from("checklist_items")
      .select("id,id_maquina,id_tipo,id_area,item")
      .order("id", { ascending: true });

    if (qMaquina) qy = qy.eq("id_maquina", Number(qMaquina));
    if (qTipo)    qy = qy.eq("id_tipo", Number(qTipo));
    if (qArea)    qy = qy.eq("id_area", Number(qArea));
    if (qText)    qy = qy.ilike("item", `%${qText}%`);

    const { data, error } = await qy;
    if (error) { console.error("Error items:", error.message); return; }
    setItems((data || []) as ItemRow[]);
  }

  async function crearItem(e: React.FormEvent) {
    e.preventDefault();
    if (!nMaquina || !nTipo || !nArea || !nDescripcion.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("checklist_items").insert({
      id_maquina: Number(nMaquina),
      id_tipo: Number(nTipo),
      id_area: Number(nArea),
      item: nDescripcion.trim(),
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setNMaquina(""); setNTipo(""); setNArea(""); setNDescripcion("");
    loadItems();
  }

  function startEdit(row: ItemRow) {
    setEditId(row.id);
    setEditItem(row.item);
  }
  function cancelEdit() {
    setEditId(null);
    setEditItem("");
  }
  async function guardarEdit(id: number) {
    if (!editItem.trim()) return;
    const { error } = await supabase
      .from("checklist_items")
      .update({ item: editItem.trim() })
      .eq("id", id);
    if (error) { alert(error.message); return; }
    cancelEdit();
    loadItems();
  }
  async function eliminarItem(id: number) {
    if (!confirm("¿Eliminar ítem?")) return;
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    loadItems();
  }

  if (!["superadmin", "administrador"].includes(rol)) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <h2>Acceso restringido</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mant-container">
        {/* NUEVO ÍTEM */}
        <form onSubmit={crearItem} className="admin-card">
          <h3>Nuevo ítem</h3>
          <div className="form-row">
            {/* Máquina */}
            <div className="form-col">
              <label>Máquina</label>
              <select
                className="form-select"
                value={nMaquina}
                onChange={(e) => {
                  const v = e.target.value;
                  setNMaquina(v);
                  setNTipo(""); setNArea("");
                  loadTiposByMaquina(v);
                }}
                required
              >
                <option value="">Seleccione...</option>
                {maquinas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>

            {/* Tipo */}
            <div className="form-col">
              <label>Tipo</label>
              <div className="input-group">
                <select
                  className="form-select"
                  value={nTipo}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNTipo(v);
                    setNArea("");
                    loadAreasByMaquinaTipo(nMaquina, v);
                  }}
                  disabled={!nMaquina}
                  required
                >
                  <option value="">Seleccione...</option>
                  {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <button type="button" className="form-btn" onClick={() => alert("Crear Tipo inline")}>+ Tipo</button>
              </div>
            </div>

            {/* Área */}
            <div className="form-col">
              <label>Área</label>
              <div className="input-group">
                <select
                  className="form-select"
                  value={nArea}
                  onChange={(e) => setNArea(e.target.value)}
                  disabled={!nTipo}
                  required
                >
                  <option value="">Seleccione...</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
                <button type="button" className="form-btn" onClick={() => alert("Crear Área inline")}>+ Área</button>
              </div>
            </div>

            {/* Descripción */}
            <div className="form-col">
              <label>Descripción del ítem</label>
              <input
                className="form-input"
                value={nDescripcion}
                onChange={(e) => setNDescripcion(e.target.value)}
                placeholder="Ej: Revisar niveles de aceite"
                required
              />
            </div>

            <div className="form-col" style={{ maxWidth: 220 }}>
              <button type="submit" className="form-btn" disabled={saving}>
                {saving ? "Guardando..." : "Agregar ítem"}
              </button>
            </div>
          </div>
        </form>

        {/* FILTROS */}
        <div className="admin-card">
          <div className="form-row">
            <div className="form-col">
              <label>Filtrar por máquina</label>
              <select
                className="form-select"
                value={qMaquina}
                onChange={(e) => {
                  const v = e.target.value;
                  setQMaquina(v); setQTipo(""); setQArea("");
                  loadTiposByMaquina(v);
                }}
              >
                <option value="">(todas)</option>
                {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="form-col">
              <label>Filtrar por tipo</label>
              <select
                className="form-select"
                value={qTipo}
                onChange={(e) => {
                  const v = e.target.value;
                  setQTipo(v);
                  setQArea("");
                  loadAreasByMaquinaTipo(qMaquina, v);
                }}
                disabled={!qMaquina}
              >
                <option value="">(todos)</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="form-col">
              <label>Filtrar por área</label>
              <select
                className="form-select"
                value={qArea}
                onChange={(e) => setQArea(e.target.value)}
                disabled={!qTipo}
              >
                <option value="">(todas)</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div className="form-col">
              <label>Buscar texto</label>
              <input
                className="form-input"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Descripción..."
              />
            </div>
            <div className="form-col" style={{ maxWidth: 180 }}>
              <button type="button" className="form-btn" onClick={loadItems}>
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div className="admin-card" style={{ padding: 0 }}>
          <table className="mant-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Máquina</th>
                <th>Tipo</th>
                <th>Área</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={6} className="no-results">Sin resultados.</td></tr>
              )}
              {items.map(it => (
                <tr key={it.id}>
                  <td data-label="ID">{it.id}</td>
                  <td data-label="Máquina">{maquinasMap[it.id_maquina] || it.id_maquina}</td>
                  <td data-label="Tipo">{tiposMap[it.id_tipo] || it.id_tipo}</td>
                  <td data-label="Área">{areasMap[it.id_area] || it.id_area}</td>
                  <td data-label="Descripción">
                    {editId === it.id ? (
                      <input 
                        className="form-input" 
                        value={editItem} 
                        onChange={(e) => setEditItem(e.target.value)} 
                      />
                    ) : (
                      it.item
                    )}
                  </td>
                  <td data-label="Acciones">
                    {editId === it.id ? (
                      <div className="btn-group">
                        <button className="form-btn" style={{backgroundColor:'#28a745'}} onClick={() => guardarEdit(it.id)}>
                          Guardar
                        </button>
                        <button className="form-btn" style={{backgroundColor:'#6c757d'}} onClick={cancelEdit}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="btn-group">
                        <button className="btn-edit" onClick={() => startEdit(it)}>
                          Editar
                        </button>
                        <button className="btn-delete" onClick={() => eliminarItem(it.id)}>
                          Eliminar
                        </button>
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
  );
}