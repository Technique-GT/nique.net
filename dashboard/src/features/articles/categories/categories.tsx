import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Eye, EyeOff, FolderOpen, FolderTree, ChevronDown, ChevronRight } from "lucide-react";
import { API_BASE_URL } from '../../../config';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubCategoryDialogOpen, setIsSubCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    isActive: true
  });

  const [subCategoryFormData, setSubCategoryFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    category: ""
  });

  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
    totalSubCategories: 0,
    activeSubCategories: 0,
    inactiveSubCategories: 0
  });

  // Fetch categories and subcategories on component mount
  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (showInactive) params.append('isActive', 'false');

      const response = await fetch(`${API_BASE_URL}/categories?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sub-categories`);
      const data = await response.json();
      
      if (data.success) {
        setAllSubCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [categoriesResponse, subCategoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/categories/stats`),
        fetch(`${API_BASE_URL}/sub-categories/stats`)
      ]);
      
      const categoriesData = await categoriesResponse.json();
      const subCategoriesData = await subCategoriesResponse.json();
      
      if (categoriesData.success && subCategoriesData.success) {
        setStats({
          totalCategories: categoriesData.data.totalCategories || 0,
          activeCategories: categoriesData.data.activeCategories || 0,
          inactiveCategories: categoriesData.data.inactiveCategories || 0,
          totalSubCategories: subCategoriesData.data.totalSubCategories || 0,
          activeSubCategories: subCategoriesData.data.activeSubCategories || 0,
          inactiveSubCategories: subCategoriesData.data.inactiveSubCategories || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setError(null);
      const url = editingCategory 
        ? `${API_BASE_URL}/categories/${editingCategory._id}`
        : `${API_BASE_URL}/categories`;
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim() || undefined,
          isActive: categoryFormData.isActive
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCategories();
        await fetchStats();
        resetCategoryForm();
        setIsCategoryDialogOpen(false);
      } else {
        setError(data.message || data.errors?.join(', ') || `Error ${editingCategory ? 'updating' : 'adding'} category`);
      }
    } catch (error) {
      console.error(`Error ${editingCategory ? 'updating' : 'adding'} category:`, error);
      setError(`Error ${editingCategory ? 'updating' : 'adding'} category`);
    }
  };

  const handleAddSubCategory = async () => {
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
      const url = editingSubCategory 
        ? `${API_BASE_URL}/sub-categories/${editingSubCategory._id}`
        : `${API_BASE_URL}/sub-categories`;
      
      const method = editingSubCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subCategoryFormData.name.trim(),
          description: subCategoryFormData.description.trim() || undefined,
          isActive: subCategoryFormData.isActive,
          category: subCategoryFormData.category
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSubCategories();
        await fetchStats();
        resetSubCategoryForm();
        setIsSubCategoryDialogOpen(false);
      } else {
        setError(data.message || data.errors?.join(', ') || `Error ${editingSubCategory ? 'updating' : 'adding'} sub-category`);
      }
    } catch (error) {
      console.error(`Error ${editingSubCategory ? 'updating' : 'adding'} sub-category:`, error);
      setError(`Error ${editingSubCategory ? 'updating' : 'adding'} sub-category`);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to ${category.isActive ? 'deactivate' : 'activate'} this category?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/categories/${category._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !category.isActive
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCategories();
        await fetchStats();
      } else {
        alert(data.message || `Error ${category.isActive ? 'deactivating' : 'activating'} category`);
      }
    } catch (error) {
      console.error(`Error ${category.isActive ? 'deactivating' : 'activating'} category:`, error);
      alert(`Error ${category.isActive ? 'deactivating' : 'activating'} category`);
    }
  };

  const handleDeleteSubCategory = async (subCategory: SubCategory) => {
    if (!confirm(`Are you sure you want to ${subCategory.isActive ? 'deactivate' : 'activate'} this sub-category?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sub-categories/${subCategory._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !subCategory.isActive
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSubCategories();
        await fetchStats();
      } else {
        alert(data.message || `Error ${subCategory.isActive ? 'deactivating' : 'activating'} sub-category`);
      }
    } catch (error) {
      console.error(`Error ${subCategory.isActive ? 'deactivating' : 'activating'} sub-category:`, error);
      alert(`Error ${subCategory.isActive ? 'deactivating' : 'activating'} sub-category`);
    }
  };

  const handleHardDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to permanently delete this category? This will also delete all associated sub-categories.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/hard`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCategories();
        await fetchSubCategories();
        await fetchStats();
      } else {
        alert(data.message || 'Error deleting category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const handleHardDeleteSubCategory = async (subCategoryId: string) => {
    if (!confirm('Are you sure you want to permanently delete this sub-category? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sub-categories/${subCategoryId}/hard`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchSubCategories();
        await fetchStats();
      } else {
        alert(data.message || 'Error deleting sub-category');
      }
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      alert('Error deleting sub-category');
    }
  };

  const openEditCategoryDialog = (category: Category) => {
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive
    });
    setEditingCategory(category);
    setError(null);
    setIsCategoryDialogOpen(true);
  };

  const openEditSubCategoryDialog = (subCategory: SubCategory) => {
    setSubCategoryFormData({
      name: subCategory.name,
      description: subCategory.description || "",
      isActive: subCategory.isActive,
      category: subCategory.category._id
    });
    setEditingSubCategory(subCategory);
    setError(null);
    setIsSubCategoryDialogOpen(true);
  };

  const openCreateCategoryDialog = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const openCreateSubCategoryDialog = () => {
    resetSubCategoryForm();
    setIsSubCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
      isActive: true
    });
    setEditingCategory(null);
    setError(null);
  };

  const resetSubCategoryForm = () => {
    setSubCategoryFormData({
      name: "",
      description: "",
      isActive: true,
      category: ""
    });
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

  // Get subcategories for a specific category
  const getSubCategoriesForCategory = (categoryId: string) => {
    return allSubCategories.filter(subCat => subCat.category._id === categoryId);
  };

  // Filter categories and subcategories based on search term
  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchTerm || 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActiveFilter = showInactive || category.isActive;
    
    return matchesSearch && matchesActiveFilter;
  });

  const filteredSubCategories = allSubCategories.filter(subCategory => {
    const matchesSearch = !searchTerm || 
      subCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subCategory.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActiveFilter = showInactive || subCategory.isActive;
    
    return matchesSearch && matchesActiveFilter;
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
      fetchSubCategories();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, showInactive]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Categories & Subcategories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading categories...</p>
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
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCategories}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Categories</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveCategories}</div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subcategories</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubCategories}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Subcategories</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveSubCategories}</div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
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
                  <Label htmlFor="search-categories" className="sr-only">
                    Search
                  </Label>
                  <Input
                    id="search-categories"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 w-full sm:w-64"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-inactive"
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                  <Label htmlFor="show-inactive" className="text-sm">
                    Show Inactive
                  </Label>
                </div>

                {/* Category Dialog */}
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
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          value={categoryFormData.description}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                          placeholder="Enter category description"
                        />
                      </div>
                      {editingCategory && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            checked={categoryFormData.isActive}
                            onCheckedChange={(checked) => setCategoryFormData({ ...categoryFormData, isActive: checked })}
                          />
                          <Label htmlFor="isActive" className="text-sm">
                            Active Category
                          </Label>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCategory}>
                        {editingCategory ? 'Update Category' : 'Create Category'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* SubCategory Dialog */}
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
                        <Label htmlFor="subcategory-description">Description (Optional)</Label>
                        <Input
                          id="subcategory-description"
                          value={subCategoryFormData.description}
                          onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, description: e.target.value })}
                          placeholder="Enter subcategory description"
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
                            {categories
                              .filter(cat => cat.isActive)
                              .map((category) => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {editingSubCategory && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="subcategory-isActive"
                            checked={subCategoryFormData.isActive}
                            onCheckedChange={(checked) => setSubCategoryFormData({ ...subCategoryFormData, isActive: checked })}
                          />
                          <Label htmlFor="subcategory-isActive" className="text-sm">
                            Active Subcategory
                          </Label>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsSubCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddSubCategory}>
                        {editingSubCategory ? 'Update Subcategory' : 'Create Subcategory'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Categories Tab */}
            <TabsContent value="categories">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Subcategories</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => {
                      const categorySubCategories = getSubCategoriesForCategory(category._id);
                      const isExpanded = expandedCategories.has(category._id);
                      
                      return (
                        <>
                          <TableRow key={category._id} className={!category.isActive ? "bg-muted/50" : ""}>
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
                            <TableCell>
                              <Badge variant={category.isActive ? "default" : "secondary"}>
                                {category.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                {category.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {category.slug}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {category.description || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categorySubCategories.length}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(category.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditCategoryDialog(category)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={category.isActive ? "secondary" : "default"}
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category)}
                                  title={category.isActive ? "Deactivate category" : "Activate category"}
                                >
                                  {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleHardDeleteCategory(category._id)}
                                  title="Permanently delete category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
                                          <Badge variant={subCategory.isActive ? "default" : "secondary"} className="text-xs">
                                            {subCategory.isActive ? "Active" : "Inactive"}
                                          </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => openEditSubCategoryDialog(subCategory)}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant={subCategory.isActive ? "secondary" : "default"}
                                            size="sm"
                                            onClick={() => handleDeleteSubCategory(subCategory)}
                                            title={subCategory.isActive ? "Deactivate subcategory" : "Activate subcategory"}
                                          >
                                            {subCategory.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleHardDeleteSubCategory(subCategory._id)}
                                            title="Permanently delete subcategory"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
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
                              <Button onClick={openCreateCategoryDialog} className="mt-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Category
                              </Button>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Parent Category</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubCategories.map((subCategory) => (
                      <TableRow key={subCategory._id} className={!subCategory.isActive ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Badge variant={subCategory.isActive ? "default" : "secondary"}>
                            {subCategory.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FolderTree className="w-4 h-4" />
                            {subCategory.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {subCategory.slug}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {subCategory.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {subCategory.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(subCategory.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditSubCategoryDialog(subCategory)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={subCategory.isActive ? "secondary" : "default"}
                              size="sm"
                              onClick={() => handleDeleteSubCategory(subCategory)}
                              title={subCategory.isActive ? "Deactivate subcategory" : "Activate subcategory"}
                            >
                              {subCategory.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleHardDeleteSubCategory(subCategory._id)}
                              title="Permanently delete subcategory"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
                              <Button onClick={openCreateSubCategoryDialog} className="mt-4">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Subcategory
                              </Button>
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
    </div>
  );
}
