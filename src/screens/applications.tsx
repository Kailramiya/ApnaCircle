import { Stack } from 'expo-router/stack';
import { Screen } from '@/components/ui';
import { PagedList } from '@/components/paged-list';
import { JobCard } from '@/components/job-card';
import { useJobs } from '@/hooks/jobs';
import { useI18n } from '@/store/preferences';

export default function ApplicationsScreen() {
  const { t } = useI18n();
  const query = useJobs({ applied: true });
  return <Screen scroll={false}><Stack.Screen options={{ title: t('applications') }} /><PagedList query={query} renderItem={(job) => <JobCard job={job} />} emptyTitle={t('noApplications')} emptyBody={t('noApplicationsBody')} /></Screen>;
}
