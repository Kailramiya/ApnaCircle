import { useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Stack } from 'expo-router/stack';
import { z } from 'zod';
import { AppText, Button, Chips, Field, Notice, Screen, styles } from '@/components/ui';
import { useI18n, usePreferences } from '@/store/preferences';
import { credentialsSchema, type Credentials } from '@/lib/models';
import { authErrorKey, validationKey } from '@/lib/errors';
import { authenticate, requestPasswordReset } from '@/services/auth';
import type { MessageKey } from '@/lib/translations';
import { colors, space } from '@/theme';

export default function LoginScreen() {
  const { t, language } = useI18n();
  const [register, setRegister] = useState(false);
  const [message, setMessage] = useState<MessageKey>();
  const [failed, setFailed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { control, handleSubmit, setError, getValues, formState: { errors, isSubmitting } } = useForm<Credentials>({ defaultValues: { email: '', password: '' } });
  const submit = handleSubmit(async (values) => {
    setMessage(undefined);
    const parsed = credentialsSchema.safeParse(values);
    if (!parsed.success) { for (const issue of parsed.error.issues) setError(issue.path[0] as keyof Credentials, { message: issue.message }); return; }
    try {
      const result = await authenticate(parsed.data, register);
      if (!result.session) { setFailed(false); setMessage('checkEmailBody'); }
    } catch (error) { setFailed(true); setMessage(authErrorKey(error, register ? 'signUpFailed' : 'authFailed')); }
  });
  async function reset() {
    const email = getValues('email').trim();
    if (!z.email().safeParse(email).success) { setError('email', { message: 'invalidEmail' }); return; }
    setResetting(true);
    try { await requestPasswordReset(email); setFailed(false); setMessage('resetSent'); }
    catch (error) { setFailed(true); setMessage(authErrorKey(error, 'networkError')); }
    finally { setResetting(false); }
  }
  return <Screen><Stack.Screen options={{ title: t('appName'), headerBackVisible: false }} />
    <View style={{ gap: space.lg, paddingVertical: space.xl }}><AppText variant="label" style={{ color: colors.primary }}>{t('tagline')}</AppText>
      <AppText variant="hero">{t('welcome')}</AppText><AppText style={{ color: colors.muted }}>{t('welcomeBody')}</AppText></View>
    <Chips value={language} onChange={usePreferences.getState().setLanguage} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }]} />
    <View style={styles.section}>
      <Controller control={control} name="email" render={({ field }) => <Field label={t('email')} placeholder={t('emailHint')} autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.email ? t(validationKey(errors.email.message) ?? 'invalidEmail') : undefined} />} />
      <Controller control={control} name="password" render={({ field }) => <Field label={t('password')} placeholder={t('passwordHint')} secureTextEntry autoComplete={register ? 'new-password' : 'current-password'} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.password ? t(validationKey(errors.password.message) ?? 'invalidPassword') : undefined} />} />
      {message ? <Notice message={t(message)} error={failed} /> : null}
      <Button title={t(register ? 'signUp' : 'signIn')} loading={isSubmitting} disabled={resetting} onPress={() => { void submit(); }} />
      {!register ? <Button title={t('forgotPassword')} variant="ghost" loading={resetting} disabled={isSubmitting} onPress={() => { void reset(); }} /> : null}
      <Button title={t(register ? 'haveAccount' : 'newAccount')} variant="secondary" disabled={isSubmitting || resetting} onPress={() => { setRegister(!register); setMessage(undefined); }} />
    </View><AppText variant="small" style={{ color: colors.muted }}>{t('demoNotice')}</AppText>
  </Screen>;
}
