import { API_BASE_URL } from '@/config';
import { HTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

export function UserAuthForm({ className }: UserAuthFormProps) {
  return (
    <Button className={`mt-2 ${className}`} asChild>
      <a href={`${API_BASE_URL}/auth/google?redirect=/dash`}>
        Continue with Google
      </a>
    </Button>
  );
}