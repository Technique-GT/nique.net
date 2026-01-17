import { useState, useEffect } from "react";
import ArticleForm from "./ArticleForm";
import { getCategories, getSubCategories, getTags } from "@/services/taxonomy";
import { getUsers } from "@/services/users";
import { getCollaborators } from "@/services/collaborators";
import { getMedia } from "@/services/media";
import type { Category, SubCategory, Tag, Author, Collaborator, MediaItem } from "./types";
import { toast } from "sonner";

export default function ArticleCreation() {
  // State for fetched data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        const [catData, subCatData, tagData, collabData, userData, mediaData] = await Promise.all([
          getCategories(),
          getSubCategories(),
          getTags(),
          getCollaborators(),
          getUsers(),
          getMedia({ limit: 100 })
        ]);

        setCategories(catData as any);
        setSubcategories(subCatData as any);
        setTags(tagData as any);
        setCollaborators(collabData as any);

        // Map canonical backend User -> UI Author shape expected by ArticleForm
        const mappedAuthors: Author[] = (Array.isArray(userData) ? userData : []).map((u: any) => {
          const fullName = typeof u?.name === 'string' ? u.name.trim() : ''
          const parts = fullName.split(/\s+/).filter(Boolean)
          const firstName = parts[0] || 'Unknown'
          const lastName = parts.slice(1).join(' ')

          return {
            _id: u._id,
            firstName,
            lastName,
            username: fullName || 'Unknown',
            email: 'N/A',
            role: u.isAdmin ? 'admin' : 'writer',
            status: 'active',
          }
        })

        setAuthors(mappedAuthors);
        
        // Map backend media to UI media picker shape
        const mappedMedia: MediaItem[] = (mediaData.data || []).map(m => ({
          id: m._id,
          title: m.altText || 'Untitled',
          url: m.url,
          description: m.altText
        }));
        setMediaItems(mappedMedia);

      } catch (error: any) {
        console.error('Error fetching form data:', error);
        setFetchError(error?.message || 'Failed to load form data');
        toast.error("Error loading form data");
      } finally {
        setIsLoading(false);
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
      mediaLibrary={mediaItems}
    />
  );
}
