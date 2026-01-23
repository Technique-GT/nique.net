import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Music, ExternalLink } from "lucide-react";
import { Main } from "@/components/layout/main";
import { PageHeader } from "@/components/layout/page-header";
import {
  usePlaylists,
  useCreatePlaylist,
  useUpdatePlaylist,
  useDeletePlaylist,
  useSetActivePlaylist,
  type Playlist,
} from "@/hooks/use-queries";

const toSpotifyEmbedUrl = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const uriMatch = trimmed.match(/^spotify:playlist:([A-Za-z0-9]+)$/);
  if (uriMatch) {
    return `https://open.spotify.com/embed/playlist/${uriMatch[1]}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname !== "open.spotify.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts[0] === "embed" && parts[1] === "playlist" && parts[2]) {
      return parsed.toString();
    }

    if (parts[0] === "playlist" && parts[1]) {
      const embedUrl = new URL(`https://open.spotify.com/embed/playlist/${parts[1]}`);
      embedUrl.search = parsed.search;
      return embedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
};

export default function SpotifyPlaylistManager() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    spotifyUrl: ""
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
  const activeEmbedUrl = activePlaylist ? toSpotifyEmbedUrl(activePlaylist.spotifyUrl) : null;

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
      spotifyUrl: ""
    });
    setEditingPlaylist(null);
  };

  const openEditDialog = (playlist: Playlist) => {
    setFormData({
      name: playlist.name,
      description: playlist.description,
      spotifyUrl: playlist.spotifyUrl
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
      <Main>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Music className="w-12 h-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading playlists...</p>
          </div>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <PageHeader
        title="Spotify Playlist Manager"
          description="Manage your Spotify playlists and set active playlists for your app"
          actions={
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
                    <Label htmlFor="name">Playlist Name<span className="text-destructive">*</span></Label>
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
                    <Label htmlFor="spotifyUrl">Spotify Playlist URL<span className="text-destructive">*</span></Label>
                    <Input
                      id="spotifyUrl"
                      type="url"
                      value={formData.spotifyUrl}
                      onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                      placeholder="https://open.spotify.com/playlist/..."
                      required
                    />
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
          }
        />

        <Tabs defaultValue="playlists" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="player">Player</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="space-y-4">
          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first Spotify playlist
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Playlist
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {playlists.map((playlist) => {
                const embedUrl = toSpotifyEmbedUrl(playlist.spotifyUrl);
                return (
                  <div key={playlist._id} className={`h-[60vh] ${
                    playlist.isActive ? 'ring-3 ring-emerald-500 rounded-[11px]' : ''
                  }`}>
                      <div className="relative group h-full">
                        {embedUrl ? (
                          <iframe
                            className="w-full h-full"
                            src={embedUrl}
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            title={`${playlist.name} playlist`}
                          />
                        ) : (
                          <div className="w-full h-80 bg-muted flex items-center justify-center">
                            <Music className="w-16 h-16 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-md bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                          <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 pointer-events-auto">
                            <Switch
                              checked={playlist.isActive}
                              onCheckedChange={() => handleSetActive(playlist._id)}
                              disabled={setActivePlaylistMutation.isPending}
                              aria-label={playlist.isActive ? "Deactivate playlist" : "Set active playlist"}
                              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/30"
                            />
                            <span className="text-xs text-white">
                              {playlist.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="absolute bottom-2 left-2 flex items-center gap-2 pointer-events-auto">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => openEditDialog(playlist)}
                            aria-label="Edit playlist"
                            className="pointer-events-auto shadow-md"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            asChild
                            className="pointer-events-auto shadow-md"
                          >
                            <a
                              href={playlist.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open in Spotify"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(playlist._id)}
                            disabled={deletePlaylistMutation.isPending}
                            aria-label="Delete playlist"
                            className="pointer-events-auto shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          </div>
                        </div>
                        {playlist.isActive && (
                          <Badge className="absolute top-2 right-2 bg-green-500">
                            Active
                          </Badge>
                        )}
                      </div>
                      {/* <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{playlist.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {playlist.description}
                        </p>
                      </div> */}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="player">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Now Playing</h2>
              <p className="text-sm text-muted-foreground">
                {activePlaylist 
                  ? `Active Playlist: ${activePlaylist.name}`
                  : 'No active playlist selected'
                }
              </p>
            </div>
            <div className="p-6 space-y-6">
              {activePlaylist ? (
                <div className="h-[70vh]">
                  {activeEmbedUrl ? (
                    <iframe
                      className="w-full h-full rounded-md border"
                      src={activeEmbedUrl}
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title={`${activePlaylist.name} playlist`}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Unable to generate an embed URL from this playlist link.
                    </p>
                  )}

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
                </div>
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
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </Main>
  );
}
