import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { jobSchema, type Job } from '@/lib/models';
import { PAGE_SIZE, type Cursor } from '@/lib/pagination';
import { assertCurrentAccount, captureAccount } from '@/lib/account';

export type JobFilters = { search?: string; type?: Job['employment_type']; locality?: Job['locality']; saved?: boolean; applied?: boolean; jobId?: string };
export async function getJobs(filters: JobFilters, cursor: Cursor | null, signal: AbortSignal) {
  if (filters.jobId) z.uuid().parse(filters.jobId);
  const { data, error } = await supabase.rpc('list_jobs', {
    p_search: filters.search?.trim().slice(0, 100) ?? '', p_type: filters.type ?? null, p_locality: filters.locality ?? null,
    p_saved: filters.saved ?? false, p_applied: filters.applied ?? false, p_job_id: filters.jobId ?? null,
    p_cursor_time: cursor?.time ?? null, p_cursor_id: cursor?.id ?? null, p_limit: PAGE_SIZE,
  }).abortSignal(signal);
  if (error) throw error;
  return z.array(jobSchema).parse(data);
}
export async function setJobSaved(jobId: string, saved: boolean) {
  z.uuid().parse(jobId); z.boolean().parse(saved);
  const account = captureAccount();
  const request = saved
    ? supabase.from('saved_jobs').upsert({ job_id: jobId, user_id: account.id }, { onConflict: 'job_id,user_id', ignoreDuplicates: true })
    : supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('user_id', account.id);
  const { error } = await request;
  assertCurrentAccount(account);
  if (error) throw error;
}
export async function applyToJob(jobId: string) {
  z.uuid().parse(jobId);
  const account = captureAccount();
  const { error } = await supabase.from('job_applications').upsert({ job_id: jobId, user_id: account.id }, { onConflict: 'job_id,user_id', ignoreDuplicates: true });
  assertCurrentAccount(account);
  // Even if the response is lost, read the unique application before reporting failure.
  const result = await supabase.from('job_applications').select('id,status,created_at').eq('job_id', jobId).eq('user_id', account.id).maybeSingle();
  assertCurrentAccount(account);
  if (result.error) throw result.error;
  if (result.data) return z.object({ id: z.uuid(), status: z.literal('submitted'), created_at: z.string() }).parse(result.data);
  throw error ?? new Error('Application was not confirmed');
}
