Go bug Ethan for the config.env if he hasn't given it already
Then do npm run start

```sh
Article
- title: string
- slug: string (unique)
- content: string
- excerpt?: string (optional but useful for lists/SEO)
- authors: AuthorRef[] (always an array)
  - authorId: ObjectId (ref User)
  - order: number
- categoryId: ObjectId (ref Category)  (singular primary category)
- subcategoryId: ObjectId (ref Subcategory)
- tagIds?: ObjectId[] (ref Tag)
- featuredMediaId?: ObjectId (ref Media)
- imageCaption?: string
- published: boolean
- publishedAt: Date | null
- allowComments: boolean
- isFeatured: boolean
- isSticky: boolean
- viewCount: number
- createdAt, updatedAt (timestamps)

Category
- name: string
- slug: string (unique)

Subcategory
- categoryId: ObjectId (ref Category)
- name: string
- slug: string

Comment
- articleId: ObjectId (ref Article, indexed)
- parentCommentId?: ObjectId (self-ref, indexed)
- content: string
- username: string
- thumbsUp: number, thumbsDown: number
- approved: boolean
- timestamps

Media
- url: string
- altText: string

Sliver
- text: string
- expiresAt: Date

User
- name: string
- bio?: string
- isAdmin: boolean
- profilePictureMediaId?: ObjectId (ref Media)
- socialLinks: { platform: string, url: string }[]

Tag
- name: string
- slug: string (unique)

Indexes that matter (for speed)
- Article.slug unique
- Article.published + publishedAt compound (feeds)
- Article.categoryId + published + publishedAt
- Article.isFeatured + published + publishedAt
- Comment.articleId + createdAt
- Tag.slug unique, Category.slug unique

Migration friendliness
- This structure makes it easy to migrate from your old data:
  - old authors[].user → new authors[{authorId, order}]
  - old categories[] → new categoryId (choose first) or new categoryIds[]
  - old featuredImage → new featuredMediaId
  - old status → new published + publishedAt

```