import { createClient } from '@supabase/supabase-js';

// Tenta pegar do arquivo .env, se falhar (por cache ou erro de build), usa as chaves reais como fallback de segurança
const url = import.meta.env.VITE_SUPABASE_URL || 'https://okfaruagbfqbekrxglas.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_b5_btmnr2U69UArBovbH_A_NZayEpXH';

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(url, anonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true,
    // Usa o localStorage para manter o usuário logado mesmo se ele fechar a aba
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
