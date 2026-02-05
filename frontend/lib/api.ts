// lib/api.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Upload files metadata to backend
export async function ingestFiles(fileIds: string[]) {
  const response = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_ids: fileIds }),
  });
  return response.json();
}

// Check status of ingestion/batch
export async function getStatus(batchId: string) {
  const response = await fetch(`/api/status?batch_id=${batchId}`);
  return response.json();
}

// sendMessage now accepts selectedFiles
export async function sendMessage(message: string, fileIds: string[] = []) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, file_ids: fileIds }),
  });
  return response.json(); // expected: { reply: string, citations: [] }
}

