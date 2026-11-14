import { useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router/stack';
import { useRouter } from 'expo-router';
import { AppText, Button, Chips, Field, IconButton, Screen, styles } from '@/components/ui';
import { PagedList } from '@/components/paged-list';
import { JobCard } from '@/components/job-card';
import { useJobs } from '@/hooks/jobs';
import { useI18n } from '@/store/preferences';
import { employmentTypes, localities, localityKeys, type Job } from '@/lib/models';

export default function JobsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<Job['employment_type'] | ''>('');
  const [locality, setLocality] = useState<Job['locality'] | ''>('');
  const query = useJobs({ search, type: type || undefined, locality: locality || undefined });
  const header = <View style={styles.section}><AppText variant="title">{t('jobsIntro')}</AppText>
    <Field label={t('search')} placeholder={t('searchJobs')} value={searchText} maxLength={100} onChangeText={(value) => { setSearchText(value); if (!value) setSearch(''); }} onSubmitEditing={() => setSearch(searchText.trim())} returnKeyType="search" />
    <Button title={t('search')} onPress={() => setSearch(searchText.trim())} variant="secondary" />
    <Chips value={type} onChange={setType} options={[{ value: '', label: t('all') }, ...employmentTypes.map((value) => ({ value, label: t(value) }))]} />
    <Chips value={locality} onChange={setLocality} options={[{ value: '', label: t('allLocalities') }, ...localities.map((value) => ({ value, label: t(localityKeys[value]) }))]} />
  </View>;
  return <Screen scroll={false}><Stack.Screen options={{ title: t('jobs'), headerRight: () => <IconButton label={t('applications')} name={{ ios: 'doc.text', android: 'description' }} onPress={() => router.push('/applications')} /> }} />
    <PagedList query={query} renderItem={(job) => <JobCard job={job} />} header={header} emptyTitle={t('noJobs')} emptyBody={t('noJobsBody')} /></Screen>;
}
