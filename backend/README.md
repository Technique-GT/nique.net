Go bug Ethan for the config.env if he hasn't given it already
Then do npm run start

```sh
Schema

Article
    title: string
    slug: string
    content: string
    authors: string array | string
    categories: Category object
    subcategories: { category: Category, subcategory: string } array
    tags: string array
    publishedAt: date
    updatedAt: date
    featuredImage: Media
    imageCaption: string
    published: boolean
    isFeatured: boolean
    allowComments: boolean
    viewCount: number
    publishedAt: date | null
    updatedAt: date | null

Category
    name: string
    slug: string
    isActive: boolean #?

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