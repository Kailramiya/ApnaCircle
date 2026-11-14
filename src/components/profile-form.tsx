import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Stack } from 'expo-router/stack';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { AppText, Button, Chips, Field, Notice, Screen } from './ui';
import { Avatar } from './avatar';
import { localities, localityKeys, profileInput, type ProfileInput, type Profile } from '@/lib/models';
import { errorKey, validationKey } from '@/lib/errors';
import { captureAccount, isCurrentAccount } from '@/lib/account';
import { useI18n, usePreferences } from '@/store/preferences';
import { saveProfile } from '@/services/profile';
import { choosePhoto, uploadPhoto, type PreparedPhoto } from '@/services/media';
import { signOut } from '@/services/auth';
import type { MessageKey } from '@/lib/translations';
import { radius } from '@/theme';

export function ProfileForm({ profile }: { profile?: Profile }) {
  const { t, language } = useI18n();
  const client = useQueryClient();
  const router = useRouter();
  const [error, setErrorMessage] = useState<MessageKey>();
  const [photo, setPhoto] = useState<{ image: PreparedPhoto; path: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const { control, handleSubmit, setError, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProfileInput>({
    defaultValues: profile ?? { full_name: '', username: '', bio: '', locality: 'Mansarovar', preferred_language: language },
  });
  async function pick() {
    const account = captureAccount();
    setPicking(true);
    try {
      const image = await choosePhoto(640);
      if (image && isCurrentAccount(account)) setPhoto({ image, path: `${account.id}/${randomUUID()}/image.jpg` });
    } catch (error) { if (isCurrentAccount(account)) setErrorMessage(errorKey(error)); }
    finally { if (isCurrentAccount(account)) setPicking(false); }
  }
  const submit = handleSubmit(async (values) => {
    const parsed = profileInput.safeParse(values);
    if (!parsed.success) { for (const issue of parsed.error.issues) setError(issue.path[0] as keyof ProfileInput, { message: issue.message }); return; }
    const account = captureAccount();
    setErrorMessage(undefined);
    try {
      if (photo) await uploadPhoto('profile-images', photo.path, photo.image);
      if (!isCurrentAccount(account)) return;
      const next = await saveProfile(parsed.data, !profile, photo?.path);
      if (!isCurrentAccount(account)) return;
      client.setQueryData([account.id, 'profile'], next);
      usePreferences.getState().setLanguage(next.preferred_language);
      void client.invalidateQueries({ queryKey: [account.id, 'posts'] });
      void client.invalidateQueries({ queryKey: [account.id, 'post'] });
      void client.invalidateQueries({ queryKey: [account.id, 'comments'] });
      if (profile) router.back();
    } catch (error) { if (isCurrentAccount(account)) setErrorMessage(errorKey(error)); }
  });
  return <Screen><Stack.Screen options={{ title: t(profile ? 'editProfile' : 'onboarding'), headerBackVisible: Boolean(profile) }} />
    <AppText>{t(profile ? 'profilePrivacy' : 'onboardingBody')}</AppText>
    {profile ? <>{photo ? <Image source={photo.image.uri} style={{ width: 88, height: 88, borderRadius: radius.pill }} accessibilityLabel={t('avatar')} /> : <Avatar name={profile.full_name} path={profile.avatar_path} size={88} />}<Button title={t('changeAvatar')} variant="secondary" loading={picking} disabled={isSubmitting} onPress={() => { void pick(); }} /></> : null}
    {(['full_name', 'username', 'bio'] as const).map((name) => <Controller key={name} name={name} control={control} render={({ field }) => <Field label={t(name === 'full_name' ? 'fullName' : name)} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoCapitalize={name === 'username' ? 'none' : 'sentences'} multiline={name === 'bio'} maxLength={name === 'username' ? 24 : name === 'bio' ? 180 : 60} editable={!isSubmitting} error={errors[name] ? t(validationKey(errors[name]?.message) ?? 'required') : undefined} />} />)}
    <AppText variant="heading">{t('language')}</AppText><Chips value={watch('preferred_language')} onChange={(value) => { setValue('preferred_language', value); if (!profile) usePreferences.getState().setLanguage(value); }} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }]} />
    <AppText variant="heading">{t('jaipur')} · {t('locality')}</AppText><Chips value={watch('locality')} onChange={(value) => setValue('locality', value)} options={localities.map((value) => ({ value, label: t(localityKeys[value]) }))} />
    {error ? <Notice message={t(error)} error /> : null}<Button title={t(profile ? 'saveChanges' : 'continue')} loading={isSubmitting} disabled={picking} onPress={() => { void submit(); }} />
    {!profile ? <Button title={t('signOut')} variant="ghost" disabled={isSubmitting} onPress={() => { void signOut().catch(() => setErrorMessage('networkError')); }} /> : null}
  </Screen>;
}
