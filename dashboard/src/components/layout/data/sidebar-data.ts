import {
  IconArticle,
  IconBarrierBlock,
  IconCategory,
  IconChartBar,
  IconLayoutDashboard,
  IconLibrary,
  IconMessage,
  IconMusic,
  IconPhoto,
  IconSparkles,
  IconTag,
  IconUsers,
} from '@tabler/icons-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
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
              title: 'Article Library',
              url: '/articles',
              icon: IconLibrary,
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
          ],
        },
        {
          title: 'Statistics & Moderation',
          icon: IconBarrierBlock,
          items: [
            {
              title: 'Statistics',
              url: '/stats',
              icon: IconChartBar,
            },
            {
              title: 'Comments List',
              url: '/comments',
              icon: IconMessage,
            },
            {
              title: 'Slivers List',
              url: '/slivers',
              icon: IconSparkles,
            },
            {
              title: 'Spotify',
              url: '/spotify',
              icon: IconMusic,
            },
          ],
        },
      ],
    },
  ],
}
