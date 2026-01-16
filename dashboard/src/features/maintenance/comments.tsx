import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, EyeOff, MessageSquare, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from '../../config';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  article: {
    _id: string;
    title: string;
    slug: string;
  };
  parentComment?: {
    _id: string;
    content: string;
    author: {
      name: string;
    };
  };
  isApproved: boolean;
  isSpam: boolean;
  isEdited: boolean;
  likes: number;
  dislikes: number;
  replyCount?: number;
  status: 'approved' | 'pending' | 'spam' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface CommentStats {
  totalComments: number;
  approved: number;
  pending: number;
  spam: number;
  rejected: number;
}

export default function CommentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CommentStats>({
    totalComments: 0,
    approved: 0,
    pending: 0,
    spam: 0,
    rejected: 0
  });

  // API base URL - matches your backend

  // Fetch comments and stats on component mount
  useEffect(() => {
    fetchComments();
    fetchStats();
  }, []);

  // Fetch comments when filters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComments();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Since we don't have a general comments endpoint, we need to get all comments
      // by fetching from all articles or creating a new endpoint
      // For now, let's create a mock implementation or use a different approach
      
      // Option 1: If you have an endpoint to get all comments
      const response = await fetch(`${API_BASE_URL}/comments/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // const data = await response.json();
      
      // For now, let's use mock data since we don't have a "get all comments" endpoint
      // In a real app, you'd create an endpoint like GET /api/comments
      // setComments([]); // Empty for now
      
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      setError(`Failed to load comments: ${error.message}. Note: You need to create a GET /api/comments endpoint.`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching comment stats:', error);
    }
  };

  // const updateCommentStatus = async (commentId: string, newStatus: string) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/comments/${commentId}/status`, {
  //       method: 'PATCH',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ status: newStatus }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
      
  //     if (data.success) {
  //       await fetchComments();
  //       await fetchStats();
  //     } else {
  //       alert(data.message || 'Error updating comment status');
  //     }
  //   } catch (error: any) {
  //     console.error('Error updating comment status:', error);
  //     alert(`Error updating comment status: ${error.message}`);
  //   }
  // };

  // const deleteComment = async (commentId: string) => {
  //   if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) return;

  //   try {
  //     const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
  //       method: 'DELETE',
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
      
  //     if (data.success) {
  //       await fetchComments();
  //       await fetchStats();
  //     } else {
  //       alert(data.message || 'Error deleting comment');
  //     }
  //   } catch (error: any) {
  //     console.error('Error deleting comment:', error);
  //     alert(`Error deleting comment: ${error.message}`);
  //   }
  // };

  // const getStatusVariant = (status: string) => {
  //   switch (status) {
  //     case 'approved': return 'default';
  //     case 'pending': return 'secondary';
  //     case 'spam': return 'destructive';
  //     case 'rejected': return 'outline';
  //     default: return 'outline';
  //   }
  // };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'approved': return 'text-green-600 bg-green-50 border-green-200';
  //     case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  //     case 'spam': return 'text-red-600 bg-red-50 border-red-200';
  //     case 'rejected': return 'text-gray-600 bg-gray-50 border-gray-200';
  //     default: return 'text-gray-600 bg-gray-50 border-gray-200';
  //   }
  // };

  // const getInitials = (name: string) => {
  //   return name
  //     .split(' ')
  //     .map(part => part[0])
  //     .join('')
  //     .toUpperCase()
  //     .slice(0, 2);
  // };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // };

  // const truncateContent = (content: string, maxLength: number = 100) => {
  //   if (content.length <= maxLength) return content;
  //   return content.substring(0, maxLength) + '...';
  // };

  // For now, using empty array since we don't have the endpoint
  const filteredComments: Comment[] = [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Comments Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading comments...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <strong>Development Note:</strong> {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                fetchComments();
              }}
            >
              Retry
            </Button>
          </div>
          <div className="mt-2 text-sm">
            To fix this, you need to create a GET endpoint at <code>/api/comments</code> that returns all comments.
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">All comments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Visible to public</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spam</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.spam}</div>
            <p className="text-xs text-muted-foreground">Marked as spam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Manually rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Manage Comments</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchComments}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Label htmlFor="search-comments" className="sr-only">
                  Search comments
                </Label>
                <Input
                  id="search-comments"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by comment content, author, or article title..."
                  className="pl-10"
                  disabled
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Comments Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">No comments endpoint available</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Create a GET /api/comments endpoint to display comments
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
