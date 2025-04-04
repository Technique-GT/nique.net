import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  dateCreated: string;
  articleCount: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchCategories = async () => {
      try {
        // Mock data
        const mockCategories: Category[] = [
          {
            id: '1',
            name: 'Technology',
            slug: 'technology',
            dateCreated: '2023-01-15',
            articleCount: 24
          },
          {
            id: '2',
            name: 'Business',
            slug: 'business',
            dateCreated: '2023-02-10',
            articleCount: 18
          },
          {
            id: '3',
            name: 'Science',
            slug: 'science',
            dateCreated: '2023-03-05',
            articleCount: 12
          },
          {
            id: '4',
            name: 'Health',
            slug: 'health',
            dateCreated: '2023-04-22',
            articleCount: 15
          },
        ];
        
        setCategories(mockCategories);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedCategories = () => {
    if (!sortConfig) return categories;

    return [...categories].sort((a, b) => {
      if (a[sortConfig.key as keyof Category] < b[sortConfig.key as keyof Category]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof Category] > b[sortConfig.key as keyof Category]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredCategories = getSortedCategories().filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setCurrentCategory(category);
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      setCategories(prev => prev.filter(category => category.id !== categoryToDelete));
    }
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleSave = (updatedCategory: Category) => {
    setCategories(prev => 
      prev.map(category => 
        category.id === updatedCategory.id ? updatedCategory : category
      )
    );
    setIsEditModalOpen(false);
    setCurrentCategory(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading categories...</div>;
  }

  return (
    <div className="categories-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <button 
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => {
            setCurrentCategory({
              id: '',
              name: '',
              slug: '',
              dateCreated: new Date().toISOString().split('T')[0],
              articleCount: 0
            });
            setIsEditModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          New Category
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={18} />
        </div>
        <input
          type="text"
          placeholder="Search by name or slug..."
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center">
                  Category
                  {sortConfig?.key === 'name' && (
                    sortConfig.direction === 'ascending' ? 
                    <ChevronUp className="ml-1" size={16} /> : 
                    <ChevronDown className="ml-1" size={16} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Articles
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{category.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {category.articleCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(category.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No categories found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isEditModalOpen && currentCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              {currentCategory.id ? 'Edit Category' : 'Create New Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentCategory.slug}
                  onChange={(e) => setCurrentCategory({...currentCategory, slug: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => handleSave(currentCategory)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .categories-container {
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default Categories;