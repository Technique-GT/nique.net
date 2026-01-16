Go bug Ethan for the config.env if he hasn't given it already
Then do npm run start

```sh
Schema

Article
    title: string
    slug: string
    content: string
    excerpt: string
    authors: User array
    categories: Category object
    tags: Tag array
    featuredImage: Media
    imageCaption: string
    published: boolean
    isFeatured: boolean
    isSticky: boolean
    allowComments: boolean
    viewCount: number
    publishedAt: date | null
    updatedAt: date | null

Category
    name: string
    slug: string

Subcategory
    name: string
    slug: string
    category: Category

Comments
    content: string
    name: string
    thumbsUp: number
    thumbsDown: number
    createdAt: date
    updatedAt: date
    article: Article
    parentComment: Comments | null
    approved: boolean # ?

Media
    url: string
    altText: string
    createdAt: date
    updatedAt: date

Sliver
    text: string
    expiresAt: date | null

User
    name: string
    bio: string
    isAdmin: boolean
    profilePicture: Media
    socialLinks: { platform: string, url: string } array

Tag
    name: string
    slug: string


```