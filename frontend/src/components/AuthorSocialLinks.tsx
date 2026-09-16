import React from 'react';
import {
  SiInstagram,
  SiLinkedin,
  SiGithub,
  SiX,
  SiYoutube,
  SiFacebook,
} from 'react-icons/si';
import { Globe } from 'lucide-react';
import type { IconType } from 'react-icons';

export interface SocialLink {
  platform: string;
  url: string;
}

interface AuthorSocialLinksProps {
  socials?: SocialLink[];
  className?: string;
}

const SOCIAL_PLATFORMS: Record<
  string,
  { icon: IconType; label: string }
> = {
  instagram: { icon: SiInstagram, label: 'Instagram' },
  linkedin: { icon: SiLinkedin, label: 'LinkedIn' },
  github: { icon: SiGithub, label: 'GitHub' },
  x: { icon: SiX, label: 'X' },
  youtube: { icon: SiYoutube, label: 'YouTube' },
  facebook: { icon: SiFacebook, label: 'Facebook' },
};

export const AuthorSocialLinks: React.FC<AuthorSocialLinksProps> = ({
  socials,
  className = '',
}) => {
  if (!socials || socials.length === 0) return null;

  const activeSocials = socials.filter(
    (social) =>
      typeof social.platform === 'string' &&
      typeof social.url === 'string' &&
      social.platform.trim().length > 0 &&
      social.url.trim().length > 0,
  );

  if (activeSocials.length === 0) return null;

  return (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    {activeSocials.map(({ platform, url }) => {
      const platformKey = platform.trim().toLowerCase();

      const config =
        platformKey === 'website'
          ? { icon: Globe, label: 'Website' }
          : SOCIAL_PLATFORMS[platformKey];

      if (!config) return null;

      const Icon = config.icon;

      const formattedUrl = url.startsWith('http')
        ? url
        : `https://${url}`;

      return (
        <div
          key={`${platformKey}-${url}`}
          className="group relative inline-flex items-center"
        >
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${config.label} profile`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-nique-blue bg-white text-nique-blue transition-all duration-200 hover:bg-nique-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-nique-blue/30"
            // className="inline-flex size-9 items-center justify-center rounded-full border border-nique-blue bg-nique-blue text-white transition-all duration-200 hover:bg-white hover:text-nique-blue focus:outline-none focus:ring-2 focus:ring-nique-blue/30"
          >
          <span className="flex size-4.5 items-center justify-center">
            <Icon
              className="size-4 text-current"
              aria-hidden="true"
            />
          </span>
          </a>
        </div>
      );
    })}
  </div>
  );
};