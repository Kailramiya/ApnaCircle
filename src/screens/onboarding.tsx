import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Stack } from 'expo-router/stack';
import { useQueryClient } from '@tanstack/react-query';
import { AppText, Button, Chips, Field, Notice, Screen } from '@/components/ui';
import { localities, localityKeys, profileInput, type ProfileInput } from '@/lib/models';
import { errorKey, validationKey } from '@/lib/errors';
import { captureAccount, isCurrentAccount } from '@/lib/account';
import { useI18n, usePreferences } from '@/store/preferences';
import { saveProfile } from '@/services/profile';
import { signOut } from '@/services/auth';
import type { MessageKey } from '@/lib/translations';

export default function OnboardingScreen() {
  const { t, language } = useI18n();
  const client = useQueryClient();
  const [error, setErrorMessage] = useState<MessageKey>();
  const { control, handleSubmit, setError, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProfileInput>({
    defaultValues: { full_name: '', username: '', bio: '', locality: 'Mansarovar', preferred_language: language },
  });
  const submit = handleSubmit(async (values) => {
    const parsed = profileInput.safeParse({ ...values, preferred_language: language });
    if (!parsed.success) { for (const issue of parsed.error.issues) setError(issue.path[0] as keyof ProfileInput, { message: issue.message }); return; }
    const account = captureAccount();
    setErrorMessage(undefined);
    try { const profile = await saveProfile(parsed.data, true); if (isCurrentAccount(account)) client.setQueryData([account.id, 'profile'], profile); }
    catch (error) { if (isCurrentAccount(account)) setErrorMessage(errorKey(error)); }
  });
  return <Screen><Stack.Screen options={{ title: t('onboarding'), headerBackVisible: false }} />
    <AppText>{t('onboardingBody')}</AppText>
    {(['full_name', 'username'] as const).map((name) => <Controller key={name} name={name} control={control} render={({ field }) => <Field label={t(name === 'full_name' ? 'fullName' : 'username')} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoCapitalize={name === 'username' ? 'none' : 'words'} maxLength={name === 'username' ? 24 : 60} error={errors[name] ? t(validationKey(errors[name]?.message) ?? 'required') : undefined} />} />)}
    <AppText variant="heading">{t('language')}</AppText><Chips value={language} onChange={usePreferences.getState().setLanguage} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }]} />
    <AppText variant="heading">{t('jaipur')} · {t('locality')}</AppText>
    <Chips value={watch('locality')} onChange={(value) => setValue('locality', value)} options={localities.map((value) => ({ value, label: t(localityKeys[value]) }))} />
    {error ? <Notice message={t(error)} error /> : null}<Button title={t('continue')} loading={isSubmitting} onPress={() => { void submit(); }} />
    <Button title={t('signOut')} variant="ghost" disabled={isSubmitting} onPress={() => { void signOut().catch(() => setErrorMessage('networkError')); }} />
  </Screen>;
}
