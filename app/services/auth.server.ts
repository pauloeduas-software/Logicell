import { redirect } from "react-router";
import { createSupabaseServerClient } from "./supabase.server";

/**
 * Helper para garantir que o usuário está logado no lado do servidor.
 * Se não houver sessão ativa, dispara um redirect para /login.
 */
export async function requireUser(request: Request) {
  const { supabase, response } = await createSupabaseServerClient(request);
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`/login?${searchParams}`);
  }

  return { user, supabase, response };
}

/**
 * Apenas verifica se há um usuário sem disparar redirect.
 */
export async function getUser(request: Request) {
  const { supabase } = await createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
