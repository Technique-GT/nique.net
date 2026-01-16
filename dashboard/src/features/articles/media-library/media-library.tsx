import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Search, Image, File, Video, Trash2, Loader2, Download } from "lucide-react";
import { API_BASE_URL } from '../../../config';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  createdAt: string;
  uploader: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  

  // Fetch media items
  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${API_BASE_URL}/media?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMediaItems(data.data);
      } else {
        setError(data.message || 'Failed to fetch media');
      }
    } catch (error: any) {
      console.error('Error fetching media:', error);
      setError('Network error. Please check your connection.');
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
    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setMediaItems(prev => [response.data, ...prev]);
            setSuccess(`"${file.name}" uploaded successfully!`);
          } else {
            setError(response.message || `Failed to upload "${file.name}"`);
          }
        } else {
          setError(`Upload failed for "${file.name}"`);
        }
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
      });

      xhr.addEventListener('error', () => {
        setError(`Upload failed for "${file.name}". Please try again.`);
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
      });

      xhr.open('POST', `${API_BASE_URL}/media/upload`);
      xhr.send(formData);

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(`Upload failed for "${file.name}". Please try again.`);
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const handleDeleteMedia = async (mediaId: string, mediaName: string) => {
    if (!confirm(`Are you sure you want to delete "${mediaName}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setMediaItems(prev => prev.filter(item => item._id !== mediaId));
        setSuccess(`"${mediaName}" deleted successfully!`);
      } else {
        setError(data.message || 'Failed to delete media');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      setError('Failed to delete media');
    }
  };

  const handleDownloadMedia = (mediaUrl: string, fileName: string) => {
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  };

  const getFileIcon = (mimeType: string) => {
    const type = getFileType(mimeType);
    switch (type) {
      case "image":
        return <Image className="w-8 h-8 text-blue-500" />;
      case "video":
        return <Video className="w-8 h-8 text-red-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            {/* Success/Error Messages */}
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

            {/* Upload Section */}
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
                    Uploading {selectedFile?.name}... {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
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

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Media Grid */}
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
                        <CardContent className="p-4">
                          <div className="flex items-center justify-center mb-3 h-16">
                            {getFileIcon(item.mimeType)}
                          </div>
                          <div className="text-center space-y-1 mb-3">
                            <p className="text-sm font-medium truncate" title={item.originalName}>
                              {item.originalName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(item.size)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {getFileType(item.mimeType)}
                            </Badge>
                          </div>
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadMedia(item.url, item.originalName)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(item.url)}
                              title="Copy URL"
                            >
                              Copy URL
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMedia(item._id, item.originalName)}
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
