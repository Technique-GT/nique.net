import { useState, useEffect } from "react";
import { Category, SubCategory, Tag, Author, Collaborator } from "./types";
import ArticleForm from "./ArticleForm";

import { API_BASE_URL } from '../../../config';

export default function ArticleCreation() {
  // State for fetched data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        // Fetch categories, subcategories, tags, and collaborators
        const [categoriesResponse, subcategoriesResponse, tagsResponse, collaboratorsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/categories?isActive=true`),
          fetch(`${API_BASE_URL}/sub-categories?isActive=true`),
          fetch(`${API_BASE_URL}/tags?isActive=true`),
          fetch(`${API_BASE_URL}/collaborators?status=active`)
        ]);

        const [categoriesData, subcategoriesData, tagsData, collaboratorsData] = await Promise.all([
          categoriesResponse.json(),
          subcategoriesResponse.json(),
          tagsResponse.json(),
          collaboratorsResponse.json()
        ]);

        if (categoriesData.success) {
          setCategories(categoriesData.data);
        } else {
          throw new Error(categoriesData.message || 'Failed to fetch categories');
        }

        if (subcategoriesData.success) {
          setSubcategories(subcategoriesData.data);
        } else {
          console.warn('Failed to fetch subcategories:', subcategoriesData.message);
        }

        if (tagsData.success) {
          setTags(tagsData.data);
        } else {
          throw new Error(tagsData.message || 'Failed to fetch tags');
        }

        if (collaboratorsData.success) {
          setCollaborators(collaboratorsData.data);
        } else {
          console.warn('Failed to fetch collaborators:', collaboratorsData.message);
          setCollaborators([]);
        }

        // Fetch authors
        await fetchAuthors();

      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setFetchError(error instanceof Error ? error.message : 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAuthors = async () => {
      try {
        console.log('Fetching authors from /api/users...');
        
        const allUsersResponse = await fetch(`${API_BASE_URL}/users`);
        const allUsersData = await allUsersResponse.json();
        
        console.log('All users response:', allUsersData);
        
        if (allUsersData.success) {
          console.log('All users found:', allUsersData.data.length);
          
          // Filter for active authors with appropriate roles
          const activeAuthors = allUsersData.data.filter((user: Author) => 
            user.status === 'active' && 
            ['writer', 'editor', 'admin', 'superadmin'].includes(user.role)
          );
          
          console.log('Filtered active authors:', activeAuthors);
          setAuthors(activeAuthors);
        } else {
          console.warn('Failed to fetch users:', allUsersData.message);
          setAuthors([]);
        }
      } catch (error: unknown) {
        console.error('Error fetching authors:', error);
        setAuthors([]);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading form data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-6">
        <div className="border rounded-lg p-6">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading form data</p>
            <p className="text-sm mt-1">{fetchError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 border border-red-300 rounded text-sm hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ArticleForm
      categories={categories}
      subcategories={subcategories}
      tags={tags}
      authors={authors}
      collaborators={collaborators}
    />
  );
}
