import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  lastSaved: string;
  status: 'draft' | 'published' | 'archived';
}

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchArticles = async () => {
      try {
        // Mock data
        const mockArticles: Article[] = [
          {
            id: '1',
            title: 'Getting Started with React',
            author: 'Jane Smith',
            date: '2023-06-01',
            lastSaved: '2023-06-15',
            status: 'published'
          },
          {
            id: '2',
            title: 'Advanced TypeScript Patterns',
            author: 'John Doe',
            date: '2023-05-20',
            lastSaved: '2023-06-10',
            status: 'published'
          },
          {
            id: '3',
            title: 'CSS Grid Layout Guide',
            author: 'Alice Johnson',
            date: '2023-06-05',
            lastSaved: '2023-06-18',
            status: 'draft'
          },
          {
            id: '4',
            title: 'State Management in 2023',
            author: 'Bob Williams',
            date: '2023-04-15',
            lastSaved: '2023-05-30',
            status: 'archived'
          },
        ];
        
        setArticles(mockArticles);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedArticles = () => {
    if (!sortConfig) return articles;

    return [...articles].sort((a, b) => {
      if (a[sortConfig.key as keyof Article] < b[sortConfig.key as keyof Article]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof Article] > b[sortConfig.key as keyof Article]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredArticles = getSortedArticles().filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setArticleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (articleToDelete) {
      setArticles(prev => prev.filter(article => article.id !== articleToDelete));
    }
    setIsDeleteModalOpen(false);
    setArticleToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading articles...</div>;
  }

  return (
    <div className="articles-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Article Management</h2>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          <Plus size={16} className="mr-2" />
          New Article
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={18} />
        </div>
        <input
          type="text"
          placeholder="Search by title or author..."
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
                onClick={() => requestSort('title')}
              >
                <div className="flex items-center">
                  Title
                  {sortConfig?.key === 'title' && (
                    sortConfig.direction === 'ascending' ? 
                    <ChevronUp className="ml-1" size={16} /> : 
                    <ChevronDown className="ml-1" size={16} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Author
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Saved
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{article.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(article.status)}`}>
                      {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.lastSaved).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No articles found matching your search criteria.
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
            <p className="mb-6">Are you sure you want to delete this article? This action cannot be undone.</p>
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

      <style jsx>{`
        .articles-container {
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default Articles;