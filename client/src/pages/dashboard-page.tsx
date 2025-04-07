import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { Loader2, MapPin, Search, Trash2 } from "lucide-react";
import { Map, Tileset } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // We'll handle the loadMap function separately since we're outside the EditorProvider
  
  // Fetch maps
  const {
    data: maps,
    isLoading: isLoadingMaps,
    error: mapsError,
  } = useQuery<Map[]>({
    queryKey: ["/api/maps", { userId: user?.id }],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch public tilesets
  const {
    data: publicTilesets,
    isLoading: isLoadingPublicTilesets,
    error: publicTilesetsError,
  } = useQuery<Tileset[]>({
    queryKey: ["/api/tilesets/public"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch user's tileset collection
  const {
    data: collectionTilesets,
    isLoading: isLoadingCollectionTilesets,
    error: collectionTilesetsError,
  } = useQuery<Tileset[]>({
    queryKey: ["/api/tilesets/collection"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  const filteredMaps = maps?.filter(map => 
    map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (map.description && map.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredPublicTilesets = publicTilesets?.filter(tileset => 
    tileset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredCollectionTilesets = collectionTilesets?.filter(tileset => 
    tileset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleLoadMap = async (mapId: number) => {
    try {
      // Instead of using the loadMap method from the EditorContext,
      // we'll set a mapId in localStorage and then navigate to the home page
      localStorage.setItem('mapToLoad', mapId.toString());
      setLocation("/");
      toast({
        title: "Opening Map",
        description: "Redirecting to editor with the selected map",
      });
    } catch (error) {
      toast({
        title: "Error Loading Map",
        description: "Failed to load the map",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteMap = async (mapId: number) => {
    try {
      const response = await fetch(`/api/maps/${mapId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        // Invalidate the maps query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/maps"] });
        toast({
          title: "Map Deleted",
          description: "Map deleted successfully",
        });
      } else {
        throw new Error("Failed to delete map");
      }
    } catch (error) {
      toast({
        title: "Error Deleting Map",
        description: "Failed to delete the map",
        variant: "destructive",
      });
    }
  };
  
  const handleAddToCollection = async (tilesetId: number) => {
    try {
      const response = await fetch(`/api/tilesets/collection/${tilesetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        // Invalidate the collection query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/tilesets/collection"] });
        toast({
          title: "Tileset Added",
          description: "Tileset added to your collection",
        });
      } else {
        throw new Error("Failed to add tileset to collection");
      }
    } catch (error) {
      toast({
        title: "Error Adding Tileset",
        description: "Failed to add the tileset to your collection",
        variant: "destructive",
      });
    }
  };
  
  const handleRemoveFromCollection = async (tilesetId: number) => {
    try {
      const response = await fetch(`/api/tilesets/collection/${tilesetId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        // Invalidate the collection query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/tilesets/collection"] });
        toast({
          title: "Tileset Removed",
          description: "Tileset removed from your collection",
        });
      } else {
        throw new Error("Failed to remove tileset from collection");
      }
    } catch (error) {
      toast({
        title: "Error Removing Tileset",
        description: "Failed to remove the tileset from your collection",
        variant: "destructive",
      });
    }
  };
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">You need to be logged in to access the dashboard</h1>
        <Button onClick={() => setLocation("/auth")}>Go to Login</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => setLocation("/")}>Back to Editor</Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search maps and tilesets..." 
          className="pl-10" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>
      
      <Tabs defaultValue="maps">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="maps">My Maps</TabsTrigger>
          <TabsTrigger value="publicTilesets">Public Tilesets</TabsTrigger>
          <TabsTrigger value="collection">My Collection</TabsTrigger>
        </TabsList>
        
        <TabsContent value="maps" className="mt-6">
          {isLoadingMaps && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {mapsError && (
            <div className="text-center text-destructive py-10">
              Failed to load maps
            </div>
          )}
          
          {!isLoadingMaps && filteredMaps?.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No maps found</p>
              <Button className="mt-4" onClick={() => setLocation("/")}>Create a New Map</Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaps?.map((map) => (
              <Card key={map.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{map.name}</CardTitle>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="outline">{map.mapType}</Badge>
                    <Badge variant="outline">{`${map.width}x${map.height}`}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    {map.description || "No description provided"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date(map.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    variant="default" 
                    onClick={() => handleLoadMap(map.id)}
                  >
                    Load Map
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteMap(map.id)}
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="publicTilesets" className="mt-6">
          {isLoadingPublicTilesets && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {publicTilesetsError && (
            <div className="text-center text-destructive py-10">
              Failed to load public tilesets
            </div>
          )}
          
          {!isLoadingPublicTilesets && filteredPublicTilesets?.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No public tilesets found</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPublicTilesets?.map((tileset) => (
              <Card key={tileset.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{tileset.name}</CardTitle>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="outline">{`${tileset.gridWidth}x${tileset.gridHeight}`}</Badge>
                    <Badge variant="outline">{`Tile: ${tileset.tileWidth}x${tileset.tileHeight}`}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center pb-2">
                  <div className="w-full h-36 relative overflow-hidden bg-secondary/20 rounded-md">
                    <img
                      src={tileset.imageUrl}
                      alt={tileset.name}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="default"
                    className="w-full"
                    onClick={() => handleAddToCollection(tileset.id)}
                  >
                    Add to Collection
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="collection" className="mt-6">
          {isLoadingCollectionTilesets && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {collectionTilesetsError && (
            <div className="text-center text-destructive py-10">
              Failed to load your tileset collection
            </div>
          )}
          
          {!isLoadingCollectionTilesets && filteredCollectionTilesets?.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No tilesets in your collection</p>
              <Button className="mt-4" onClick={() => document.querySelector('[value="publicTilesets"]')?.dispatchEvent(new Event('click'))}>
                Browse Public Tilesets
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollectionTilesets?.map((tileset) => (
              <Card key={tileset.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{tileset.name}</CardTitle>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="outline">{`${tileset.gridWidth}x${tileset.gridHeight}`}</Badge>
                    <Badge variant="outline">{`Tile: ${tileset.tileWidth}x${tileset.tileHeight}`}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center pb-2">
                  <div className="w-full h-36 relative overflow-hidden bg-secondary/20 rounded-md">
                    <img
                      src={tileset.imageUrl}
                      alt={tileset.name}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleRemoveFromCollection(tileset.id)}
                  >
                    Remove from Collection
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}