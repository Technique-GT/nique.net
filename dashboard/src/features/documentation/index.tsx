import { Link } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import screenshot from '/nique-net-main-page.svg'

const navItems = [
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'content_organization', label: 'Content Organization' },
  { id: 'caching', label: 'Caching' },
  { id: 'flows', label: 'Flows' },
  { id: 'misc', label: 'Misc' },
  { id: 'schema', label: 'Schema' },
  { id: 'statuses', label: 'Status Definitions' },
  { id: 'common-tasks', label: 'Common Tasks' },
  { id: 'faq', label: 'FAQ' },
]

export default function Documentation() {
  return (
    <Main>
      <PageHeader
        title='Documentation'
        description='Quick reference for editors and admins working in the dashboard.'
      />

      <div className='grid gap-6 lg:grid-cols-[240px_1fr]'>
        <aside className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>On this page</CardTitle>
              <CardDescription>Jump to a section</CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <ScrollArea className='h-[260px] pr-4'>
                <nav className='flex flex-col gap-2 text-sm'>
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className='text-muted-foreground transition hover:text-foreground'
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </ScrollArea>
            </CardContent>
          </Card>

          <Alert className='border-muted-foreground/10 bg-muted/50 text-muted-foreground'>
            <AlertTitle>Static reference</AlertTitle>
            <AlertDescription>
              This page is a static guide. If a workflow changes, update the copy
              here before shipping.
            </AlertDescription>
          </Alert>
        </aside>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle id='roles'>Roles & Permissions</CardTitle>
              <CardDescription>Who can do what in the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='user'>
                <TabsList>
                  <TabsTrigger value='user'>User</TabsTrigger>
                  <TabsTrigger value='admin'>Admin</TabsTrigger>
                </TabsList>
                <TabsContent value='user' className='space-y-2 text-sm text-muted-foreground dark:text-foreground/80'>
                  <ul className='list-disc space-y-2 pl-4'>
                    <li>Create and edit drafts.</li>
                    <li>Submit for review for admins and make changes on request.</li>
                    <li>View owned (not authored!) content.</li>
                  </ul>
                </TabsContent>
                <TabsContent value='admin' className='space-y-2 text-sm text-muted-foreground dark:text-foreground/80'>
                  <ul className='list-disc space-y-2 pl-4'>
                    <li>Approve and publish/unpublish content. Manage featured or sticky articles.</li>
                    <li>Manage staff accounts and permissions. Only admins can grant admin-status to other users.</li>
                    <li>Manage and approve comments, slivers, categories, tags, Spotify playlists, and view analytics on content performance.</li>
                    <li className='text-destructive font-semibold'>Make sure to review comments on a regular basis.</li>
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id='content_organization'>Content Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start'>
                <figure className='rounded-lg border bg-muted/30 p-3'>
                  <img
                    src={screenshot}
                    alt='Homepage layout showing content organization'
                    className='w-full rounded-md object-contain'
                  />
                </figure>
                <div className='space-y-4 text-sm text-muted-foreground dark:text-foreground/80'>
                  <p>
                    Each page's structure contains a <code>main</code> section, which holds the latest and most important content. Each page's <code>main</code> section is separated from the rest of the page by a divider across the page. <code>FeaturedStory</code> components are given first priority, i.e. pages hydrate the <code>FeaturedStory</code> before any other article if present. If there is no <code>isFeatured</code> article set for that category, the page will display the <b>latest article in that section</b>.
                  </p><p>
                    After setting the <code>FeaturedStory</code>, each page then creates a <code>recentArticles</code> array that fetches articles <code>[...sticky, ...nonSticky]</code> in descending order by published date. <code>sticky</code> articles are prioritized first, followed by non-sticky articles to fill the remaining slots.
                    The <code>JustIn</code> component, if present, takes the first article in the array and other <code>ArticleBlocks</code> in the <code>main</code> section are populated by subsequent articles in the array. 
                  </p><p>  
                    Below the divider, articles are organized into their categories/subcategories to help organize content (sorted by published date). Keep in mind that <b>all pages prioritize hydrating the <code>main</code> section of the page before the category/subcategory subsections.</b> A set is used to avoid duplicate articles in the <code>main</code> section and the category/subcategory subsections. The <code>InfiniteScrollModule</code> contains all articles in that category, sorting by descending order of published date, <code>PAGE_SIZE=8</code>.
                  </p>
                </div>
              </div>
          </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle id='caching'>Caching</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3 text-sm text-muted-foreground dark:text-foreground/80'>
                  <h1>Frontend JS Caching</h1>
                  <p>
                    There are two independent layers of caching, Cloudflare cache and frontend JS caches. This section will focus on the latter. The frontend caches are in-memory and pages still fetch fresh data on mount, so this cache layer only really improves perceived performance more than origin offload.
                  </p><p> 
                    <code>DataPrefetcher</code> is a background warm-up component. It renders nothing and runs once on app mount to fill the in-memory category cache so section pages can render instantly on navigation.
                    On mount, it first checks whether the cache is already populated. If not, it fetches categories, resolves each core category ID, and then pulls sticky, featured, recent, and per-category article lists in parallel. All results are stored in the cache with a short TTL so pages can show cached data immediately while fetching fresh data in the background.
                  </p>
                  <p>
                    Prefetching is best-effort: it starts after a short delay to avoid blocking first paint, silently ignores failures, and cancels in-flight requests on unmount. Because the cache is in-memory only, it resets on refresh, and the stale-while-revalidate behavior keeps content fresh without a loading flash.
                  </p><p>
                    Each page employs caching for both articles and categories to reduce server requests. (Check request limits on Render's free tier instance.) The TTL for articles and categories is set to 5 minutes. The caching logic could be further optimized but will require further study. Perhaps the TTL could adjusted based on traffic patterns or content update frequency and invalidate cache selectively when new content is published.
                  </p><p>
                    On load, an <code>Article</code> tries <code>articleCache.get(slugOrId)</code> to render the article from cache. If not found, it fetches from the database and sets the cache with <code>articleCache.set(slugOrId, article)</code>. On click, <code>ArticleBlock</code> components prefetch the article data and set it in the cache to prevent redundant fetches as well as speed up the fetch request before navigating to the article.
                  </p>
                  <div className='rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground'>
                    <pre className='whitespace-pre-wrap'>
{`CACHE FLOW (FRONTEND)

[App Mount]
    |
    v
DataPrefetcher ── fetch categories + lists ──► categoryCache (TTL 5m)
    |                                            ^
    |                                            |
    v                                            |
Category Page ── read cache ──► render instantly |
    |                                            |
    └─ fetch fresh data ──► update cache ────────┘

ArticleBlock click ── pre-cache article ──► articleCache (TTL 5m)
    |
    v
Article Page ── read cache ──► render instantly
    |
    └─ fetch article ──► update cache

Legend: in-memory caches, stale-while-revalidate pattern`}
                    </pre>
                  </div>
                    <p>
                      Cloudflare cache hit rate at February 2026 averages 21.43k cached requests out of 1.72M total requests per month, putting the system at a 1.25% cache hit rate. Long term goal is to improve Cloudflare cache hit rate.
                    </p>
                  <Separator />
                  <p><i>Tip: The free tier of Render spins down after 15 mins of no inbound requests and may experience cold starts if idle for some time. A quick workaround would be to ping the <code>/health</code> route frequently although this may balloon requests to the server. MongoDB's free tier also has limitations: 512MB storage and shared cluster resources, 16MB document size limit. The instance will also go stale if idle for 90 days, requiring a manual restart to regain responsiveness.</i></p>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id='flows'>Dashboard Flows</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-muted-foreground dark:text-foreground/80'>
              <p>
                The main flow is creating an article as an admin. Navigate to <Link to='/articles' className='text-primary hover:underline'>Article Library</Link>{' '} to view existing articles. To create a new article, click the <b>New Article</b> button in the top-right and populate the form accordingly. The dashboard is built around this flow, so most actions will center around creating, reviewing, and publishing articles and supporting content. Admins have the ability to publish and unpublish articles. Comments made by readers must be approved by admins before they appear publicly. To maintain engagement, it's recommended to review comments regularly.
              </p>
              <p>
                For non-admin users, the flow is similar but without publishing capabilities. Users can create and edit drafts, submit articles for review, and make changes based on admin feedback. Users can view content they <b>own</b> in the <Link to='/articles' className='text-primary hover:underline'>Article Library</Link>. Owners are users who created the article and may not necessarily be the author. If an article is created by an admin on behalf of a user, the user will be the author but not the owner. Non-admin users cannot view or moderate comments, slivers, playlists, content performance or manage categories/tags.
              </p>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id='misc'>Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-muted-foreground dark:text-foreground/80'>
                  <h1>Staff Management</h1>
                  <p>
                    The names/roles in <code>/Contact Us</code> and the footer are managed in a .json array in the codebase. To update, edit the array in <code>frontend/src/types/staff.ts</code> and deploy.
                  </p>
                  <Separator />
                  <h1>Comments & Reactions</h1>
                  <p>
                    Comments are associated with articles and can be nested with replies. <code>/frontend</code> fetches approved comments per article and renders them as a threaded tree, so replies appear under their parent comment.
                  </p>
                  <p>
                    Reader reactions (thumbs up/down) are tracked per device. The frontend stores a persistent device ID in local storage and sends it with reaction requests so the backend can remember a reader's reaction and return <code>myReaction</code> in the comment payload. <b>Note:</b> If a user wipes their <code>localStorage</code>, their reaction history is lost, allowing them to react again.
                  </p>
                {/* </div> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id='schema'>Schema</CardTitle>
              <CardDescription>MongoDB collection fields at a glance.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-muted-foreground dark:text-foreground/80'>
              <p>
                <code>Article</code>: title, slug, content, authors (authorId + order), categoryId, subcategoryId, tagIds, featuredMediaUrl, imageCaption, published flags + publishedAt, allowComments, isFeatured, isSticky, ownerId, editorState, reviewStatus (+ reviewedAt/reviewedBy/reviewNotes), viewCount, timestamps.
              </p>
              <p>
                <code>Category</code> and <code>SubCategory</code>: name + slug. SubCategory also stores categoryId. Slugs are generated from names; timestamps are disabled.
              </p>
              <p>
                <code>Tag</code>: name + slug with the same slugify rules as categories; timestamps are disabled.
              </p>
              <p>
                <code>User</code>: name, bio, isAdmin, email (unique + sparse), googleSub (unique + sparse), profilePictureUrl, socialLinks (platform + url). Timestamps are disabled.
              </p>
              <p>
                <code>Comment</code>: articleId, parentCommentId, content, username, thumbsUp, thumbsDown, approved, timestamps.
              </p>
              <p>
                <code>CommentReaction</code>: commentId, deviceId, reaction (up/down), timestamps. Enforces uniqueness on (commentId, deviceId).
              </p>
              <p>
                <code>Sliver</code>: text, expiresAt, timestamps. Uses a TTL index on expiresAt to auto-expire.
              </p>
              <p>
                <code>Playlist</code>: name, description, spotifyUrl (validated), isActive, timestamps. Enforces one active playlist on save.
              </p>
              <p>
                <code>Notification</code>: recipientId, type, title, message, link, data, read, createdAt.
              </p>
              <p>
                <code>RevokedToken</code>: tokenHash, userId, expiresAt, timestamps. Uses a TTL index on expiresAt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id='statuses'>Status Definitions</CardTitle>
              <CardDescription>Reference for the article lifecycle.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Meaning</TableHead>
                    <TableHead>Next Step</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant='info'>Draft</Badge>
                    </TableCell>
                    <TableCell>Work in progress and editable.</TableCell>
                    <TableCell>Assign editor and complete checklist.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant='warning'>In Review</Badge>
                    </TableCell>
                    <TableCell>Awaiting editorial approval.</TableCell>
                    <TableCell>Resolve notes and request publish.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant='outline'>Changes Requested</Badge>
                    </TableCell>
                    <TableCell>Awaiting changes from author.</TableCell>
                    <TableCell>Author must address changes before requesting another review.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant='success'>Published</Badge>
                    </TableCell>
                    <TableCell>Visible on the public site.</TableCell>
                    <TableCell>Monitor analytics and comments.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id='common-tasks'>Common Tasks</CardTitle>
              <CardDescription>Shortcuts to frequently used areas.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2 text-sm text-muted-foreground dark:text-foreground/80'>
              <ul className='list-disc space-y-2 pl-4'>
                <li>
                  Review the{' '}
                  <Link to='/articles' className='text-primary hover:underline'>
                    Article Library
                  </Link>{' '}
                  for recent submissions.
                </li>
                <li>
                  Update{' '}
                  <Link to='/articles/categories' className='text-primary hover:underline'>
                    Categories
                  </Link>{' '}
                  and{' '}
                  <Link to='/articles/tags' className='text-primary hover:underline'>
                    Tags
                  </Link>{' '}
                  before publishing.
                </li>
                <li>
                  Check{' '}
                  <Link to='/comments' className='text-primary hover:underline'>
                    Comments
                  </Link>{' '}
                  for moderation.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id='faq'>FAQ</CardTitle>
              <CardDescription>Quick answers for editors.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-muted-foreground dark:text-foreground/80'>
              <div>
                <p className='font-medium text-foreground'>Need to create a new article?</p>
                <p>Head to{' '}
                <Link to='/articles/new' className='text-primary hover:underline'>
                  Article Creation
                </Link>
                .</p>
              </div>
              <div>
                <p className='font-medium text-foreground'>Where do I update my profile?</p>
                <p>
                  Visit{' '}
                  <Link to='/settings/profile' className='text-primary hover:underline'>
                    Settings → Profile
                  </Link>
                  .
                </p>
              </div>
              <div>
                <p className='font-medium text-foreground'>Who can publish?</p>
                <p>Only admins can publish or unpublish content.</p>
              </div>
              <div>
                <p className='font-medium text-foreground'>How do I request a new tag?</p>
                <p>Message an admin or add it in the Tags section if you have access.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Main>
  )
}
