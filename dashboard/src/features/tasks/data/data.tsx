import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconCircle,
  IconCircleCheck,
  IconCircleX,
  IconExclamationCircle,
  IconStopwatch,
} from '@tabler/icons-react'

export const labels = [
  {
    value: 'news',
    label: 'Campus News',
  },
  {
    value: 'sports',
    label: 'Sports',
  },
  {
    value: 'opinion',
    label: 'Opinion',
  },
  {
    value: 'features',
    label: 'Features',
  },
  {
    value: 'arts',
    label: 'Arts & Culture',
  },
  {
    value: 'investigative',
    label: 'Investigative',
  },
  {
    value: 'science',
    label: 'Science & Tech',
  },
  {
    value: 'politics',
    label: 'Campus Politics',
  },
  {
    value: 'international',
    label: 'International',
  },
  {
    value: 'alumni',
    label: 'Alumni News',
  }
];

export const statuses = [
  {
    value: 'backlog',
    label: 'Backlog',
    icon: IconExclamationCircle,
  },
  {
    value: 'todo',
    label: 'Todo',
    icon: IconCircle,
  },
  {
    value: 'in progress',
    label: 'In Progress',
    icon: IconStopwatch,
  },
  {
    value: 'done',
    label: 'Done',
    icon: IconCircleCheck,
  },
  {
    value: 'canceled',
    label: 'Canceled',
    icon: IconCircleX,
  },
]

export const priorities = [
  {
    label: 'Low',
    value: 'low',
    icon: IconArrowDown,
  },
  {
    label: 'Medium',
    value: 'medium',
    icon: IconArrowRight,
  },
  {
    label: 'High',
    value: 'high',
    icon: IconArrowUp,
  },
]
