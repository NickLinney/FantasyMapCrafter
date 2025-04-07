import React, { useState } from 'react';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import TilesetPanel from './TilesetPanel';
import { EditorProvider } from '@/contexts/EditorContext';
import SaveMapModal from './modals/SaveMapModal';
import ExportModal from './modals/ExportModal';
import NewMapModal from '@/pages/NewMapModal';
import { useToast } from '@/hooks/use-toast';

const TileMapEditor: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [newMapModalOpen, setNewMapModalOpen] = useState(false);
  const [layerManagerOpen, setLayerManagerOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveClick = () => {
    setSaveModalOpen(true);
  };

  const handleExportClick = () => {
    setExportModalOpen(true);
  };

  const handleNewMapClick = () => {
    setNewMapModalOpen(true);
  };

  const handleLayerManagerClick = () => {
    setLayerManagerOpen(prev => !prev);
    toast({
      title: "Layer Management",
      description: "Layer management is available in the sidebar panel.",
    });
  };

  return (
    <EditorProvider>
      <div className="flex flex-1 overflow-hidden">
        <Toolbar 
          onSaveClick={handleSaveClick}
          onExportClick={handleExportClick}
          onLayerManagerClick={handleLayerManagerClick}
        />
        <Canvas onNewMapClick={handleNewMapClick} />
        <TilesetPanel />

        {saveModalOpen && (
          <SaveMapModal 
            open={saveModalOpen} 
            onClose={() => setSaveModalOpen(false)}
          />
        )}

        {exportModalOpen && (
          <ExportModal 
            open={exportModalOpen} 
            onClose={() => setExportModalOpen(false)}
          />
        )}

        {newMapModalOpen && (
          <NewMapModal 
            open={newMapModalOpen} 
            onClose={() => setNewMapModalOpen(false)}
          />
        )}
      </div>
    </EditorProvider>
  );
};

export default TileMapEditor;
