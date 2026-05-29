/**
 * AromeTrack - Database Setup Script
 * Membuat semua tabel di Supabase via /pg/query endpoint
 * Jalankan: node scripts/setup-database.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL.replace('/rest/v1', '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql, label) {
    console.log(`[DB] ${label}...`);
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ query: sql })
    });

    const status = response.status;
    const text = await response.text();
    
    if (status === 200) {
        console.log(`  ✓ ${label} berhasil`);
        return true;
    } else {
        // Check if it's "already exists" error (which is fine)
        if (text.includes('already exists')) {
            console.log(`  ✓ ${label} (sudah ada, skip)`);
            return true;
        }
        console.error(`  ✗ ${label} gagal (${status}): ${text}`);
        return false;
    }
}

async function main() {
    console.log('========================================');
    console.log(' AromeTrack - Database Setup');
    console.log(' Cyberhack 2026');
    console.log('========================================\n');

    // 1. Create telemetry_coldchain table
    await runSQL(`
        CREATE TABLE IF NOT EXISTS telemetry_coldchain (
            id BIGSERIAL PRIMARY KEY,
            sensor_id TEXT NOT NULL DEFAULT 'TEMP_GUDANG_A',
            temperature NUMERIC(5,2) NOT NULL,
            is_anomaly BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `, 'Tabel telemetry_coldchain');

    await runSQL(`
        CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry_coldchain(created_at DESC)
    `, 'Index telemetry_coldchain');

    // 2. Create qc_inspections table
    await runSQL(`
        CREATE TABLE IF NOT EXISTS qc_inspections (
            id BIGSERIAL PRIMARY KEY,
            lot_id TEXT NOT NULL,
            material_type TEXT NOT NULL,
            ai_score NUMERIC(5,2) NOT NULL,
            decision TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `, 'Tabel qc_inspections');

    await runSQL(`
        CREATE INDEX IF NOT EXISTS idx_qc_created_at ON qc_inspections(created_at DESC)
    `, 'Index qc_inspections');

    // 3. Create users table
    await runSQL(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            display_name TEXT NOT NULL
        )
    `, 'Tabel users');

    // 4. Enable RLS and create policies
    await runSQL(`ALTER TABLE telemetry_coldchain ENABLE ROW LEVEL SECURITY`, 'RLS telemetry');
    await runSQL(`ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY`, 'RLS qc_inspections');
    await runSQL(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`, 'RLS users');

    // Create permissive policies for service_role
    await runSQL(`
        CREATE POLICY IF NOT EXISTS "allow_all_telemetry" ON telemetry_coldchain FOR ALL USING (true) WITH CHECK (true)
    `, 'Policy telemetry');
    
    await runSQL(`
        CREATE POLICY IF NOT EXISTS "allow_all_qc" ON qc_inspections FOR ALL USING (true) WITH CHECK (true)
    `, 'Policy qc_inspections');
    
    await runSQL(`
        CREATE POLICY IF NOT EXISTS "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true)
    `, 'Policy users');

    console.log('\n========================================');
    console.log(' ✓ Setup Database Selesai!');
    console.log('========================================');
    console.log('\nLangkah selanjutnya: node scripts/seed-users.js');
}

main().catch(err => {
    console.error('[DB] Fatal error:', err);
    process.exit(1);
});
