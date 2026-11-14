import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { EmptyState, Loading, Notice, Screen } from '@/components/ui';
import { JobCard } from '@/components/job-card';
import { useJob } from '@/hooks/jobs';
import { useI18n } from '@/store/preferences';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const query = useJob(id);
  return <Screen><Stack.Screen options={{ title: t('jobDetail') }} />{query.isPending ? <Loading /> : query.data ? <JobCard job={query.data} detail /> : query.isError ? <Notice error message={t('networkError')} onRetry={() => { void query.refetch(); }} /> : <EmptyState title={t('unavailable')} />}</Screen>;
}
