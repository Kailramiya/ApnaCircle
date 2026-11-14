import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useFocusEffect, useRouter } from 'expo-router';
import { usePreventRemove, useNavigation } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import { randomUUID } from 'expo-crypto';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { AppText, Button, Chips, Field, Notice, Screen, styles } from '@/components/ui';
import { useI18n } from '@/store/preferences';
import { useAuth } from '@/providers';
import { categories, localities, localityKeys, postInput, type PostInput } from '@/lib/models';
import { choosePhoto, type PreparedPhoto } from '@/services/media';
import { createPost, type PostSubmission } from '@/services/posts';
import { captureAccount, isCurrentAccount } from '@/lib/account';
import { errorKey } from '@/lib/errors';
import type { MessageKey } from '@/lib/translations';
import { radius, space } from '@/theme';

export default function ComposerScreen() {
  const { t, number } = useI18n();
  const { profile } = useAuth();
  const client = useQueryClient();
  const router = useRouter();
  const navigation = useNavigation();
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [picking, setPicking] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState<MessageKey>();
  const submission = useRef<PostSubmission | null>(null);
  const inFlight = useRef(false);
  const { control, handleSubmit, watch, setValue, reset, setError, formState: { isSubmitting, errors } } = useForm<PostInput>({
    defaultValues: { description: '', category: 'general', locality: profile?.locality ?? 'Mansarovar' },
  });
  const description = watch('description');
  const dirty = Boolean(description.trim() || photo || locked);
  useEffect(() => { if (!dirty && profile) setValue('locality', profile.locality); }, [dirty, profile, setValue]);
  function clearDraft() { submission.current = null; setPhoto(null); setLocked(false); reset(); setMessage(undefined); }
  const confirmLeave = useCallback((leave: () => void) => {
    if (inFlight.current) return;
    Alert.alert(t('discardTitle'), t(locked ? 'publishUncertain' : 'discardBody'), [
      { text: t('keepEditing'), style: 'cancel' },
      { text: t('discard'), style: 'destructive', onPress: () => { submission.current = null; setPhoto(null); setLocked(false); reset(); setMessage(undefined); leave(); } },
    ]);
  }, [locked, reset, t]);
  usePreventRemove(dirty, ({ data }) => confirmLeave(() => navigation.dispatch(data.action)));
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!dirty) return false;
      confirmLeave(() => router.navigate('/(app)/(tabs)/home'));
      return true;
    });
    return () => subscription.remove();
  }, [dirty, confirmLeave, router]));
  async function pick() {
    const account = captureAccount();
    setPicking(true); setMessage(undefined);
    try { const next = await choosePhoto(); if (next && isCurrentAccount(account)) setPhoto(next); }
    catch (error) { if (isCurrentAccount(account)) setMessage(errorKey(error)); }
    finally { if (isCurrentAccount(account)) setPicking(false); }
  }
  const submit = handleSubmit(async (values) => {
    if (inFlight.current || !profile) return;
    const parsed = postInput.safeParse(values);
    if (!parsed.success) { setError('description', { message: 'invalidPost' }); return; }
    const account = captureAccount();
    submission.current ??= { id: randomUUID(), ownerId: account.id, values: parsed.data, photo };
    setLocked(true); setMessage(undefined); inFlight.current = true;
    try {
      const result = await createPost(submission.current);
      if (!isCurrentAccount(account)) return;
      clearDraft();
      void client.invalidateQueries({ queryKey: [account.id, 'posts'] });
      router.push({ pathname: '/posts/[id]', params: { id: result.id } });
    } catch { if (isCurrentAccount(account)) setMessage('publishUncertain'); }
    finally { inFlight.current = false; }
  });
  return <Screen><Stack.Screen options={{ title: t('create') }} />
    <AppText variant="title">{t('writePost')}</AppText>
    <Controller control={control} name="description" render={({ field }) => <Field label={t('post')} placeholder={t('postHint')} multiline maxLength={2000} value={field.value} onChangeText={field.onChange} editable={!locked} error={errors.description ? t('invalidPost') : undefined} style={{ minHeight: 180 }} />} />
    <AppText variant="small">{t('characterCount', { count: number(description.length), max: number(2000) })}</AppText>
    <AppText variant="heading">{t('category')}</AppText>
    {locked ? (
      <AppText>{t(watch('category'))}</AppText>
    ) : (
      <Chips
        value={watch('category')}
        onChange={(value) => setValue('category', value)}
        options={categories.map((value) => ({ value, label: t(value) }))}
      />
    )}
    <AppText variant="heading">{t('locality')}</AppText><Chips value={watch('locality')} disabled={locked} onChange={(value) => setValue('locality', value)} options={localities.map((value) => ({ value, label: t(localityKeys[value]) }))} />
    {photo ? <View style={{ gap: space.sm }}><Image source={photo.uri} style={{ width: '100%', aspectRatio: photo.width / photo.height, maxHeight: 360, borderRadius: radius.md }} contentFit="contain" accessibilityLabel={t('photo')} /><Button title={t('removePhoto')} variant="ghost" disabled={locked} onPress={() => setPhoto(null)} /></View> : null}
    <Button title={t(photo ? 'changePhoto' : 'addPhoto')} variant="secondary" loading={picking} disabled={locked || isSubmitting} onPress={() => { void pick(); }} />
    {locked ? <Notice message={t('draftLocked')} /> : null}{message ? <Notice message={t(message)} error /> : null}
    <View style={styles.section}><Button title={t(locked ? 'retry' : 'publish')} loading={isSubmitting} disabled={picking} onPress={() => { void submit(); }} />
      {dirty ? <Button title={t('discard')} variant="ghost" disabled={isSubmitting || picking} onPress={() => confirmLeave(() => undefined)} /> : null}</View>
  </Screen>;
}
