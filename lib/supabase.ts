import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('--- SUPABASE ENV CHECK ---');
console.log('NEXT_PUBLIC_SUPABASE_URL:', `"${supabaseUrl}"`);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', `"${supabaseKey}"`);
console.log('--------------------------');

// Use placeholder if missing to avoid crashing immediately before we see the logs
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);
