import {
  IconNews,
  IconBallBasketball,
  IconMessage,
  IconBook,
  IconPalette,
  IconZoomQuestion,
  IconMicroscope,
  IconPodium,
  IconWorld,
  IconSchool,
  IconChartLine,
  IconUsers,
  IconCalendar,
  IconPhoto
} from '@tabler/icons-react'

export const apps = [
  {
    name: 'Campus News Editor',
    logo: <IconNews />,
    connected: true,
    desc: 'Primary tool for editing and publishing campus news articles with 98% accuracy.',
    category: 'news'
  },
  {
    name: 'Sports Desk Pro',
    logo: <IconBallBasketball />,
    connected: true,
    desc: 'Comprehensive sports reporting and statistics analysis platform.',
    category: 'sports'
  },
  {
    name: 'Opinion Hub',
    logo: <IconMessage />,
    connected: false,
    desc: 'Platform for managing opinion pieces and editorial content.',
    category: 'opinion'
  },
  {
    name: 'Features Workshop',
    logo: <IconBook />,
    connected: false,
    desc: 'Tool for developing and editing long-form feature articles.',
    category: 'features'
  },
  {
    name: 'Arts & Culture Portal',
    logo: <IconPalette />,
    connected: false,
    desc: 'Dedicated interface for arts reviews and cultural coverage.',
    category: 'arts'
  },
  {
    name: 'Investigative Suite',
    logo: <IconZoomQuestion />,
    connected: false,
    desc: 'Secure platform for investigative journalism projects.',
    category: 'investigative'
  },
  {
    name: 'Science & Tech Lab',
    logo: <IconMicroscope />,
    connected: true,
    desc: 'Tools for reporting on scientific and technological developments.',
    category: 'science'
  },
  {
    name: 'Politics Tracker',
    logo: <IconPodium />,
    connected: true,
    desc: 'Platform for covering campus politics and elections.',
    category: 'politics'
  },
  {
    name: 'International Desk',
    logo: <IconWorld />,
    connected: false,
    desc: 'Tools for reporting on global issues and study abroad programs.',
    category: 'international'
  },
  {
    name: 'Alumni Network',
    logo: <IconUsers />,
    connected: false,
    desc: 'Platform for alumni-focused reporting and engagement.',
    category: 'alumni'
  },
  {
    name: 'Analytics Dashboard',
    logo: <IconChartLine />,
    connected: true,
    desc: 'Real-time readership analytics and engagement metrics.',
    category: 'news'
  },
  {
    name: 'Photo Editor Pro',
    logo: <IconPhoto />,
    connected: true,
    desc: 'Advanced tools for photo editing and management.',
    category: 'features'
  },
  {
    name: 'Editorial Calendar',
    logo: <IconCalendar />,
    connected: true,
    desc: 'Content planning and scheduling system for the newsroom.',
    category: 'news'
  },
  {
    name: 'Student Life Tracker',
    logo: <IconSchool />,
    connected: false,
    desc: 'Platform for covering student organizations and campus life.',
    category: 'features'
  }
]