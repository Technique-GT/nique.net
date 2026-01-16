import { useState, useEffect } from "react";
import { API_BASE_URL } from '../../config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Edit, UserPlus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Collaborator {
  _id: string;
  name: string;
  title: string;
  email?: string;
  status: "active" | "inactive";
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function Collaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCollaborator, setNewCollaborator] = useState({
    name: "",
    title: "",
    email: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch collaborators on component mount and when filters change
  useEffect(() => {
    fetchCollaborators();
  }, [searchTerm, statusFilter]);

  const fetchCollaborators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`${API_BASE_URL}/collaborators?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCollaborators(data.data);
      } else {
        setError(data.message || 'Failed to fetch collaborators');
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

const handleAddCollaborator = async () => {
  if (!newCollaborator.name.trim()) {
    setError('Name is required');
    return;
  }

  if (!newCollaborator.title.trim()) {
    setError('Title is required');
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/collaborators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newCollaborator.name,
        title: newCollaborator.title,
        email: newCollaborator.email || undefined,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      setSuccess('Collaborator added successfully!');
      await fetchCollaborators();
      setNewCollaborator({ name: "", title: "", email: "" });
      setIsDialogOpen(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(data.message || 'Error adding collaborator');
      if (data.errors) {
        setError(data.errors.join(', '));
      }
    }
  } catch (error) {
    setError('Network error. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDeleteCollaborator = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collaborator?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/collaborators/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Collaborator deleted successfully!');
        await fetchCollaborators();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Error deleting collaborator');
      }
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      setError('Error deleting collaborator');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/collaborators/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Status updated successfully!');
        await fetchCollaborators();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error updating status');
    }
  };

  const openEditDialog = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCollaborator = async () => {
    if (!editingCollaborator) return;

    if (!editingCollaborator.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!editingCollaborator.title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/collaborators/${editingCollaborator._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCollaborator.name,
          title: editingCollaborator.title,
          email: editingCollaborator.email || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Collaborator updated successfully!');
        await fetchCollaborators();
        setIsEditDialogOpen(false);
        setEditingCollaborator(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Error updating collaborator');
      }
    } catch (error) {
      console.error('Error updating collaborator:', error);
      setError('Error updating collaborator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-50 border-green-200";
      case "inactive": return "text-gray-600 bg-gray-50 border-gray-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Clear messages when dialogs open/close
  useEffect(() => {
    if (isDialogOpen || isEditDialogOpen) {
      setError(null);
      setSuccess(null);
    }
  }, [isDialogOpen, isEditDialogOpen]);

  if (isLoading && collaborators.length === 0) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <UserPlus className="w-12 h-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading collaborators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Collaborators</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and contributors
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Collaborator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Collaborator</DialogTitle>
              <DialogDescription>
                Add a team member or contributor to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCollaborator.name}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newCollaborator.title}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, title: e.target.value })}
                  placeholder="Enter job title or role"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCollaborator.email}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddCollaborator}
                disabled={isSubmitting || !newCollaborator.name.trim() || !newCollaborator.title.trim()}
              >
                {isSubmitting ? "Adding..." : "Add Collaborator"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Collaborator Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collaborator</DialogTitle>
            <DialogDescription>
              Update collaborator information.
            </DialogDescription>
          </DialogHeader>
          {editingCollaborator && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editingCollaborator.name}
                  onChange={(e) => setEditingCollaborator({ ...editingCollaborator, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editingCollaborator.title}
                  onChange={(e) => setEditingCollaborator({ ...editingCollaborator, title: e.target.value })}
                  placeholder="Enter job title or role"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email (Optional)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingCollaborator.email || ''}
                  onChange={(e) => setEditingCollaborator({ ...editingCollaborator, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={handleUpdateCollaborator}
              disabled={isSubmitting || !editingCollaborator?.name.trim() || !editingCollaborator?.title.trim()}
            >
              {isSubmitting ? "Updating..." : "Update Collaborator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({collaborators.length})</CardTitle>
          <CardDescription>
            Manage your team members and their information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, title, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {collaborators.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No collaborators found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first team member'
                }
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map((collaborator) => (
                    <TableRow key={collaborator._id}>
                      <TableCell className="font-medium">{collaborator.name}</TableCell>
                      <TableCell>{collaborator.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {collaborator.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(collaborator.status)}
                          className={getStatusColor(collaborator.status)}
                        >
                          {collaborator.status.charAt(0).toUpperCase() + collaborator.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(collaborator.joinDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(collaborator)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(collaborator._id, 'active')}>
                                Set Active
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(collaborator._id, 'inactive')}>
                                Set Inactive
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteCollaborator(collaborator._id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
