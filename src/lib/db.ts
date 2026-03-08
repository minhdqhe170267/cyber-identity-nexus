import { supabase } from '@/integrations/supabase/client';

// Helper to bypass generated types for tables created via migration
// The generated types will be updated after the next sync
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (table: string): any => supabase.from(table as any);
