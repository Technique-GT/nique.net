import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  dateCreated: string;
  articleCount: number;
}

const Tags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchTags = async () => {
      try {
        // Mock data
        const mockTags: Tag[] = [
          {
            id: '1',
            name: 'React',
            slug: 'react',
            dateCreated: '2023-01-10',
            articleCount: 15
          },
          {
            id: '2',
            name: 'JavaScript',
            slug: 'javascript',
            dateCreated: '2023-01-05',
            articleCount: 32
          },
          {
            id: '3',
            name: 'TypeScript',
            slug: 'typescript',
            dateCreated: '2023-02-15',
            articleCount: 18
          },
          {
            id: '4',
            name: 'Web Development',
            slug: 'web-development',
            dateCreated: '2023-01-20',
            articleCount: 24
          },
        ];
        
        setTags(mockTags);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedTags = () => {
    if (!sortConfig) return tags;

    return [...tags].sort((a, b) => {
      if (a[sortConfig.key as keyof Tag] < b[sortConfig.key as keyof Tag]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof Tag] > b[sortConfig.key as keyof Tag]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredTags = getSortedTags().filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setTagToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setCurrentTag(tag);
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (tagToDelete) {
      setTags(prev => prev.filter(tag => tag.id !== tagToDelete));
    }
    setIsDeleteModalOpen(false);
    setTagToDelete(null);
  };

  const handleSave = (updatedTag: Tag) => {
    if (updatedTag.id) {
      // Update existing tag
      setTags(prev => 
        prev.map(tag => 
          tag.id === updatedTag.id ? updatedTag : tag
        )
      );
    } else {
      // Create new tag
      setTags(prev => [...prev, {
        ...updatedTag,
        id: Date.now().toString(),
        dateCreated: new Date().toISOString().split('T')[0]
      }]);
    }
    setIsEditModalOpen(false);
    setCurrentTag(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading tags...</div>;
  }

  return (
    <div className="px-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tag Management</h2>
        <button 
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => {
            setCurrentTag({
              id: '',
              name: '',
              slug: '',
              dateCreated: '',
              articleCount: 0
            });
            setIsEditModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          New Tag
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
                  Tag Name
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
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tag.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {tag.articleCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tag.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No tags found matching your search criteria.
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
            <p className="mb-6">Are you sure you want to delete this tag? This action cannot be undone.</p>
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
      {isEditModalOpen && currentTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              {currentTag.id ? 'Edit Tag' : 'Create New Tag'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentTag.name}
                  onChange={(e) => setCurrentTag({...currentTag, name: e.target.value})}
                  placeholder="e.g. JavaScript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentTag.slug}
                  onChange={(e) => setCurrentTag({...currentTag, slug: e.target.value})}
                  placeholder="e.g. javascript"
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
                onClick={() => handleSave(currentTag)}
              >
                {currentTag.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tags;