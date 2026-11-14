import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { nextCursor, type Cursor } from '@/lib/pagination';
import { applyToJob, getJobs, setJobSaved, type JobFilters } from '@/services/jobs';
import { assertCurrentAccount, captureAccount, isCurrentAccount } from '@/lib/account';
import type { Job } from '@/lib/models';

export function useJobs(filters: JobFilters) {
  const { session } = useAuth();
  return useInfiniteQuery({ queryKey: [session?.user.id, 'jobs', filters], queryFn: ({ pageParam, signal }) => getJobs(filters, pageParam, signal), initialPageParam: null as Cursor | null, getNextPageParam: nextCursor, enabled: Boolean(session) });
}
export function useJob(id: string) {
  const { session } = useAuth();
  return useQuery({ queryKey: [session?.user.id, 'job', id], queryFn: async ({ signal }) => (await getJobs({ jobId: id }, null, signal))[0] ?? null, enabled: Boolean(session) });
}
export function useJobActions(job: Job) {
  const client = useQueryClient();
  const account = captureAccount();
  const key = [account.id, 'job-save', job.id];
  function patch(saved: boolean) {
    client.setQueriesData<InfiniteData<Job[]>>({ queryKey: [account.id, 'jobs'] }, (old) => old ? { ...old, pages: old.pages.map((page) => page.map((item) => item.id === job.id ? { ...item, saved } : item)) } : old);
    client.setQueryData<Job | null>([account.id, 'job', job.id], (old) => old ? { ...old, saved } : old);
  }
  function refresh() {
    if (!isCurrentAccount(account)) return;
    void client.invalidateQueries({ queryKey: [account.id, 'jobs'] });
    void client.invalidateQueries({ queryKey: [account.id, 'job', job.id] });
  }
  const save = useMutation({ mutationKey: key, mutationFn: (saved: boolean) => { assertCurrentAccount(account); return setJobSaved(job.id, saved); },
    onMutate: async (saved) => {
      await Promise.all([client.cancelQueries({ queryKey: [account.id, 'jobs'] }), client.cancelQueries({ queryKey: [account.id, 'job', job.id] })]);
      if (!isCurrentAccount(account)) return;
      patch(saved); return { previous: job.saved };
    },
    onError: (_error, _saved, context) => { if (context && isCurrentAccount(account)) patch(context.previous); }, onSettled: refresh,
  });
  const apply = useMutation({ mutationKey: [account.id, 'job-apply', job.id], mutationFn: () => { assertCurrentAccount(account); return applyToJob(job.id); }, onSettled: refresh });
  return { save, apply, toggleSave: () => { if (client.isMutating({ mutationKey: key }) === 0) save.mutate(!job.saved); } };
}
