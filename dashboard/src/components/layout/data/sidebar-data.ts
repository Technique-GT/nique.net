import {
  IconArticle,
  IconBarrierBlock,
  IconBrowserCheck,
  IconCategory,
  IconChartBar,
  IconChecklist,
  IconHelp,
  IconLayoutDashboard,
  IconLibrary,
  IconMessage,
  IconMusic,
  IconNotification,
  IconPalette,
  IconPhoto,
  IconSettings,
  IconTag,
  IconTool,
  IconUserCog,
  IconUsers,
  IconUsersGroup
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'News Team',
      logo: Command,
      plan: 'Basic',
    },
    {
      name: 'Sports Team',
      logo: GalleryVerticalEnd,
      plan: 'Pro',
    },
    {
      name: 'Opinion Team',
      logo: AudioWaveform,
      plan: 'Pro',
    },
  ],
  navGroups: [
    {
      title: 'Core',
      items: [
        {
          title: 'Dashboard',
          url: '/dash',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: IconChecklist,
        },
        {
          title: 'Staff Members',
          url: '/users',
          icon: IconUsers,
        },
      ],
    },
    {
      title: 'Articles',
      items: [
        {
          title: 'Content Management',
          icon: IconArticle,
          items: [
            {
              title: 'Article Creation',
              url: '/articles',
              icon: IconArticle,
            },
            {
              title: 'Categories',
              url: '/articles/categories',
              icon: IconCategory,
            },
            {
              title: 'Tags',
              url: '/articles/tags',
              icon: IconTag,
            },
            {
              title: 'Media Library',
              url: '/articles/media',
              icon: IconPhoto,
            },
            {
              title: 'Article Library',
              url: '/articles/list',
              icon: IconLibrary,
            },
          ],
        },
        {
          title: 'Maintenance',
          icon: IconBarrierBlock,
          items: [
            {
              title: 'Site Analytics',
              url: '/maintenance',
              icon: IconChartBar,
            },
            {
              title: 'Comments List',
              url: '/maintenance/comments',
              icon: IconMessage,
            },
            {
              title: 'Collaborators',
              url: '/maintenance/collaborators',
              icon: IconUsersGroup,
            },
            {
              title: 'Spotify',
              url: '/maintenance/spotify',
              icon: IconMusic,
            },
          ],
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}