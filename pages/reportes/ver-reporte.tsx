import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import styles from "../../styles/ReporteChecklist.module.css";
import Layout from "../../components/Layout";

// Define el tipo de datos para el reporte
type ReporteData = {
  item: string;
  [key: string]: string;
};

// Define los tipos de datos para los catálogos
type Item = { id: number; item: string };
type Maquina = { id: number; nombre: string };
type Tipo = { id: number; nombre: string };

export default function VerReporte() {
  const router = useRouter();
  const { desde, hasta, tipoMaquina, maquina, tipoControl } = router.query;

  const [loading, setLoading] = useState(true);
  const [reporte, setReporte] = useState<ReporteData[] | null>(null);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[] | null>(null); // Nuevo estado para los datos brutos
  const [filtroInfo, setFiltroInfo] = useState({
    fechaDesde: "",
    fechaHasta: "",
    maquinaNombre: "Todos",
    tipoControlNombre: "Todos",
    inspectorNombre: "N/A",
  });

  useEffect(() => {
    async function fetchReporteData() {
      if (!router.isReady) return;

      setLoading(true);

      // Fetch all items and create a lookup map
      const { data: itemsData, error: itemsError } = await supabase.from("checklist_items").select("id, item");
      if (itemsError) {
        console.error("Error fetching items:", itemsError);
        setReporte(null);
        setLoading(false);
        return;
      }
      const itemMap = new Map<number, string>();
      itemsData.forEach(item => itemMap.set(item.id, item.item));

      // 1. Obtener los nombres de los filtros para el encabezado del reporte
      const { data: maquinasData } = await supabase.from("maquinas").select("nombre").eq("id", tipoMaquina).single();
      const { data: tiposData } = await supabase.from("checklist_tipos").select("nombre").eq("id", tipoControl).single();
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      setFiltroInfo({
        fechaDesde: desde as string,
        fechaHasta: hasta as string,
        maquinaNombre: (maquinasData?.nombre || 'Todos') as string,
        tipoControlNombre: (tiposData?.nombre || 'Todos') as string,
        inspectorNombre: user?.nombre || 'N/A',
      });

      // 2. Cargar los datos del reporte con los filtros
      let query = supabase
        .from("checklist_respuestas")
        .select(`
          timestamp,
          id_item,
          aplica,
          valor,
          codigo_maquina,
          id_tipo,
          inspector_nombre,
          ubicacion_inspeccion,
          comentario,
          foto_maquina
        `)
        .gte("timestamp", desde)
        .lte("timestamp", `${hasta}T23:59:59Z`)
        .order("timestamp", { ascending: true });
      
      if (maquina) {
        query = query.eq("codigo_maquina", maquina);
      }
      if (tipoControl) {
        query = query.eq("id_tipo", tipoControl);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error("Error al obtener datos del reporte:", error);
        setReporte(null);
        setRawData(null);
      } else if (!data || data.length === 0) {
        setReporte([]);
        setRawData([]);
      } else {
        setRawData(data); // Guarda los datos brutos
        const { data: reporteData, columns } = transformData(data, itemMap);
        setReporte(reporteData);
        setColumnas(columns);
      }
      
      setLoading(false);
    }

    fetchReporteData();
  }, [router.isReady, desde, hasta, maquina, tipoControl, tipoMaquina]);

  function transformData(rawData: any[], itemMap: Map<number, string>): { data: ReporteData[], columns: string[] } {
    const reporteMap = new Map<string, ReporteData>();
    const fechas = new Set<string>();

    rawData.forEach(row => {
      const itemNombre = itemMap.get(row.id_item) || `ID: ${row.id_item}`;
      const fecha = new Date(row.timestamp).toLocaleDateString("es-CL");
      fechas.add(fecha);

      if (!reporteMap.has(itemNombre)) {
        reporteMap.set(itemNombre, {
          item: itemNombre,
        });
      }
      
      const itemData = reporteMap.get(itemNombre)!;
      itemData[fecha] = row.aplica === 'Si' ? row.valor : row.aplica;
    });

    const sortedFechas = Array.from(fechas).sort((a, b) => {
      const [d1, m1, y1] = a.split('/');
      const [d2, m2, y2] = b.split('/');
      return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
    });
    const columns = ["Ítem", ...sortedFechas];
    const data = Array.from(reporteMap.values());

    return { data, columns };
  }
  
  const exportToPdf = () => {
    window.print();
  };
  
  function exportPivotedCsv() {
    if (!reporte || !columnas) return;

    let csvHeader = "Reporte de Checklist\n";
    csvHeader += `Información de los filtros:,\n`;
    csvHeader += `Fecha Desde:,${filtroInfo.fechaDesde},\n`;
    csvHeader += `Fecha Hasta:,${filtroInfo.fechaHasta},\n`;
    csvHeader += `Tipo de máquina:,${filtroInfo.maquinaNombre},\n`;
    csvHeader += `Tipo de Control:,${filtroInfo.tipoControlNombre},\n`;
    csvHeader += `Código de Máquina:,${maquina || 'Todos'},\n\n`;

    let csvContent = csvHeader 
      + columnas.map(col => `"${col}"`).join(",") + "\n" 
      + reporte.map(row => 
          columnas.map(col => 
            `"${row[col as keyof ReporteData] || ''}"`
          ).join(",")
        ).join("\n") + "\n\n";

    csvContent += "Firma Inspector,________________________\n";
    csvContent += `Nombre:,${filtroInfo.inspectorNombre || ''}\n`;
        
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_pivotado_${filtroInfo.fechaDesde}_a_${filtroInfo.fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Nueva función para exportar la data cruda
  function exportRawCsv() {
    if (!rawData || rawData.length === 0) return;

    const headers = [
      "ID",
      "Fecha",
      "Inspector",
      "Ubicación",
      "Código de Máquina",
      "Ítem",
      "Aplica",
      "Valor",
      "Comentario",
      "Foto"
    ];

    const csvRows = rawData.map(row => [
      row.id || '',
      new Date(row.timestamp).toLocaleString("es-CL") || '',
      row.inspector_nombre || '',
      row.ubicacion_inspeccion || '',
      row.codigo_maquina || '',
      row.id_item || '',
      row.aplica || '',
      row.valor || '',
      row.comentario || '',
      row.foto_maquina || ''
    ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(","));

    const csvContent = [headers.map(h => `"${h}"`).join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_bruto_${filtroInfo.fechaDesde}_a_${filtroInfo.fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <Layout>
        <div className={styles.loadingMessage}>Cargando reporte...</div>
      </Layout>
    );
  }

  if (reporte === null) {
    return (
      <Layout>
        <div className={styles.noDataMessage}>
          Error al cargar el reporte. Por favor, inténtelo de nuevo.
        </div>
      </Layout>
    );
  }

  if (reporte.length === 0) {
    return (
      <Layout>
        <div className={styles.noDataMessage}>
          No se encontraron datos para los filtros seleccionados.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.reporteGeneralContainer}>
        <div className={styles.reporteGeneralActions} style={{ marginBottom: "20px" }}>
          <button onClick={() => router.back()} className={styles.printBtn}>
            Volver a Filtros
          </button>
          <button onClick={exportToPdf} className={styles.printBtn} style={{ backgroundColor: '#dc3545', marginLeft: '10px' }}>
            Exportar a PDF
          </button>
          <button onClick={exportRawCsv} className={styles.printBtn} style={{ backgroundColor: '#217346', marginLeft: '10px' }}>
            Exportar a CSV (Detalle)
          </button>
        </div>

        <div className={styles.reporteIndividualContent}>
          <div className={styles.reporteGeneralHeader}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <img src="/logo_nxchile.png" alt="Logo de la empresa" style={{ height: "60px" }} />
              <h2 style={{ margin: "0", fontSize: "20px" }}>Reporte de Checklist</h2>
            </div>
            <div className={styles.reporteGeneralInfoSection}>
              <div className={styles.reporteGeneralInfoRow}>
                <strong>Inspector:</strong>
                <span>{filtroInfo.inspectorNombre}</span>
                <strong>Fecha de generación:</strong>
                <span>{new Date().toLocaleDateString("es-CL")}</span>
              </div>
              <div className={styles.reporteGeneralInfoRow}>
                <strong>Filtros:</strong>
                <span>Desde {filtroInfo.fechaDesde} hasta {filtroInfo.fechaHasta}, Máquina: {filtroInfo.maquinaNombre}, Tipo de control: {filtroInfo.tipoControlNombre}, Código Máquina: {maquina || 'Todos'}</span>
              </div>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table className={styles.reporteGeneralTablaResultados}>
              <thead>
                <tr>
                  {columnas.map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reporte.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnas.map((col, colIndex) => (
                      <td key={colIndex}>
                        {col === "Ítem" ? row.item : (row[col as keyof ReporteData] || "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.reporteGeneralSignatureSection}>
            <div className={styles.reporteGeneralSignatureLine}></div>
            <span>Firma Inspector: {filtroInfo.inspectorNombre}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}