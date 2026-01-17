import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Check, X, Trash2, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  useComments,
  useCommentStats,
  useUpdateCommentStatus,
  useDeleteComment,
} from "@/hooks/use-queries";

export default function CommentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    } catch (error) {
      console.error('Error updating comment status:', error);
      toast.error("Failed to update comment status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteCommentMutation.mutateAsync(id);
      toast.success("Comment deleted");
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Failed to delete comment");
    }
  };

  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      const matchesSearch = 
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.articleId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "approved" && c.approved) || 
        (statusFilter === "pending" && !c.approved);
        
      return matchesSearch && matchesStatus;
    });
  }, [comments, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && comments.length === 0) {
    return (
      <>
        <Header>
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
          </div>
        </Header>
        <Main>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Loading comments...</p>
            </div>
          </div>
        </Main>
      </>
    );
  }

  return (
    <>
      <Header>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
        </div>
      </Header>

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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="max-w-md">Comment</TableHead>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment._id}>
                      <TableCell className="font-medium">{comment.username}</TableCell>
                      <TableCell className="max-w-md truncate">{comment.content}</TableCell>
                      <TableCell className="text-xs font-mono">{comment.articleId.slice(-6)}</TableCell>
                      <TableCell>
                        <Badge variant={comment.approved ? "default" : "secondary"}>
                          {comment.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(comment.createdAt)}</TableCell>
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
                  ))}
                  {filteredComments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
    </>
  );
}
