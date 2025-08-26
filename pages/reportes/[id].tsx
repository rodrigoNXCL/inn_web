import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import Head from "next/head";
import styles from "../../styles/ReporteChecklist.module.css";

// Definición de tipos de datos para las tablas
type ChecklistRespuesta = {
  id: number;
  timestamp: string;
  inspector_email: string;
  inspector_nombre: string;
  ubicacion_inspeccion: string;
  georeferencia: string;
  codigo_maquina: string;
  nombre_maquina: string;
  foto_maquina?: string;
  id_item: number;
  aplica: string;
  valor: string;
  comentario?: string;
  nombre_tipo?: string;
  nombre_item?: string;
};

export default function ReporteChecklist() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<ChecklistRespuesta[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      async function fetchReporte() {
        setLoading(true);
        const { data: respuestas, error: fetchError } = await supabase
          .from("checklist_respuestas")
          .select(
            `
            id,
            timestamp,
            inspector_email,
            inspector_nombre,
            ubicacion_inspeccion,
            georeferencia,
            codigo_maquina,
            nombre_maquina,
            foto_maquina,
            aplica,
            valor,
            comentario,
            id_item,
            checklist_tipos(nombre),
            checklist_items(item)
            `
          )
          .eq("timestamp", id)
          .order("id_item", { ascending: true });
        
        if (fetchError || !respuestas || respuestas.length === 0) {
          setError("No se pudo cargar el reporte o no existe.");
        } else {
          const formattedData = respuestas.map((r: any) => ({
            ...r,
            nombre_tipo: r.checklist_tipos?.nombre,
            nombre_item: r.checklist_items?.item,
          }));
          setData(formattedData);
        }
        setLoading(false);
      }
      fetchReporte();
    }
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Cargando reporte...</div>;
  }
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  if (!data || data.length === 0) {
    return <div className={styles.noData}>No se encontraron datos para este reporte.</div>;
  }

  const reporteInfo = data[0];

  return (
    <div className={styles.reporteIndividualContainer}>
      <Head>
        <title>Reporte de Checklist - {reporteInfo.codigo_maquina}</title>
      </Head>

      <div className={styles.reporteIndividualActions}>
        <button onClick={() => window.print()} className={styles.printBtn}>Imprimir / Guardar como PDF</button>
      </div>

      <div className={styles.reporteIndividualContent}>
        <div className={styles.reporteIndividualHeader}>
          <img src="/logo_nxchile.png" alt="Nexo Chile" className={styles.reporteIndividualLogo} />
          <h1 className={styles.title}>Reporte de Checklist</h1>
          <p className={styles.subtitle}>Detalle de inspección N° {reporteInfo.id}</p>
        </div>

        <section className={styles.reporteIndividualInfoSection}>
          <h2 className={styles.reporteIndividualSectionTitle}>Datos Generales</h2>
          <div className={styles.reporteIndividualInfoGrid}>
            <p><strong>Fecha y Hora:</strong> {new Date(reporteInfo.timestamp).toLocaleString()}</p>
            <p><strong>Inspector:</strong> {reporteInfo.inspector_nombre}</p>
            <p><strong>Tipo de equipo:</strong> {reporteInfo.nombre_maquina}</p>
            <p><strong>Tipo de control:</strong> {reporteInfo.nombre_tipo}</p>
            <p><strong>Código de Máquina:</strong> {reporteInfo.codigo_maquina}</p>
            <p><strong>Ubicación:</strong> {reporteInfo.ubicacion_inspeccion}</p>
            <p><strong>Georreferencia:</strong> {reporteInfo.georeferencia}</p>
          </div>
          {reporteInfo.foto_maquina && (
            <div className={styles.reporteIndividualFotoContainer}>
              <img src={reporteInfo.foto_maquina} alt="Foto de la máquina" className={styles.reporteIndividualFoto} />
            </div>
          )}
        </section>

        <section className={styles.reporteIndividualInfoSection}>
          <h2 className={styles.reporteIndividualSectionTitle}>Resultados de la Inspección</h2>
          <table className={styles.reporteIndividualTablaResultados}>
            <thead>
              <tr>
                <th>Ítem</th>
                <th>Aplica</th>
                <th>Estado</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.nombre_item}</td>
                  <td className={styles.reporteIndividualAplicaCell}>{item.aplica}</td>
                  <td className={styles.reporteIndividualValorCell}>{item.valor}</td>
                  <td>{item.comentario || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.reporteIndividualFirmaSection}>
          <div className={styles.reporteIndividualFirmaBox}>
            <p><strong>Inspector:</strong> {reporteInfo.inspector_nombre}</p>
            <p><strong>Correo:</strong> {reporteInfo.inspector_email}</p>
            <div className={styles.reporteIndividualFirmaLine}></div>
            <p className={styles.reporteIndividualFirmaLabel}>Firma del Inspector</p>
          </div>
        </section>
      </div>
    </div>
  );
}