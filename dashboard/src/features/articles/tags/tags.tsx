import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, FileText, RefreshCw } from "lucide-react";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import {
  useTags,
  useTagStats,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  type Tag,
} from "@/hooks/use-queries";

export default function Tags() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [error, setError] = useState<string | null>(null);

  // TanStack Query hooks
  const { data: tags = [], isLoading, refetch } = useTags();
  const { data: stats } = useTagStats();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  // Client-side filtering for search
  const filteredTags = useMemo(() => {
    if (!searchTerm) return tags;
    const term = searchTerm.toLowerCase();
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(term) ||
        tag.slug.toLowerCase().includes(term)
    );
  }, [tags, searchTerm]);

  const handleAddTag = async () => {
    if (!formData.name.trim()) {
      setError('Tag name is required');
      return;
    }

    try {
      setError(null);
      if (editingTag) {
        await updateTag.mutateAsync({ id: editingTag._id, data: { name: formData.name.trim() } });
      } else {
        await createTag.mutateAsync({ name: formData.name.trim() });
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Error ${editingTag ? 'updating' : 'adding'} tag`);
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await deleteTag.mutateAsync(tag._id);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error deleting tag');
    }
  };

  const openEditDialog = (tag: Tag) => {
    setFormData({ name: tag.name });
    setEditingTag(tag);
    setError(null);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "" });
    setEditingTag(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <Main>
        <PageHeader title="Tags" description="Loading tags..." />
        <Card>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading tags...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>
    );
  }

  return (
    <Main>
      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <PageHeader
        title="Tags"
          description="Organize your content with tags"
          actions={
            <>
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTag ? 'Edit Tag' : 'Add New Tag'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTag 
                        ? 'Update your tag information.' 
                        : 'Create a new tag to organize your content.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Show error in dialog if any */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Tag Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter tag name"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddTag} 
                      disabled={createTag.isPending || updateTag.isPending}
                    >
                      {(createTag.isPending || updateTag.isPending) ? 'Saving...' : (editingTag ? 'Update Tag' : 'Create Tag')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTags ?? tags.length}</div>
              <p className="text-xs text-muted-foreground">All tags</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex-1 relative">
                <Label htmlFor="search-tags" className="sr-only">
                  Search Tags
                </Label>
                <Input
                  id="search-tags"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tags..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">
                    Current Tags ({filteredTags.length})
                  </h3>
                  {filteredTags.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Click on a tag to edit
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredTags.map((tag) => (
                    <div key={tag._id} className="relative group">
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 text-sm cursor-pointer transition-all"
                        onClick={() => openEditDialog(tag)}
                      >
                        {tag.name}
                        <span className="ml-1 text-xs opacity-90">
                          {tag.slug}
                        </span>
                      </Badge>
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(tag);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-md"
                          title="Edit tag"
                        >
                          <Edit className="w-2 h-2" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTag(tag);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md"
                          title="Delete tag"
                          disabled={deleteTag.isPending}
                        >
                          <Trash2 className="w-2 h-2" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTags.length === 0 && (
                    <div className="text-center w-full py-8">
                      <p className="text-muted-foreground">No tags found</p>
                      {searchTerm && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your search terms
                        </p>
                      )}
                      {!searchTerm && (
                        <Button onClick={openCreateDialog} className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Tag
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>
  );
}
