import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import { supabase } from "../../../lib/supabaseClient";

type RolApp = "SuperAdmin" | "Administrador" | "Inspector" | string;

type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: RolApp;
};

export default function MantUsuarios() {
  const [miRol, setMiRol] = useState<"superadmin" | "administrador" | "inspector" | "">("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Nuevo usuario
  const [nNombre, setNNombre] = useState("");
  const [nCorreo, setNCorreo] = useState("");
  const [nPass, setNPass] = useState("");
  const [nRol, setNRol] = useState<RolApp>("Inspector");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setMiRol(((u.rol || "") as string).toLowerCase() as any);
      } catch {}
    }
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,correo,password,rol")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error usuarios:", error.message);
      return;
    }
    setUsuarios((data || []) as Usuario[]);
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!nNombre.trim() || !nCorreo.trim() || !nPass.trim() || !nRol) return;

    if (miRol === "administrador" && nRol === "SuperAdmin") {
      alert("Un Administrador no puede crear SuperAdmin.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("usuarios").insert({
      nombre: nNombre.trim(),
      correo: nCorreo.trim(),
      password: nPass,
      rol: nRol,
      activo: true
    });
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }
    setNNombre("");
    setNCorreo("");
    setNPass("");
    setNRol("Inspector");
    loadUsuarios();
  }

  async function eliminarUsuario(u: Usuario) {
    if (miRol === "administrador" && u.rol === "SuperAdmin") {
      alert("No puedes eliminar al SuperAdmin.");
      return;
    }
    if (!confirm("¿Eliminar usuario?")) return;

    const { error } = await supabase.from("usuarios").delete().eq("id", u.id);
    if (error) {
      alert(error.message);
      return;
    }
    loadUsuarios();
  }

  if (!["superadmin", "administrador"].includes(miRol)) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <h2>Acceso restringido</h2>
        </div>
      </Layout>
    );
  }

  const puedeVerPass = (u: Usuario) =>
    miRol === "superadmin" || (miRol === "administrador" && u.rol !== "SuperAdmin");

  return (
    <Layout>
      <div className="mant-container">
        {/* NUEVO USUARIO */}
        <form onSubmit={crearUsuario} className="admin-card">
          <h3>Nuevo usuario</h3>
          <div className="form-row">
            <div className="form-col">
              <label>Nombre</label>
              <input
                className="form-input"
                value={nNombre}
                onChange={(e) => setNNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div className="form-col">
              <label>Email</label>
              <input
                className="form-input"
                type="email"
                value={nCorreo}
                onChange={(e) => setNCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div className="form-col">
              <label>Password</label>
              <input
                className="form-input"
                type="text"
                value={nPass}
                onChange={(e) => setNPass(e.target.value)}
                placeholder="Contraseña"
                required
              />
            </div>
            <div className="form-col" style={{ maxWidth: 240 }}>
              <label>Rol</label>
              <select
                className="form-select"
                value={nRol}
                onChange={(e) => setNRol(e.target.value as RolApp)}
              >
                <option value="SuperAdmin" disabled={miRol === "administrador"}>
                  SuperAdmin
                </option>
                <option value="Administrador">Administrador</option>
                <option value="Inspector">Inspector</option>
              </select>
            </div>
            <div className="form-col" style={{ maxWidth: 220 }}>
              <button type="submit" className="form-btn" disabled={saving}>
                {saving ? "Guardando..." : "Agregar usuario"}
              </button>
            </div>
          </div>
        </form>

        {/* LISTA */}
        <div className="admin-card" style={{ padding: 0 }}>
          <table className="mant-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Password</th>
                <th style={{ width: 140 }}>Rol</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-results">Sin resultados.</td>
                </tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.id.slice(0, 8)}</td>
                  <td>{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>{puedeVerPass(u) ? u.password : "••••••••"}</td>
                  <td>{u.rol}</td>
                  <td>
                    {(miRol === "superadmin" ||
                      (miRol === "administrador" && u.rol !== "SuperAdmin")) ? (
                      <div className="btn-group">
                        <button
                          className="btn-edit"
                          onClick={() => alert("Editar (pendiente)")}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => eliminarUsuario(u)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <>—</>
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