import React, { useEffect } from 'react';
import TileMapEditor from '@/components/TileMapEditor';
import Navbar from '@/components/Navbar';
import { EditorProvider, useEditor } from '@/contexts/EditorContext';
import { useToast } from '@/hooks/use-toast';

// This is the inner component that uses the EditorContext
const HomeContent: React.FC = () => {
  const { loadMap } = useEditor();
  const { toast } = useToast();
  
  // Check for map to load from localStorage (set by dashboard)
  useEffect(() => {
    const mapToLoad = localStorage.getItem('mapToLoad');
    if (mapToLoad) {
      const mapId = parseInt(mapToLoad);
      // Clear the localStorage item to prevent loading on every render
      localStorage.removeItem('mapToLoad');
      
      // Load the map using the editor context
      loadMap(mapId).then(() => {
        toast({
          title: 'Map Loaded',
          description: 'Map loaded successfully from your saved maps',
        });
      }).catch(err => {
        console.error('Error loading map:', err);
        toast({
          title: 'Error Loading Map',
          description: 'Failed to load the map',
          variant: 'destructive',
        });
      });
    }
  }, [loadMap, toast]);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      
      {/* Main Editor */}
      <TileMapEditor />
    </div>
  );
};

// This is the wrapper component that provides the EditorContext
const Home: React.FC = () => {
  return (
    <EditorProvider>
      <HomeContent />
    </EditorProvider>
  );
};

export default Home;
