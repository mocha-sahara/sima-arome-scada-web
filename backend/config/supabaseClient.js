const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] ERROR: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diatur di .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
