import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Função nativa para ler o arquivo .env sem precisar do pacote dotenv
function loadEnv() {
  try {
    const envText = fs.readFileSync('.env', 'utf8');
    const urlMatch = envText.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
    const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);
    
    return {
      url: urlMatch ? urlMatch[1].trim().replace(/['"]/g, '') : null,
      key: keyMatch ? keyMatch[1].trim().replace(/['"]/g, '') : null
    };
  } catch (e) {
    console.error('Não foi possível ler o arquivo .env.');
    return { url: null, key: null };
  }
}

const { url, key } = loadEnv();

if (!url || !key) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no arquivo .env.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  try {
    console.log('Verificando conexão com o banco de dados do Supabase...');
    
    // Tenta uma operação simples para testar as credenciais
    const { error: insertError } = await supabase
      .from('app_state')
      .insert([{ id: 'default', state: {} }]);

    if (insertError && insertError.message.includes('not found')) {
      console.error('❌ Erro: A tabela "app_state" ainda não existe no seu Supabase.');
      console.log('👉 Como o terminal do Bolt é limitado para rodar migrações pesadas, acesse o painel do seu Supabase na web, vá no "SQL Editor" e cole o conteúdo do arquivo "supabase/schema.sql" lá dentro.');
    } else if (insertError && insertError.message.includes('duplicate key')) {
      console.log('✅ Conexão com o Supabase validada com sucesso! A tabela já está ativa.');
    } else if (insertError) {
      console.error('Erro na conexão:', insertError.message);
    } else {
      console.log('🚀 Banco de dados real sincronizado e inicializado com sucesso!');
    }
  } catch (err) {
    console.error('Erro ao executar o script:', err.message);
  }
}
run();
