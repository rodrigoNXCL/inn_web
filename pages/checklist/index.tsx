import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import styles from "../../styles/checklist.module.css";
import Layout from '../../components/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';

type Maquina = { id: number, nombre: string };
type Tipo = { id: number, nombre: string };
type Item = { id: number, id_area: number, item: string };

export default function Checklist() {
  const router = useRouter();

  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [maquina, setMaquina] = useState('');
  const [tipo, setTipo] = useState('');
  const [nombreInspector, setNombreInspector] = useState('');
  const [correoInspector, setCorreoInspector] = useState('');
  const [idUsuario, setIdUsuario] = useState<string | null>(null);
  const [codigoMaquina, setCodigoMaquina] = useState('');
  const [ubicacion, setUbicacion] = useState('');

  // Geolocalización
  const [georef, setGeoref] = useState('');
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState('');
  const [geoEnabled, setGeoEnabled] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [respuestas, setRespuestas] = useState<any>({});
  const [loadingItems, setLoadingItems] = useState(false);
  const [tiposLoading, setTiposLoading] = useState(false);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoURL, setFotoURL] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; id: string | null } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');

    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(stored);
      setNombreInspector(user.nombre || '');
      setCorreoInspector(user.correo || '');
      setIdUsuario(user.id || null);
    } catch (e) {
      router.push('/login');
      return;
    }

    supabase.from('maquinas').select('id, nombre').then(({ data }) => setMaquinas(data || []));
    obtenerGeolocalizacion();
  }, [router]);

  useEffect(() => {
    async function cargarTiposPorMaquina() {
      if (!maquina) {
        setTipos([]);
        setTipo('');
        return;
      }
      setTiposLoading(true);
      setTipo('');
      setItems([]);
      setRespuestas({});

      const { data: filas } = await supabase
        .from('checklist_items')
        .select('id_tipo')
        .eq('id_maquina', maquina);

      const ids = Array.from(new Set((filas || [])
        .map((f: any) => f.id_tipo)
        .filter((v: any) => v !== null)));

      if (ids.length) {
        const { data: tiposData } = await supabase
          .from('checklist_tipos')
          .select('id, nombre')
          .in('id', ids);
        setTipos((tiposData || []).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } else {
        setTipos([]);
      }
      setTiposLoading(false);
    }
    cargarTiposPorMaquina();
  }, [maquina]);

  useEffect(() => {
    async function cargarItems() {
      if (!maquina || !tipo) {
        setItems([]);
        setRespuestas({});
        return;
      }
      setLoadingItems(true);
      const { data } = await supabase
        .from('checklist_items')
        .select('id, id_area, item')
        .eq('id_maquina', maquina)
        .eq('id_tipo', tipo)
        .order('id_area', { ascending: true })
        .order('id', { ascending: true });

      setItems(data || []);
      const r: any = {};
      data?.forEach(i => { r[i.id] = { aplica: 'No', valor: 'No Aplica', comentario: '' }; });
      setRespuestas(r);
      setLoadingItems(false);
    }
    cargarItems();
  }, [maquina, tipo]);

  const obtenerGeolocalizacion = () => {
    setGeoLoading(true);
    setGeoError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoref(`${pos.coords.latitude},${pos.coords.longitude}`);
          setGeoLoading(false);
          setGeoEnabled(true);
        },
        (error) => {
          setGeoError('Debes permitir el acceso a tu ubicación para continuar.');
          setGeoLoading(false);
          setGeoEnabled(false);
        }
      );
    } else {
      setGeoError('Tu navegador no soporta geolocalización.');
      setGeoLoading(false);
      setGeoEnabled(false);
    }
  };

  function handleRespuesta(id: number, campo: string, valor: string) {
    setRespuestas((prev: any) => {
      let nueva = { ...prev[id], [campo]: valor };
      if (campo === 'aplica') {
        if (valor === 'No') nueva.valor = 'No Aplica';
        else if (valor === 'Si' && prev[id].valor === 'No Aplica') nueva.valor = '';
      }
      return { ...prev, [id]: nueva };
    });
  }

  async function subirFoto(): Promise<string | null> {
    if (!fotoFile) return null;
    setUploadingFoto(true);
    const ext = fotoFile.name.split('.').pop();
    const path = `equipos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('fotos').upload(path, fotoFile);
    setUploadingFoto(false);
    if (error) { setMensaje({ texto: 'Error subiendo la foto: ' + error.message, id: null }); return null; }
    const { publicURL } = supabase.storage.from('fotos').getPublicUrl(path);
    if (publicURL) {
      setFotoURL(publicURL);
      return publicURL;
    }
    return null;
  }

  async function handleGuardar(e: any) {
    e.preventDefault();
    setMensaje(null);
    setSaving(true);

    // Validaciones
    if (!maquina || !tipo || !codigoMaquina || !ubicacion || !georef) {
      setMensaje({ texto: 'Completa todos los campos obligatorios antes de guardar.', id: null });
      setSaving(false);
      return;
    }
    if (Object.values(respuestas).some((r: any) => r.aplica === 'Si' && !r.valor)) {
      setMensaje({ texto: 'Debes responder el estado de todos los ítems que apliquen.', id: null });
      setSaving(false);
      return;
    }

    let urlFoto: string | null = null;
    if (fotoFile) {
      urlFoto = await subirFoto();
      if (!urlFoto) {
        setSaving(false);
        return;
      }
    }

    const now = new Date().toISOString();
    const registros = items.map(it => ({
      timestamp: now,
      inspector_email: correoInspector,
      inspector_nombre: nombreInspector,
      ubicacion_inspeccion: ubicacion,
      georeferencia: georef,
      codigo_maquina: codigoMaquina,
      nombre_maquina: maquinas.find(m => m.id.toString() === maquina)?.nombre || codigoMaquina,
      id_tipo: parseInt(tipo),
      id_item: it.id,
      aplica: respuestas[it.id]?.aplica,
      valor: respuestas[it.id]?.valor,
      comentario: respuestas[it.id]?.comentario,
      foto_maquina: urlFoto,
      id_usuario: idUsuario,
    }));

    const { error } = await supabase.from('checklist_respuestas').insert(registros);
    setSaving(false);
    if (error) {
      setMensaje({ texto: 'Error al guardar checklist: ' + error.message, id: null });
    } else {
      setMensaje({ texto: 'Checklist guardado correctamente. Ahora puedes imprimir el reporte.', id: now });
      // Se eliminaron las líneas de reseteo de campos para permitir la impresión
    }
  }

  const isFormValid = maquina && tipo && codigoMaquina && ubicacion && georef;

  if (!idUsuario) {
    return <Layout><div style={{ padding: 24, textAlign: 'center' }}><h2>Verificando acceso...</h2></div></Layout>;
  }

  return (
    <Layout>
      <div className={styles.checklistContainer}>
        {/* Fila de Campos de Entrada */}
        <div className={styles.checklistCard}>
          <h2>Datos de la Inspección</h2>
          <form autoComplete="off" onSubmit={handleGuardar}>
            <div className={styles.flexRow}>
              <div className={styles.flexCol}>
                <label>Tipo de equipo</label>
                <select className={styles.select} value={maquina} onChange={e => setMaquina(e.target.value)} required>
                  <option value="">Seleccione...</option>
                  {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div className={styles.flexCol}>
                <label>Tipo de control {tiposLoading ? '(cargando...)' : ''}</label>
                <select className={styles.select} value={tipo} onChange={e => setTipo(e.target.value)} required disabled={!maquina || tiposLoading}>
                  <option value="">{tiposLoading ? 'Cargando...' : 'Seleccione...'}</option>
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div className={styles.flexCol}>
                <label>Código de máquina</label>
                <input className={styles.input} value={codigoMaquina} onChange={e => setCodigoMaquina(e.target.value)} placeholder="Ej: REX-001" required />
              </div>
              <div className={styles.flexCol}>
                <label>Ubicación de inspección</label>
                <input className={styles.input} value={ubicacion} onChange={e => setUbicacion(e.target.value)} placeholder="Ej: Coihueco" required />
              </div>
              <div className={styles.flexCol}>
                <label>Georreferencia</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input className={styles.input} value={georef} readOnly style={{ flex: 1, background: '#eef4fa' }} />
                  {geoLoading ? (
                    <span className={styles.geoStatus}>Cargando...</span>
                  ) : (
                    geoError ? (
                      <button type="button" onClick={obtenerGeolocalizacion} className={styles.btn} style={{ backgroundColor: '#dc3545' }}>
                        Reintentar
                      </button>
                    ) : (
                      <span className={styles.geoStatus}>✓ Obtenida</span>
                    )
                  )}
                </div>
                {geoError && <div style={{ color: '#dc3545', marginTop: 6, fontSize: 12, fontStyle: 'italic' }}>{geoError}</div>}
              </div>
              <div className={styles.flexCol}>
                <label>Foto del equipo (opcional)</label>
                <input className={styles.input} type="file" accept="image/*" onChange={e => setFotoFile(e.target.files ? e.target.files[0] : null)} disabled={uploadingFoto} />
                {fotoURL && <div style={{ margin: '8px 0' }}><img src={fotoURL} alt="Foto equipo" style={{ maxWidth: 120, borderRadius: 6 }} /></div>}
              </div>
            </div>

            {/* Checklist */}
            {items.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 className={styles.sectionTitle}>Checklist</h3>
                <div className={styles.checklistGrid}>
                  {items.map(it => (
                    <div className={styles.checklistCard} key={it.id}>
                      <div className={styles.itemTitle}>{it.item}</div>
                      <div className={styles.group}>
                        <label>
                          Aplica:
                          <select className={styles.select} value={respuestas[it.id]?.aplica || 'No'} onChange={e => handleRespuesta(it.id, 'aplica', e.target.value)} style={{ width: 90 }}>
                            <option value="Si">Sí</option>
                            <option value="No">No</option>
                          </select>
                        </label>
                        <label>
                          Estado:
                          <select
                            className={styles.select}
                            value={respuestas[it.id]?.valor || 'No Aplica'}
                            onChange={e => handleRespuesta(it.id, 'valor', e.target.value)}
                            disabled={respuestas[it.id]?.aplica === 'No'}
                            required={respuestas[it.id]?.aplica === 'Si'}
                            style={{ background: respuestas[it.id]?.aplica === 'No' ? '#eef1f6' : '#fff' }}>
                            <option value="">Seleccione</option>
                            <option value="Cumple">Cumple</option>
                            <option value="No Cumple">No Cumple</option>
                            <option value="No Aplica">No Aplica</option>
                          </select>
                        </label>
                        <input className={styles.input} placeholder="Comentario (opcional)" value={respuestas[it.id]?.comentario || ''} onChange={e => handleRespuesta(it.id, 'comentario', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guardar */}
            {items.length > 0 && (
              <div className={styles.actionSection}>
                <button type="submit" className={styles.btn} disabled={saving || !isFormValid}>
                  {saving ? 'Guardando...' : 'Guardar Checklist'}
                </button>
              </div>
            )}
            
            {/* Mensaje y Botón de Imprimir (CORREGIDO) */}
            {mensaje && (
              <div className={styles.mensajeGuardado}>
                <p className={styles.mensajeTexto}>{mensaje.texto}</p>
                {mensaje.id && (
                  <button
                    className={styles.btnImprimir}
                    onClick={() => {
                      const url = `/reportes/${encodeURIComponent(mensaje.id)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Imprimir Reporte
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
}