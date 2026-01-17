import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Play, Pause, Music, ExternalLink } from "lucide-react";
import {
  usePlaylists,
  useCreatePlaylist,
  useUpdatePlaylist,
  useDeletePlaylist,
  useSetActivePlaylist,
  type Playlist,
} from "@/hooks/use-queries";

export default function SpotifyPlaylistManager() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    spotifyUrl: "",
    image: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // TanStack Query hooks
  const { data: playlists = [], isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const updatePlaylist = useUpdatePlaylist();
  const deletePlaylistMutation = useDeletePlaylist();
  const setActivePlaylistMutation = useSetActivePlaylist();

  // Find active playlist
  const activePlaylist = useMemo(() => {
    return playlists.find(p => p.isActive) || null;
  }, [playlists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlaylist) {
        await updatePlaylist.mutateAsync({ id: editingPlaylist._id, data: formData });
      } else {
        await createPlaylist.mutateAsync(formData);
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await deletePlaylistMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await setActivePlaylistMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error setting active playlist:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      spotifyUrl: "",
      image: ""
    });
    setEditingPlaylist(null);
  };

  const openEditDialog = (playlist: Playlist) => {
    setFormData({
      name: playlist.name,
      description: playlist.description,
      spotifyUrl: playlist.spotifyUrl,
      image: playlist.image
    });
    setEditingPlaylist(playlist);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Music className="w-12 h-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Spotify Playlist Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Spotify playlists and set active playlists for your app
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlaylist ? 'Edit Playlist' : 'Add New Playlist'}
              </DialogTitle>
              <DialogDescription>
                {editingPlaylist 
                  ? 'Update your Spotify playlist information.' 
                  : 'Add a new Spotify playlist to your collection.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Playlist Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome Playlist"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Perfect for coding sessions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spotifyUrl">Spotify Playlist URL</Label>
                <Input
                  id="spotifyUrl"
                  type="url"
                  value={formData.spotifyUrl}
                  onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/playlist/..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Cover Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/playlist-cover.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to use default music icon
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPlaylist.isPending || updatePlaylist.isPending}
                >
                  {(createPlaylist.isPending || updatePlaylist.isPending) 
                    ? 'Saving...' 
                    : (editingPlaylist ? 'Update Playlist' : 'Create Playlist')
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Tabs defaultValue="playlists" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="player">Player</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="space-y-4">
          {playlists.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first Spotify playlist
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Playlist
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {playlists.map((playlist, index) => (
                  <motion.div
                    key={playlist._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`h-full transition-all hover:shadow-lg ${
                      playlist.isActive ? 'ring-2 ring-green-500' : ''
                    }`}>
                      <CardContent className="p-0">
                        <div className="aspect-square w-full bg-muted relative group">
                          {playlist.image ? (
                            <img
                              src={playlist.image}
                              alt={playlist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-16 h-16 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditDialog(playlist)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDelete(playlist._id)}
                              disabled={deletePlaylistMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {playlist.isActive && (
                            <Badge className="absolute top-2 right-2 bg-green-500">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-1">{playlist.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {playlist.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <Button
                              variant={playlist.isActive ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSetActive(playlist._id)}
                              disabled={playlist.isActive || setActivePlaylistMutation.isPending}
                            >
                              {playlist.isActive ? 'Active' : 'Set Active'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={playlist.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="player">
          <Card>
            <CardHeader>
              <CardTitle>Now Playing</CardTitle>
              <CardDescription>
                {activePlaylist 
                  ? `Active Playlist: ${activePlaylist.name}`
                  : 'No active playlist selected'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activePlaylist ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {activePlaylist.image ? (
                        <img
                          src={activePlaylist.image}
                          alt={activePlaylist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl">{activePlaylist.name}</h3>
                      <p className="text-muted-foreground">{activePlaylist.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Spotify Playlist • {new Date(activePlaylist.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1 bg-muted rounded-full">
                      <div className="h-1 bg-primary rounded-full w-1/3"></div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>1:15</span>
                      <span>3:45</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <Button
                      size="icon"
                      className="w-12 h-12"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button asChild variant="outline">
                      <a
                        href={activePlaylist.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Spotify
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No active playlist</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a playlist from the Playlists tab to start playing
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Playlist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
