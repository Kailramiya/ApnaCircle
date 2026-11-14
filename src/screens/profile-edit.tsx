import { ProfileForm } from '@/components/profile-form';
import { useAuth } from '@/providers';

export default function ProfileEditScreen() {
  const { profile } = useAuth();
  return profile ? <ProfileForm profile={profile} /> : null;
}
