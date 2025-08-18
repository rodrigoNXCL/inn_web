import { supabase } from "./supabaseClient";

export const getUserData = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, rol")
    .eq("correo", session.user.email)
    .single();

  if (error) {
    console.error("Error obteniendo usuario:", error.message);
    return null;
  }

  return data;
};
