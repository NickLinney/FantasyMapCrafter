import React, { useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusIcon, Trash2, Eye, Edit, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TilePosition } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TilesetPanel: React.FC = () => {
  const { 
    state, 
    tilesets, 
    loadedTilesetImages,
    setSelectedTileset,
    setSelectedTile,
    setCurrentLayer,
    toggleLayerVisibility,
    addLayer,
    removeLayer,
    renameLayer
  } = useEditor();
  
  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(null);
  const [newLayerName, setNewLayerName] = useState('');
  const [multiTileSize, setMultiTileSize] = useState(1);
  
  const handleTileClick = (tilesetId: number, x: number, y: number) => {
    setSelectedTile({ tilesetId, x, y });
  };
  
  const handleMultiTileSelection = (size: number) => {
    setMultiTileSize(size);
    // This is a simplified implementation
    // For a full implementation, we'd need to gather the actual tiles
    // from the selected area in the tileset
  };
  
  const handleLayerClick = (index: number) => {
    setCurrentLayer(index);
  };
  
  const handleLayerVisibilityToggle = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLayerVisibility(index);
  };
  
  const handleEditLayerName = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLayerIndex(index);
    setNewLayerName(state.layers[index].name);
  };
  
  const handleSaveLayerName = (index: number) => {
    if (newLayerName.trim()) {
      renameLayer(index, newLayerName);
    }
    setEditingLayerIndex(null);
  };
  
  const handleAddLayer = () => {
    addLayer();
  };
  
  const handleRemoveLayer = () => {
    if (state.layers.length > 1) {
      removeLayer(state.currentLayer);
    }
  };
  
  // Find the selected tileset
  const selectedTileset = tilesets.find(t => t.id === state.selectedTileset);
  
  return (
    <div className="w-64 bg-neutral-100 border-l border-neutral-300 flex flex-col">
      {/* Tileset Selection */}
      <div className="p-3 bg-neutral-200 border-b border-neutral-300">
        <h2 className="font-medium text-neutral-800 mb-2">Tilesets</h2>
        <div className="flex space-x-2 mb-2">
          <Select 
            value={state.selectedTileset?.toString() || ''} 
            onValueChange={(value) => setSelectedTileset(parseInt(value))}
          >
            <SelectTrigger className="flex-1 border border-neutral-400 h-8">
              <SelectValue placeholder="Select tileset" />
            </SelectTrigger>
            <SelectContent>
              {tilesets.map((tileset) => (
                <SelectItem key={tileset.id} value={tileset.id.toString()}>
                  {tileset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tileset Browser */}
      <div className="flex-1 overflow-y-auto p-2" id="tilesetBrowser">
        {selectedTileset && loadedTilesetImages.has(selectedTileset.id) && (
          <div className="bg-white rounded shadow-sm p-2 mb-3">
            <div className="flex flex-wrap gap-1 mb-2">
              {Array.from({ length: selectedTileset.gridHeight }).map((_, y) => (
                Array.from({ length: selectedTileset.gridWidth }).map((_, x) => (
                  <div 
                    key={`${x}-${y}`}
                    className={`w-8 h-8 bg-cover bg-center cursor-pointer hover:ring-2 hover:ring-primary ${
                      state.selectedTile && 
                      state.selectedTile.tilesetId === selectedTileset.id && 
                      state.selectedTile.x === x && 
                      state.selectedTile.y === y 
                        ? 'ring-2 ring-primary' 
                        : ''
                    }`}
                    style={{
                      backgroundImage: `url(${selectedTileset.imageUrl})`,
                      backgroundPosition: `-${x * selectedTileset.tileWidth}px -${y * selectedTileset.tileHeight}px`,
                      backgroundSize: `${selectedTileset.gridWidth * selectedTileset.tileWidth}px ${selectedTileset.gridHeight * selectedTileset.tileHeight}px`
                    }}
                    onClick={() => handleTileClick(selectedTileset.id, x, y)}
                  />
                ))
              )).flat()}
            </div>
            
            {state.selectedTile && (
              <div className="bg-neutral-200 p-2 rounded mt-2">
                <h3 className="text-sm font-medium text-neutral-800 mb-1">Selection</h3>
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 bg-cover bg-center border-2 border-primary"
                    style={{
                      backgroundImage: `url(${selectedTileset.imageUrl})`,
                      backgroundPosition: `-${state.selectedTile.x * selectedTileset.tileWidth}px -${state.selectedTile.y * selectedTileset.tileHeight}px`,
                      backgroundSize: `${selectedTileset.gridWidth * selectedTileset.tileWidth}px ${selectedTileset.gridHeight * selectedTileset.tileHeight}px`
                    }}
                  />
                  <div>
                    <p className="text-xs text-neutral-600">{selectedTileset.name}</p>
                    <p className="text-xs text-neutral-600">{selectedTileset.tileWidth}x{selectedTileset.tileHeight}px</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-white rounded shadow-sm p-2">
          <h3 className="text-sm font-medium text-neutral-800 mb-2">Multi-Tile Selection</h3>
          <div className="bg-neutral-200 p-2 rounded flex space-x-2">
            <Button 
              variant={multiTileSize === 1 ? "default" : "outline"} 
              size="sm" 
              className="text-xs"
              onClick={() => handleMultiTileSelection(1)}
            >
              1x1
            </Button>
            <Button 
              variant={multiTileSize === 2 ? "default" : "outline"} 
              size="sm" 
              className="text-xs"
              onClick={() => handleMultiTileSelection(2)}
            >
              2x2
            </Button>
            <Button 
              variant={multiTileSize === 3 ? "default" : "outline"} 
              size="sm" 
              className="text-xs"
              onClick={() => handleMultiTileSelection(3)}
            >
              3x3
            </Button>
          </div>
          {/* Multi-tile selection preview would go here in a full implementation */}
        </div>
      </div>
      
      {/* Layer Control Panel */}
      <div className="p-3 bg-neutral-200 border-t border-neutral-300">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-neutral-800">Layers</h2>
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handleAddLayer}
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handleRemoveLayer}
              disabled={state.layers.length <= 1}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          {state.layers.map((layer, index) => (
            <div 
              key={layer.id}
              className={`flex items-center justify-between ${
                index === state.currentLayer 
                  ? 'bg-primary-light' 
                  : 'bg-white hover:bg-neutral-50'
              } p-1.5 rounded cursor-pointer`}
              onClick={() => handleLayerClick(index)}
            >
              <div className="flex items-center">
                <Checkbox 
                  id={`layer-${index}-visibility`} 
                  checked={layer.visible} 
                  onCheckedChange={() => toggleLayerVisibility(index)}
                  className="mr-2"
                />
                {editingLayerIndex === index ? (
                  <Input
                    value={newLayerName}
                    onChange={(e) => setNewLayerName(e.target.value)}
                    onBlur={() => handleSaveLayerName(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveLayerName(index);
                      }
                    }}
                    className="h-6 text-sm"
                    autoFocus
                  />
                ) : (
                  <span className={`text-sm ${index === state.currentLayer ? 'font-medium' : ''}`}>
                    {layer.name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => handleLayerVisibilityToggle(index, e)}
                >
                  {layer.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => handleEditLayerName(index, e)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TilesetPanel;
