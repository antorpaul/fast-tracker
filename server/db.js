const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://kbwzheksafszzyxsjfjf.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('[DB] SUPABASE_ANON_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('[DB] Supabase client initialized');
console.log('[DB] Project URL:', supabaseUrl);

module.exports = {
  supabase
};
