import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fragment } from "react";
import { Plus, Edit, Trash2, Search, FolderOpen, FolderTree, ChevronDown, ChevronRight } from "lucide-react";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import {
  useCategories,
  useSubCategories,
  useCategoryStats,
  useSubCategoryStats,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubCategory,
  useUpdateSubCategory,
  useDeleteSubCategory,
  type Category,
  type SubCategory,
} from "@/hooks/use-queries";
import { useAuthStore } from "@/stores/authStore";
import { canManageTaxonomy } from "@/lib/permissions";

// Local type for UI with populated category
interface SubCategoryUI extends Omit<SubCategory, 'categoryId'> {
  category: {
    _id: string;
    name: string;
    slug: string;
  };
}

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubCategoryDialogOpen, setIsSubCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryUI | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.auth.user);
  const isAdmin = canManageTaxonomy(user);
  
  const [categoryFormData, setCategoryFormData] = useState({ name: "" });
  const [subCategoryFormData, setSubCategoryFormData] = useState({ name: "", category: "" });

  // TanStack Query hooks
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: rawSubCategories = [], isLoading: subCategoriesLoading } = useSubCategories();
  const { data: categoryStats } = useCategoryStats();
  const { data: subCategoryStats } = useSubCategoryStats();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createSubCategory = useCreateSubCategory();
  const updateSubCategory = useUpdateSubCategory();
  const deleteSubCategory = useDeleteSubCategory();

  const isLoading = categoriesLoading || subCategoriesLoading;

  // Transform subcategories to UI format with populated category
  const allSubCategories: SubCategoryUI[] = useMemo(() => {
    const categoryMap = new Map(categories.map((cat) => [cat._id, cat]));
    return rawSubCategories.map((subCat) => {
      const categoryId = typeof subCat.categoryId === 'string' 
        ? subCat.categoryId 
        : (subCat.categoryId as Category)?._id || '';
      const category = categoryMap.get(categoryId) || { _id: categoryId, name: "Unknown", slug: "" };
      return {
        ...subCat,
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
        },
      };
    });
  }, [categories, rawSubCategories]);

  // Stats
  const stats = {
    totalCategories: categoryStats?.totalCategories ?? categories.length,
    totalSubCategories: subCategoryStats?.totalSubCategories ?? allSubCategories.length,
  };

  // Handlers
  const handleAddCategory = async () => {
    if (!isAdmin) return;
    if (!categoryFormData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setError(null);
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory._id, data: { name: categoryFormData.name.trim() } });
      } else {
        await createCategory.mutateAsync({ name: categoryFormData.name.trim() });
      }
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Error ${editingCategory ? 'updating' : 'adding'} category`);
    }
  };

  const handleAddSubCategory = async () => {
    if (!isAdmin) return;
    if (!subCategoryFormData.name.trim()) {
      setError('Sub-category name is required');
      return;
    }
    if (!subCategoryFormData.category) {
      setError('Parent category is required');
      return;
    }

    try {
      setError(null);
      if (editingSubCategory) {
        await updateSubCategory.mutateAsync({ 
          id: editingSubCategory._id, 
          data: { name: subCategoryFormData.name.trim(), categoryId: subCategoryFormData.category } 
        });
      } else {
        await createSubCategory.mutateAsync({ 
          name: subCategoryFormData.name.trim(), 
          categoryId: subCategoryFormData.category 
        });
      }
      resetSubCategoryForm();
      setIsSubCategoryDialogOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || `Error ${editingSubCategory ? 'updating' : 'adding'} sub-category`);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this category? This will also delete all associated sub-categories.')) return;
    try {
      await deleteCategory.mutateAsync(category._id);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error deleting category');
    }
  };

  const handleDeleteSubCategory = async (subCategory: SubCategoryUI) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this sub-category?')) return;
    try {
      await deleteSubCategory.mutateAsync(subCategory._id);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error deleting sub-category');
    }
  };

  const openEditCategoryDialog = (category: Category) => {
    if (!isAdmin) return;
    setCategoryFormData({ name: category.name });
    setEditingCategory(category);
    setError(null);
    setIsCategoryDialogOpen(true);
  };

  const openEditSubCategoryDialog = (subCategory: SubCategoryUI) => {
    if (!isAdmin) return;
    setSubCategoryFormData({ name: subCategory.name, category: subCategory.category._id });
    setEditingSubCategory(subCategory);
    setError(null);
    setIsSubCategoryDialogOpen(true);
  };

  const openCreateCategoryDialog = () => {
    if (!isAdmin) return;
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const openCreateSubCategoryDialog = () => {
    if (!isAdmin) return;
    resetSubCategoryForm();
    setIsSubCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: "" });
    setEditingCategory(null);
    setError(null);
  };

  const resetSubCategoryForm = () => {
    setSubCategoryFormData({ name: "", category: "" });
    setEditingSubCategory(null);
    setError(null);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getSubCategoriesForCategory = (categoryId: string) => {
    return allSubCategories.filter(subCat => subCat.category._id === categoryId);
  };

  // Client-side filtering
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(category => category.name.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  const filteredSubCategories = useMemo(() => {
    if (!searchTerm) return allSubCategories;
    const term = searchTerm.toLowerCase();
    return allSubCategories.filter(subCategory => subCategory.name.toLowerCase().includes(term));
  }, [allSubCategories, searchTerm]);

  if (isLoading) {
    return (
      <Main>
        <PageHeader title="Categories" description="Loading categories..." />
        <Card>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading categories...</p>
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
        title="Categories"
          description="Organize your content with categories and subcategories"
          badge={
            !isAdmin ? (
              <Badge variant="destructive" className="text-xs">
                View only
              </Badge>
            ) : null
          }
          actions={
            <>
              {isAdmin && (
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={openCreateCategoryDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCategory 
                          ? 'Update your category information.' 
                          : 'Create a new category to organize your content.'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category-name">Category Name *</Label>
                        <Input
                          id="category-name"
                          value={categoryFormData.name}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                          placeholder="Enter category name"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddCategory} 
                        disabled={createCategory.isPending || updateCategory.isPending}
                      >
                        {(createCategory.isPending || updateCategory.isPending) ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {isAdmin && (
                <Dialog open={isSubCategoryDialogOpen} onOpenChange={setIsSubCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateSubCategoryDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subcategory
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSubCategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingSubCategory 
                          ? 'Update your subcategory information.' 
                          : 'Create a new subcategory under an existing category.'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="subcategory-name">Subcategory Name *</Label>
                        <Input
                          id="subcategory-name"
                          value={subCategoryFormData.name}
                          onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })}
                          placeholder="Enter subcategory name"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="parent-category">Parent Category *</Label>
                        <Select 
                          value={subCategoryFormData.category} 
                          onValueChange={(value) => setSubCategoryFormData({ ...subCategoryFormData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsSubCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddSubCategory} 
                        disabled={createSubCategory.isPending || updateSubCategory.isPending}
                      >
                        {(createSubCategory.isPending || updateSubCategory.isPending) ? 'Saving...' : (editingSubCategory ? 'Update' : 'Create')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">All categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subcategories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubCategories}</div>
            <p className="text-xs text-muted-foreground">All subcategories</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Manage Categories & Subcategories</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="categories" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="subcategories" className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4" />
                  Subcategories
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Label htmlFor="search-categories" className="sr-only">Search</Label>
                  <Input
                    id="search-categories"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 w-full sm:w-64"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Category Dialog */}
                {isAdmin && (
                  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openCreateCategoryDialog}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingCategory 
                            ? 'Update your category information.' 
                            : 'Create a new category to organize your articles.'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                          {error}
                        </div>
                      )}

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Category Name *</Label>
                          <Input
                            id="name"
                            value={categoryFormData.name}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                            placeholder="Enter category name"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddCategory}
                          disabled={createCategory.isPending || updateCategory.isPending}
                        >
                          {(createCategory.isPending || updateCategory.isPending) ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* SubCategory Dialog */}
                {isAdmin && (
                  <Dialog open={isSubCategoryDialogOpen} onOpenChange={setIsSubCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openCreateSubCategoryDialog} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subcategory
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingSubCategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingSubCategory 
                            ? 'Update your subcategory information.' 
                            : 'Create a new subcategory under a parent category.'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                          {error}
                        </div>
                      )}

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="subcategory-name">Subcategory Name *</Label>
                          <Input
                            id="subcategory-name"
                            value={subCategoryFormData.name}
                            onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })}
                            placeholder="Enter subcategory name"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="parent-category">Parent Category *</Label>
                          <Select
                            value={subCategoryFormData.category}
                            onValueChange={(value) => setSubCategoryFormData({ ...subCategoryFormData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a parent category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category._id} value={category._id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsSubCategoryDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddSubCategory}
                          disabled={createSubCategory.isPending || updateSubCategory.isPending}
                        >
                          {(createSubCategory.isPending || updateSubCategory.isPending) ? 'Saving...' : (editingSubCategory ? 'Update Subcategory' : 'Create Subcategory')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Categories Tab */}
            <TabsContent value="categories">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Slug</TableHead>
                      <TableHead>Subcategories</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => {
                      const categorySubCategories = getSubCategoriesForCategory(category._id);
                      const isExpanded = expandedCategories.has(category._id);
                      
                      return (
                        <Fragment key={category._id}>
                          <TableRow>
                            <TableCell>
                              {categorySubCategories.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCategoryExpansion(category._id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                {category.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                              {category.slug}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categorySubCategories.length}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                              {new Date(category.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {isAdmin && (
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openEditCategoryDialog(category)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category)}
                                    title="Delete category"
                                    disabled={deleteCategory.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                          
                          {/* Subcategories for this category */}
                          {isExpanded && categorySubCategories.length > 0 && (
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={8} className="p-0">
                                <div className="p-4 pl-12">
                                  <h4 className="text-sm font-medium mb-3">Subcategories</h4>
                                  <div className="space-y-2">
                                    {categorySubCategories.map((subCategory) => (
                                      <div key={subCategory._id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                        <div className="flex items-center gap-3">
                                          <FolderTree className="w-4 h-4 text-muted-foreground" />
                                          <div>
                                            <div className="font-medium text-sm">{subCategory.name}</div>
                                            <div className="text-xs text-muted-foreground">{subCategory.slug}</div>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          {isAdmin && (
                                            <>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => openEditSubCategoryDialog(subCategory)}
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteSubCategory(subCategory)}
                                                title="Delete subcategory"
                                                disabled={deleteSubCategory.isPending}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                    
                    {filteredCategories.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-center">
                            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No categories found</p>
                            {searchTerm && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Try adjusting your search terms
                              </p>
                            )}
                            {!searchTerm && (
                              isAdmin && (
                                <Button onClick={openCreateCategoryDialog} className="mt-4">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create Your First Category
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Subcategories Tab */}
            <TabsContent value="subcategories">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Slug</TableHead>
                      <TableHead>Parent Category</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubCategories.map((subCategory) => (
                      <TableRow key={subCategory._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FolderTree className="w-4 h-4" />
                            {subCategory.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm hidden sm:table-cell">
                          {subCategory.slug}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {subCategory.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                          {new Date(subCategory.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditSubCategoryDialog(subCategory)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteSubCategory(subCategory)}
                                title="Delete subcategory"
                                disabled={deleteSubCategory.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredSubCategories.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-center">
                            <FolderTree className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No subcategories found</p>
                            {searchTerm && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Try adjusting your search terms
                              </p>
                            )}
                            {!searchTerm && (
                              isAdmin && (
                                <Button onClick={openCreateSubCategoryDialog} className="mt-4">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create Your First Subcategory
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Main>
  );
}
