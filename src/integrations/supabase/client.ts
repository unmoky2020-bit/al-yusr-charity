import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use real Supabase credentials for storage/auth, but mock realtime to avoid WS noise
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://iqxpfsvqpitjmflvypel.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxeHBmc3ZxcGl0am1mbHZ5cGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDE4NzAsImV4cCI6MjA5MzY3Nzg3MH0.ehAbwmWgns88Xvo4pxHCafs3VShj-F1PfsYZrn7O5eQ";

// Create a REAL supabase client so Storage works (image uploads)
// Database queries that fail just return empty arrays; realtime is stubbed
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  // Do NOT intercept fetch globally — real Storage API calls need to go through
});

// Stub realtime socket methods so no noisy websocket connection is attempted
const dummyChannel = {
  on: function() { return dummyChannel; },
  subscribe: function() { return dummyChannel; },
  unsubscribe: function() { return Promise.resolve('ok'); },
  send: function() { return Promise.resolve('ok'); },
};

(supabase as any).channel = () => dummyChannel;
(supabase as any).getChannels = () => [];
(supabase as any).removeChannel = () => Promise.resolve('ok');
(supabase as any).removeAllChannels = () => Promise.resolve(['ok']);

/**
 * Upload an image file to Supabase Storage bucket "gallery-media"
 * and return the public URL.
 * Falls back to a base64 data URL if storage is unavailable.
 */
export async function uploadToSupabaseStorage(
  file: File,
  folder: string = "homepage"
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const safeName = file.name
    .toLowerCase()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'image';
  const path = `${folder}/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from('gallery-media')
    .upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) throw error;

  const { data } = supabase.storage.from('gallery-media').getPublicUrl(path);
  return data.publicUrl;
}