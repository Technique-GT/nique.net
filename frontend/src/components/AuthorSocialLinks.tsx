import React from 'react';
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Globe, 
  Instagram, 
  Youtube, 
  Facebook,
  LucideIcon 
} from 'lucide-react';

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

interface AuthorSocialLinksProps {
  socials?: SocialLinks;
  className?: string;
}

const SOCIAL_PLATFORMS: Record<string, { icon: LucideIcon; label: string }> = {
  twitter: { icon: Twitter, label: 'Twitter' },
  x: { icon: Twitter, label: 'X (Twitter)' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
  github: { icon: Github, label: 'GitHub' },
  website: { icon: Globe, label: 'Website' },
  instagram: { icon: Instagram, label: 'Instagram' },
  youtube: { icon: Youtube, label: 'YouTube' },
  facebook: { icon: Facebook, label: 'Facebook' },
};

export const AuthorSocialLinks: React.FC<AuthorSocialLinksProps> = ({ socials, className = '' }) => {
  if (!socials) return null;

  const activeSocials = Object.entries(socials).filter(
    ([, url]) => typeof url === 'string' && url.trim().length > 0
  );

  if (activeSocials.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {activeSocials.map(([platform, url]) => {
        const platformKey = platform.toLowerCase();
        const config = SOCIAL_PLATFORMS[platformKey] || { icon: Globe, label: platform };
        const Icon = config.icon;

        const formattedUrl = url!.startsWith('http') ? url! : `https://${url!}`;

        return (
          <a
            key={platform}
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${config.label} profile`}
            className="inline-flex items-center justify-center p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Icon className="w-5 h-5" />
          </a>
        );
      })}
    </div>
  );
};