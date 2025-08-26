import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import styles from "../../styles/historial-reportes.module.css"; 

// Define el tipo de datos para el reporte
type Reporte = {
  timestamp: string;
  inspector_nombre: string;
  codigo_maquina: string;
};

// Función robusta para agrupar y obtener reportes únicos
function getUniqueReports(data: Reporte[]): Reporte[] {
  const uniqueReportsMap = new Map<string, Reporte>();
  data.forEach(reporte => {
    // Creamos una clave única que solo usa la fecha, el inspector y la máquina
    const date = new Date(reporte.timestamp);
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const uniqueKey = `${dateKey}-${reporte.inspector_nombre}-${reporte.codigo_maquina}`;
    
    // Si la clave no existe en el Map, la agregamos
    if (!uniqueReportsMap.has(uniqueKey)) {
      uniqueReportsMap.set(uniqueKey, reporte);
    }
  });
  
  // Devolvemos los valores del Map como un array y los ordenamos por timestamp
  return Array.from(uniqueReportsMap.values()).sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

export default function HistorialReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportes() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("checklist_respuestas")
        .select(`timestamp, inspector_nombre, codigo_maquina`)
        .order("timestamp", { ascending: false });

      if (fetchError) {
        setError("Error al cargar los reportes. Revisa la consola para más detalles.");
        console.error(fetchError);
        setReportes([]);
      } else if (!data || data.length === 0) {
        setReportes([]);
      } else {
        // Usamos la función para obtener los reportes únicos antes de establecer el estado
        const uniqueReports = getUniqueReports(data as Reporte[]);
        setReportes(uniqueReports);
      }
      setLoading(false);
    }
    fetchReportes();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Historial de Reportes</h1>
          <div className={styles.loading}>Cargando reportes...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1>Historial de Reportes</h1>
          <div className={styles.error}>{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1>Historial de Reportes</h1>
        <div className={styles.tablaContainer}>
          {reportes.length === 0 ? (
            <div className={styles.noRecords}>No hay reportes registrados.</div>
          ) : (
            <table className={styles.tablaReportes}>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Máquina</th>
                  <th>Inspector</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map((reporte) => (
                  <tr key={reporte.timestamp}>
                    <td>{new Date(reporte.timestamp).toLocaleString()}</td>
                    <td>{reporte.codigo_maquina}</td>
                    <td>{reporte.inspector_nombre}</td>
                    <td>
                      <Link href={`/reportes/${encodeURIComponent(reporte.timestamp)}`} passHref>
                        <button className={styles.btnVer}>Ver Reporte</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}