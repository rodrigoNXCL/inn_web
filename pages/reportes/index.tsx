import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import styles from "../../styles/ReporteChecklist.module.css";
import { useRouter } from "next/router";

// Reutilizamos los tipos de datos
type Maquina = { id: number; nombre: string };
type Tipo = { id: number; nombre: string };

export default function ReportesIndex() {
  const router = useRouter();
  const [maquinasTipos, setMaquinasTipos] = useState<Maquina[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [codigosMaquinas, setCodigosMaquinas] = useState<string[]>([]);
  
  // Estados del formulario
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [maquinaTipoSeleccionado, setMaquinaTipoSeleccionado] = useState("");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  
  // Cargar catálogos al iniciar la página
  useEffect(() => {
    const loadCatalogs = async () => {
      // Cargar máquinas de la tabla 'maquinas'
      const { data: maquinasData } = await supabase.from("maquinas").select("id, nombre").order("nombre");
      setMaquinasTipos(maquinasData || []);
      
      // Cargar tipos
      const { data: tiposData } = await supabase.from("checklist_tipos").select("id, nombre").order("nombre");
      setTipos(tiposData || []);
      
      // Cargar codigos de máquina únicos de la tabla de respuestas
      const { data: codigosMaquinasData } = await supabase
        .from("checklist_respuestas")
        .select("codigo_maquina")
        .order("codigo_maquina", { ascending: true });
        
      const uniqueCodigos = Array.from(new Set(codigosMaquinasData?.map(row => row.codigo_maquina) || []));
      setCodigosMaquinas(uniqueCodigos.filter(Boolean) as string[]);
    };
    loadCatalogs();
  }, []);

  const handleGenerarReporte = () => {
    const params = new URLSearchParams();
    params.set('desde', fechaDesde);
    params.set('hasta', fechaHasta);
    if (maquinaTipoSeleccionado) {
      params.set('tipoMaquina', maquinaTipoSeleccionado);
    }
    if (maquinaSeleccionada) {
      params.set('maquina', maquinaSeleccionada);
    }
    if (tipoSeleccionado) {
      params.set('tipoControl', tipoSeleccionado);
    }
    router.push(`/reportes/ver-reporte?${params.toString()}`);
  };

  const isFormValid = () => {
    return fechaDesde && fechaHasta;
  };

  return (
    <Layout>
      <div className={styles.reporteContainer}>
        <h1>Panel de Reportes</h1>
        <p>Genera informes de rendimiento de equipos por rangos de tiempo.</p>

        <div className={styles.reporteContent}>
          <h3>Filtros de Informe</h3>
          <div className={styles.flexRow}>
            <div className={styles.flexCol}>
              <label>Fecha Desde</label>
              <input type="date" className={styles.input} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} required />
            </div>
            <div className={styles.flexCol}>
              <label>Fecha Hasta</label>
              <input type="date" className={styles.input} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} required />
            </div>
            <div className={styles.flexCol}>
              <label>Tipo de máquina</label>
              <select className={styles.select} value={maquinaTipoSeleccionado} onChange={e => setMaquinaTipoSeleccionado(e.target.value)}>
                <option value="">Todos</option>
                {maquinasTipos.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
            <div className={styles.flexCol}>
              <label>Tipo de control</label>
              <select className={styles.select} value={tipoSeleccionado} onChange={e => setTipoSeleccionado(e.target.value)}>
                <option value="">Todos</option>
                {tipos.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div className={styles.flexCol}>
              <label>Máquina</label>
              <select className={styles.select} value={maquinaSeleccionada} onChange={e => setMaquinaSeleccionada(e.target.value)}>
                <option value="">Todos</option>
                {codigosMaquinas.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="button" className={styles.printBtn} onClick={handleGenerarReporte} disabled={!isFormValid()}>
              Generar Informe
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}