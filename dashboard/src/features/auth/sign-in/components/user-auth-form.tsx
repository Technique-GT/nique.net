import { API_BASE_URL } from '@/config';
import { HTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

export function UserAuthForm({ className }: UserAuthFormProps) {
  return (
    <Button className={`mt-2 ${className}`} asChild>
      <a
        href={`${API_BASE_URL}/auth/google?redirect=${encodeURIComponent(window.location.origin + '/dash')}`}
        className="inline-flex items-center gap-2"
      >
        <img
          src="/google-color.svg"
          alt=""
          className="h-4 w-4"
          aria-hidden="true"
        />
        <span>Continue with Google</span>
      </a>
    </Button>
  );
}
