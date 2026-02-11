// OAuth Callback Handler - Required for web authentication
import { AuthCallbackPage } from '@fastshot/auth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function AuthCallback() {
  const router = useRouter();

  return (
    <AuthCallbackPage
      supabaseClient={supabase}
      onSuccess={() => router.replace('/(tabs)')}
      onError={(error) => {
        console.error('Auth callback error:', error);
        router.replace(`/auth?error=${encodeURIComponent(error.message)}`);
      }}
      loadingText="Completing sign in..."
    />
  );
}
