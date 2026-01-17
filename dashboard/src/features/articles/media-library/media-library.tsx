import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Search, Image, File, Video, Trash2, Loader2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMedia, deleteMedia, uploadMedia, type MediaItem as ServiceMediaItem } from "@/services/media";
import { toast } from "sonner";

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaItems, setMediaItems] = useState<ServiceMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media items
  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getMedia({ search: searchTerm, limit: 100 });
      setMediaItems(data.data);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      setError('Network error. Please check your connection.');
      toast.error("Failed to load media");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [searchTerm]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setSuccess(null);
    
    // Handle multiple files
    for (let i = 0; i < files.length; i++) {
      await uploadSingleFile(files[i]);
    }
  };

  const uploadSingleFile = async (file: File) => {
    setIsUploading(true);
    setUploadingFileName(file.name);
    setUploadProgress(10); // Mock progress for UI feedback

    try {
      const result = await uploadMedia(file);
      setMediaItems(prev => [result, ...prev]);
      setSuccess(`"${file.name}" uploaded successfully!`);
      toast.success(`"${file.name}" uploaded`);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(`Upload failed for "${file.name}". Please try again.`);
      toast.error(`Failed to upload "${file.name}"`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName(null);
    }
  };

  const handleDeleteMedia = async (mediaId: string, mediaName: string) => {
    if (!confirm(`Are you sure you want to delete "${mediaName}"?`)) return;

    try {
      await deleteMedia(mediaId);
      setMediaItems(prev => prev.filter(item => item._id !== mediaId));
      setSuccess(`"${mediaName}" deleted successfully!`);
      toast.success(`"${mediaName}" deleted`);
    } catch (error: any) {
      console.error('Delete error:', error);
      setError('Failed to delete media');
      toast.error("Failed to delete media");
    }
  };

  const handleDownloadMedia = (mediaUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileType = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return 'video';
    return 'document';
  };

  const getFileIcon = (url: string) => {
    const type = getFileType(url);
    switch (type) {
      case "image":
        return <Image className="w-8 h-8 text-blue-500" />;
      case "video":
        return <Video className="w-8 h-8 text-red-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files;
      handleFileUpload({ target: { files } } as any);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Media Library</span>
            <Badge variant="secondary" className="ml-2">
              {mediaItems.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-primary bg-muted/50"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uploading {uploadingFileName}... {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="file-upload" className="cursor-pointer align-center inline-flex gap-2">
                    <Button variant="outline" asChild>
                      <span>Choose files</span>
                    </Button>
                    <Input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    or drag and drop files here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports images, videos, PDFs, and documents (max 50MB)
                  </p>
                </>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Loading media...</span>
              </div>
            ) : (
              <>
                {mediaItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mediaItems.map((item) => (
                      <Card key={item._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="px-4">
                          <div className="mb-3 overflow-hidden rounded-lg bg-muted/30">
                            <img
                              src={item.url}
                              alt={item.altText || "Media preview"}
                              className="h-40 w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate" title={item.altText}>
                                {item.altText}
                              </p>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {getFileType(item.url)}
                              </Badge>
                            </div>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground truncate overflow-hidden block hover:underline">
                              {item.url.split('/').pop()}
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadMedia(item.url, item.altText || 'download')}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMedia(item._id, item.altText || 'media')}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No media files found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm ? 'Try adjusting your search terms' : 'Upload your first file to get started'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
