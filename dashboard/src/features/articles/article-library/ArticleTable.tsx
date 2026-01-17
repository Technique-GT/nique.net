import { Article, PopulatedAuthor } from "./article";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Star, Pin, Send, RefreshCw, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleTableProps {
  articles: Article[];
  filteredArticles: Article[];
  loading: boolean;
  getAuthorName: (author: PopulatedAuthor) => string;
  getStatusVariant: (status: string) => "default" | "secondary" | "outline";
  formatDate: (dateString: string) => string;
  publishingArticle: string | null;
  featuringArticle: string | null;
  stickingArticle: string | null;
  onQuickPublish: (article: Article) => void;
  onQuickFeature: (article: Article) => void;
  onQuickSticky: (article: Article) => void;
  onView: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onNewArticle: () => void;
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
  onView,
  onEdit,
  onDelete,
  onNewArticle
}: ArticleTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Authors</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Views</TableHead>
            <TableHead className="text-center">Quick Actions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredArticles.map((article) => (
            <TableRow key={article._id}>
              <TableCell className="font-medium max-w-xs truncate">
                <div className="flex items-center gap-2">
                  {article.title}
                  {article.isFeatured && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </TooltipTrigger>
                      <TooltipContent>Featured</TooltipContent>
                    </Tooltip>
                  )}
                  {article.isSticky && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Pin className="w-4 h-4 text-blue-500 fill-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>Pinned</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell>
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
              <TableCell>
                {article.category?.name || 'Unknown'}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(article.status)}>
                  {article.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(article.createdAt)}</TableCell>
              <TableCell>{article.views}</TableCell>
              
              {/* Quick Actions Column */}
              <TableCell className="text-center">
                <div className="flex justify-center gap-1">
                  {/* Publish/Unpublish Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onQuickPublish(article)}
                        disabled={publishingArticle === article._id}
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
                        disabled={featuringArticle === article._id || article.status !== 'published'}
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
                        disabled={stickingArticle === article._id || article.status !== 'published'}
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
                    <DropdownMenuItem onClick={() => onView(article)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(article)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
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
                    
                    <DropdownMenuItem 
                      onClick={() => onQuickFeature(article)}
                      disabled={featuringArticle === article._id || article.status !== 'published'}
                    >
                      <Star className={cn("w-4 h-4 mr-2", article.isFeatured && "fill-current")} />
                      {article.isFeatured ? 'Unfeature' : 'Feature'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onQuickSticky(article)}
                      disabled={stickingArticle === article._id || article.status !== 'published'}
                    >
                      <Pin className={cn("w-4 h-4 mr-2", article.isSticky && "fill-current")} />
                      {article.isSticky ? 'Unpin' : 'Pin to top'}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(article)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}