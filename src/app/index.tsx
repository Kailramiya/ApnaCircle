import { Redirect } from 'expo-router';
import { useAuth } from '@/providers';

export default function Index() {
  const { session, profile, recovery } = useAuth();
  return <Redirect href={!session ? '/login' : recovery ? '/reset-password' : !profile ? '/onboarding' : '/(app)'} />;
}
