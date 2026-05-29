/**
 * Script untuk seed user demo ke Supabase
 * Jalankan sekali: node scripts/seed-users.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTables() {
    console.log('[Seed] Membuat tabel di Supabase...');

    // Create tables via SQL (using Supabase REST RPC or direct)
    // Since we can't run raw SQL via supabase-js easily, we'll use the insert approach
    // Tables should be created via Supabase SQL Editor. This script only seeds data.

    console.log('[Seed] CATATAN: Pastikan tabel sudah dibuat via Supabase SQL Editor!');
    console.log('[Seed] SQL yang perlu dijalankan:');
    console.log(`
-- 1. Tabel Telemetri Cold-Chain
CREATE TABLE IF NOT EXISTS telemetry_coldchain (
    id BIGSERIAL PRIMARY KEY,
    sensor_id TEXT NOT NULL DEFAULT 'TEMP_GUDANG_A',
    temperature NUMERIC(5,2) NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry_coldchain(created_at DESC);

-- 2. Tabel Inspeksi QC
CREATE TABLE IF NOT EXISTS qc_inspections (
    id BIGSERIAL PRIMARY KEY,
    lot_id TEXT NOT NULL,
    material_type TEXT NOT NULL,
    ai_score NUMERIC(5,2) NOT NULL,
    decision TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qc_created_at ON qc_inspections(created_at DESC);

-- 3. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('plant_manager', 'qc_inspector')),
    display_name TEXT NOT NULL
);
    `);
}

async function seedUsers() {
    console.log('\n[Seed] Hashing passwords...');

    const adminHash = await bcrypt.hash('admin123', 10);
    const inspectorHash = await bcrypt.hash('inspector123', 10);

    const users = [
        {
            username: 'admin',
            password_hash: adminHash,
            role: 'plant_manager',
            display_name: 'Pak Budi - Plant Manager'
        },
        {
            username: 'inspector',
            password_hash: inspectorHash,
            role: 'qc_inspector',
            display_name: 'Ibu Sari - QC Inspector'
        }
    ];

    console.log('[Seed] Inserting users...');

    // Hapus data lama jika ada
    await supabase.from('users').delete().neq('id', 0);

    const { data, error } = await supabase.from('users').insert(users).select();

    if (error) {
        console.error('[Seed] ERROR:', error.message);
        console.error('[Seed] Pastikan tabel "users" sudah dibuat di Supabase SQL Editor!');
        process.exit(1);
    }

    console.log('[Seed] ✓ Users berhasil di-seed:');
    data.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) → ${u.display_name}`);
    });
    console.log('\n[Seed] Kredensial demo:');
    console.log('  admin / admin123 → Plant Manager (Full Access)');
    console.log('  inspector / inspector123 → QC Inspector (QC Tab Only)');
}

async function main() {
    await createTables();
    await seedUsers();
    console.log('\n[Seed] Selesai! ✓');
    process.exit(0);
}

main().catch(err => {
    console.error('[Seed] Fatal error:', err);
    process.exit(1);
});
