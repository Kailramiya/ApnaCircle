import { memo } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, IconButton, Notice, styles } from './ui';
import { colors, radius, space } from '@/theme';
import { localityKeys, type Job } from '@/lib/models';
import { useI18n } from '@/store/preferences';
import { useJobActions } from '@/hooks/jobs';

export const JobCard = memo(function JobCard({ job, detail = false }: { job: Job; detail?: boolean }) {
  const { t, money, date } = useI18n();
  const router = useRouter();
  const { save, apply, toggleSave } = useJobActions(job);
  const salary = job.salary_min !== null ? t('salaryMonth', { amount: job.salary_max !== null && job.salary_max !== job.salary_min ? `${money(job.salary_min)} – ${money(job.salary_max)}` : money(job.salary_min) }) : t('salaryUnknown');
  return <View style={{ backgroundColor: colors.surface, padding: space.lg, borderRadius: radius.md, borderCurve: 'continuous', gap: space.lg }}>
    <View style={[styles.row, { flexWrap: 'nowrap', alignItems: 'flex-start' }]}><View style={{ width: 48, height: 48, backgroundColor: colors.warm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' }}><AppText variant="heading" style={{ color: colors.warmText }}>{Array.from(job.company_name)[0]}</AppText></View>
      <View style={{ flex: 1 }}><AppText variant="label" style={{ color: colors.muted }}>{job.company_name}</AppText><AppText variant="small">{t(localityKeys[job.locality])}, {t('jaipur')}</AppText></View>
      <IconButton label={t(job.saved ? 'unsaveJob' : 'saveJob')} name={{ ios: job.saved ? 'bookmark.fill' : 'bookmark', android: job.saved ? 'bookmark' : 'bookmark_border' }} selected={job.saved} disabled={save.isPending} onPress={toggleSave} />
    </View>
    <Pressable disabled={detail} accessibilityRole={detail ? undefined : 'button'} onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: job.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, gap: space.sm })}>
      <AppText variant="title">{job.title}</AppText><AppText variant="label" style={{ color: colors.success }}>{salary}</AppText>
      <View style={styles.row}><AppText variant="small">{t(job.employment_type)}</AppText>{job.is_demo ? <AppText variant="small" style={{ color: colors.warmText }}>{t('demo')}</AppText> : null}</View>
    </Pressable>
    {job.application_created_at ? <AppText variant="label" style={{ color: colors.success }}>{t('submitted')} · {date(job.application_created_at)}</AppText> : null}
    {detail ? <><View style={styles.divider} /><AppText variant="heading">{t('aboutJob')}</AppText><AppText selectable>{job.description}</AppText><Notice message={t('applicationNotice')} />
      <Button title={t(job.applied || apply.isSuccess ? 'applied' : 'apply')} disabled={job.applied || apply.isSuccess} loading={apply.isPending} onPress={() => Alert.alert(t('applyTitle'), t('applyBody'), [{ text: t('cancel'), style: 'cancel' }, { text: t('apply'), onPress: () => apply.mutate() }])} /></> : null}
    {save.isError || apply.isError ? <Notice error message={t('networkError')} /> : null}
  </View>;
});
