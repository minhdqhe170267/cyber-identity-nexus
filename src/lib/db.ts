import { supabase } from '@/integrations/supabase/client';

// Helper to bypass generated types for tables created via migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (table: string) => supabase.from(table as any);
