import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Loading, Notice, Screen } from '@/components/ui';
import { useI18n } from '@/store/preferences';
import { useAuth } from '@/providers';
import { exchangeAuthCode } from '@/services/auth';

export default function AuthCallback() {
  const { code, mode } = useLocalSearchParams<{ code?: string; mode?: string }>();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);
  const { setRecovery } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (typeof code !== 'string' || !code) { setFailed(true); return; }
    if (mode === 'recovery') setRecovery(true);
    void exchangeAuthCode(code).then(() => router.replace('/')).catch(() => setFailed(true));
  }, [code, mode, router, setRecovery]);
  return <Screen>{failed ? <><Notice message={t('resetInvalid')} error /><Button title={t('back')} onPress={() => { setRecovery(false); router.replace('/'); }} /></> : <Loading />}</Screen>;
}
