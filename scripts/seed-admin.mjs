import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv'; // Load environment variables from .env file
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.');
process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function seedAdmin() {
const username = 'admin'; // <-- Mude para 'GDSSOUZ5' se desejar
const password = 'adminpassword'; // <-- Mude para '902512' se desejar
const fullName = 'Super Admin'; // <-- Opcional: Mude o nome completo

try {
  // Check if admin already exists
  const { data: existingAdmin, error: fetchError } = await supabase
    .from('administrators')
    .select('id')
    .eq('username', username)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error checking existing admin:', fetchError.message);
    return;
  }

  if (existingAdmin) {
    console.log(`Admin user '${username}' already exists. Skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase.from('administrators').insert([
    {
      full_name: fullName,
      username: username,
      password_hash: passwordHash,
      can_create_collaborator: true,
      can_create_admin: true,
      can_enter_hours: true,
      can_change_access_code: true,
    },
  ]);

  if (error) {
    console.error('Error seeding admin:', error.message);
  } else {
    console.log('Admin user seeded successfully:', data);
  }
} catch (error) {
  console.error('Unexpected error during admin seeding:', error);
}
}

seedAdmin();
