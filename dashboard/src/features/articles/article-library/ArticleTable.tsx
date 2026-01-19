import { Article, PopulatedAuthor } from "./article";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, MoreHorizontal, Star, Pin, Send, RefreshCw, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleTableProps {
  articles: Article[];
  filteredArticles: Article[];
  loading: boolean;
  getAuthorName: (author: PopulatedAuthor) => string;
  getStatusVariant: (status: string) => "default" | "secondary" | "outline" | "destructive";
  formatDate: (dateString: string) => string;
  publishingArticle: string | null;
  featuringArticle: string | null;
  stickingArticle: string | null;
  onQuickPublish: (article: Article) => void;
  onQuickFeature: (article: Article) => void;
  onQuickSticky: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onNewArticle: () => void;
  isAdmin: boolean;
  currentUserId: string | null;
}

export function ArticleTable({
  articles,
  filteredArticles,
  loading,
  getAuthorName,
  getStatusVariant,
  formatDate,
  publishingArticle,
  featuringArticle,
  stickingArticle,
  onQuickPublish,
  onQuickFeature,
  onQuickSticky,
  onEdit,
  onDelete,
  onNewArticle,
  isAdmin,
  currentUserId,
}: ArticleTableProps) {
  const handleViewOnTechnique = (article: Article) => {
    if (article.status !== 'published' || !article.slug) return;
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    window.open(`${frontendUrl}/articles/${article.slug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Loading articles...</p>
      </div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No articles found matching your criteria</p>
        {articles.length === 0 && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onNewArticle}
          >
            Create your first article
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Title</TableHead>
            <TableHead className="hidden md:table-cell">Authors</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
            <TableHead className="hidden lg:table-cell">Views</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Quick Actions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
          </TableHeader>
        <TableBody>
          {filteredArticles.map((article) => {
            const isOwner = !!currentUserId && article.ownerId === currentUserId
            const isAuthor = !!currentUserId && Array.isArray(article.authors) && article.authors.some((a) => a?._id === currentUserId)
            const canEdit = isAdmin || isOwner || isAuthor

            const handleRowClick: React.MouseEventHandler<HTMLTableRowElement> = (e) => {
              // Don't navigate if clicking on interactive elements
              const target = e.target as HTMLElement
              if (
                target.closest('button') ||
                target.closest('[role="menuitem"]') ||
                target.closest('[data-radix-collection-item]')
              ) {
                return
              }
              if (canEdit) {
                onEdit(article)
              }
            }

            return (
              <TableRow 
                key={article._id}
                onClick={handleRowClick}
                className={cn(canEdit && "cursor-pointer hover:bg-muted/50")}
              >

                <TableCell className="font-medium min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[180px] sm:max-w-[250px]">{article.title}</span>
                  {article.isFeatured && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>Featured</TooltipContent>
                    </Tooltip>
                  )}
                  {article.isSticky && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Pin className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>Pinned</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(article.authors) && article.authors.length > 0 ? (
                    <>
                      {article.authors.slice(0, 2).map((author) => (
                        <Badge key={author._id} variant="outline" className="text-xs">
                          {getAuthorName(author)}
                        </Badge>
                      ))}
                      {article.authors.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.authors.length - 2} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Unknown
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {article.category?.name || 'Not Set'}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={getStatusVariant(article.reviewStatus || article.status)}>
                    {article.reviewStatus || article.status}
                  </Badge>
                  {article.hasPendingChanges && article.reviewStatus === 'published' && (
                    <Badge variant="outline" className="text-[10px] border-orange-200 bg-orange-50 text-orange-700 w-fit">
                      Pending Changes
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{formatDate(article.createdAt)}</TableCell>
              <TableCell className="hidden lg:table-cell">{article.views}</TableCell>
              
              {/* Quick Actions Column */}
              <TableCell className="text-center hidden sm:table-cell">
                <div className="flex justify-center gap-1">
                  {/* Publish/Unpublish Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuickPublish(article)}
                        disabled={!isAdmin || publishingArticle === article._id}
                        className={cn(
                          "h-8 w-8",
                          article.status === 'published' 
                            ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                            : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        {publishingArticle === article._id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {article.status === 'published' ? 'Unpublish' : 'Publish'}
                    </TooltipContent>
                  </Tooltip>

                  {/* Feature/Unfeature Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuickFeature(article)}
                        disabled={!isAdmin || featuringArticle === article._id || article.status !== 'published'}
                        className={cn(
                          "h-8 w-8",
                          article.isFeatured 
                            ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" 
                            : "text-gray-500 hover:text-gray-700",
                          article.status !== 'published' && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {featuringArticle === article._id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Star className={cn("w-3 h-3", article.isFeatured && "fill-current")} />
                        )}
                      </Button>
                    </TooltipTrigger>
                     <TooltipContent>
                       {article.isFeatured ? 'Unfeature' : 'Feature'}
                       {article.status !== 'published' && ' (Published only)'}
                     </TooltipContent>

                  </Tooltip>

                  {/* Sticky/Unsticky Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuickSticky(article)}
                        disabled={!isAdmin || stickingArticle === article._id || article.status !== 'published'}
                        className={cn(
                          "h-8 w-8",
                          article.isSticky 
                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                            : "text-gray-500 hover:text-gray-700",
                          article.status !== 'published' && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {stickingArticle === article._id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Pin className={cn("w-3 h-3", article.isSticky && "fill-current")} />
                        )}
                      </Button>
                    </TooltipTrigger>
                     <TooltipContent>
                       {article.isSticky ? 'Unpin' : 'Pin to top'}
                       {article.status !== 'published' && ' (Published only)'}
                     </TooltipContent>

                  </Tooltip>
                </div>
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => handleViewOnTechnique(article)}
                      disabled={article.status !== 'published'}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Technique
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onEdit(article)}
                      disabled={!canEdit}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem 
                        onClick={() => onQuickPublish(article)}
                        disabled={publishingArticle === article._id}
                      >
                        {publishingArticle === article._id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {article.status === 'published' ? 'Unpublish' : 'Publish'}
                      </DropdownMenuItem>
                    )}
                    
                    {isAdmin && (
                      <DropdownMenuItem 
                        onClick={() => onQuickFeature(article)}
                        disabled={featuringArticle === article._id || article.status !== 'published'}
                      >
                        <Star className={cn("w-4 h-4 mr-2", article.isFeatured && "fill-current")} />
                        {article.isFeatured ? 'Unfeature' : 'Feature'}
                      </DropdownMenuItem>
                    )}

                    
                    {isAdmin && (
                      <DropdownMenuItem 
                        onClick={() => onQuickSticky(article)}
                        disabled={stickingArticle === article._id || article.status !== 'published'}
                      >
                        <Pin className={cn("w-4 h-4 mr-2", article.isSticky && "fill-current")} />
                        {article.isSticky ? 'Unpin' : 'Pin to top'}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(article)}
                      disabled={!canEdit}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              </TableRow>
            );
          })}

        </TableBody>
      </Table>
    </div>
  );
}