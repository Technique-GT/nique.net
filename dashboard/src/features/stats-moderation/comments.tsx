import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Check, X, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { toast } from "sonner";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import {
  useComments,
  useCommentStats,
  useUpdateCommentStatus,
  useDeleteComment,
} from "@/hooks/use-queries";

type CommentArticleRef = {
  articleId?: string | { title?: string } | null;
};

export default function CommentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // TanStack Query hooks
  const { data: commentsData, isLoading, refetch } = useComments({ limit: 100 });
  const { data: stats } = useCommentStats();
  const updateCommentStatusMutation = useUpdateCommentStatus();
  const deleteCommentMutation = useDeleteComment();

  const comments = commentsData?.data ?? [];

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await updateCommentStatusMutation.mutateAsync({ id, approved });
      toast.success(approved ? "Comment approved" : "Comment unapproved");
    } catch (_error) {
      toast.error("Failed to update comment status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteCommentMutation.mutateAsync(id);
      toast.success("Comment deleted");
    } catch (_error) {
      toast.error("Failed to delete comment");
    }
  };

  const getArticleTitle = (comment: CommentArticleRef) => {
    if (comment.articleId && typeof comment.articleId === "object") {
      return typeof comment.articleId.title === "string" ? comment.articleId.title : "Unknown article";
    }
    return "Unknown article";
  };

  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      const articleTitle = getArticleTitle(c).toLowerCase();

      const matchesSearch =
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        articleTitle.includes(searchTerm.toLowerCase());

      
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "approved" && c.approved) || 
        (statusFilter === "pending" && !c.approved);
        
      return matchesSearch && matchesStatus;
    });
  }, [comments, searchTerm, statusFilter]);

  const toggleExpandedComment = (id: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && comments.length === 0) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <PageHeader
        title="Comments"
          description="Moderate and manage user comments"
          actions={
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalComments ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.approvedComments ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingComments ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search comments or users..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table className="w-full table-fixed min-w-[640px] sm:min-w-[760px] lg:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 sm:w-12 px-2" />
                    <TableHead className="w-[24%] sm:w-[18%]">User</TableHead>
                    <TableHead className="w-[44%] sm:w-[34%] md:w-[30%]">Comment</TableHead>
                    <TableHead className="hidden sm:table-cell sm:w-[24%] lg:w-[28%]">Article</TableHead>
                    <TableHead className="w-[14%] sm:w-[12%]">Status</TableHead>
                    <TableHead className="hidden md:table-cell md:w-[12%] lg:w-[10%]">Date</TableHead>
                    <TableHead className="w-[84px] sm:w-[96px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => {
                    const isExpanded = expandedComments.has(comment._id);
                    return (
                      <Fragment key={comment._id}>
                        <TableRow>
                          <TableCell className='w-12 px-1 py-2'>
                            <div className='flex items-center justify-between gap-2 ml-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => toggleExpandedComment(comment._id)}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <ChevronUp className='h-4 w-4' />
                                ) : (
                                  <ChevronDown className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-0">
                            <span className={`block ${isExpanded ? "whitespace-pre-wrap break-words" : "truncate"}`}>
                              {comment.username}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium max-w-0">
                              <span
                                className={`block ${
                                  isExpanded ? "whitespace-pre-wrap break-words" : "truncate"
                                }`}
                              >
                                {comment.content}
                              </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono hidden sm:table-cell max-w-0">
                            <span className={`block w-full ${isExpanded ? "whitespace-pre-wrap break-words" : "truncate"}`}>
                              {getArticleTitle(comment)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={comment.approved ? "default" : "secondary"}>
                              {comment.approved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(comment.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleApprove(comment._id, !comment.approved)}
                                title={comment.approved ? "Unapprove" : "Approve"}
                                disabled={updateCommentStatusMutation.isPending}
                              >
                                {comment.approved ? <X className="w-4 h-4 text-orange-500" /> : <Check className="w-4 h-4 text-green-500" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(comment._id)}
                                className="text-destructive"
                                disabled={deleteCommentMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                  {filteredComments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No comments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </Main>
  );
}
