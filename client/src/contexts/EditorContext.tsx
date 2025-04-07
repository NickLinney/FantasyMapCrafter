import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EditorState, createInitialEditorState, createEmptyLayer } from '@/lib/mapTypes';
import { createNewMap } from '@/lib/mapTypes';
import { DrawingTool, Tileset, TilePosition } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface EditorContextType {
  state: EditorState;
  tilesets: Tileset[];
  loadedTilesetImages: Map<number, HTMLImageElement>;
  isLoading: boolean;
  
  // Map actions
  setMapType: (type: 'grid' | 'hex') => void;
  setTileSize: (size: number) => void;
  setMapSize: (width: number, height: number) => void;
  createNewMap: (type: 'grid' | 'hex', tileSize: number, width: number, height: number) => void;
  saveMap: (name: string, description?: string) => Promise<number>;
  loadMap: (id: number) => Promise<void>;
  
  // Layer actions
  addLayer: () => void;
  removeLayer: (index: number) => void;
  setCurrentLayer: (index: number) => void;
  toggleLayerVisibility: (index: number) => void;
  renameLayer: (index: number, name: string) => void;
  
  // Tool actions
  setSelectedTool: (tool: DrawingTool) => void;
  setSelectedTileset: (id: number | null) => void;
  setSelectedTile: (tile: TilePosition | null) => void;
  setMultiTileSelection: (width: number, height: number, tiles: (TilePosition | null)[][]) => void;
  setCursorPosition: (x: number, y: number) => void;
  setZoomLevel: (level: number) => void;
  
  // Drawing actions
  applyToolAtPosition: (x: number, y: number) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>(createInitialEditorState());
  const [tilesets, setTilesets] = useState<Tileset[]>([]);
  const [loadedTilesetImages, setLoadedTilesetImages] = useState<Map<number, HTMLImageElement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Load available tilesets
  useEffect(() => {
    const loadTilesets = async () => {
      try {
        const response = await fetch('/api/tilesets');
        if (!response.ok) {
          throw new Error('Failed to load tilesets');
        }
        
        const data = await response.json();
        setTilesets(data);
        
        // Preload tileset images
        const imageMap = new Map<number, HTMLImageElement>();
        
        await Promise.all(data.map(async (tileset: Tileset) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              imageMap.set(tileset.id, img);
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load tileset image: ${tileset.imageUrl}`);
              resolve();
            };
            img.src = tileset.imageUrl;
          });
        }));
        
        setLoadedTilesetImages(imageMap);
        setIsLoading(false);
        
        // Select the first tileset by default
        if (data.length > 0) {
          setState(prevState => ({
            ...prevState,
            selectedTileset: data[0].id
          }));
        }
      } catch (error) {
        console.error('Error loading tilesets:', error);
        setIsLoading(false);
      }
    };
    
    loadTilesets();
  }, []);

  // Map actions
  const setMapType = (type: 'grid' | 'hex') => {
    setState(prevState => ({ ...prevState, mapType: type }));
  };
  
  const setTileSize = (size: number) => {
    setState(prevState => ({ ...prevState, tileSize: size }));
  };
  
  const setMapSize = (width: number, height: number) => {
    setState(prevState => ({
      ...prevState,
      mapSize: { width, height },
      // Resize all layers
      layers: prevState.layers.map(layer => {
        const newTiles = Array(height)
          .fill(null)
          .map((_, y) => 
            Array(width)
              .fill(null)
              .map((_, x) => 
                y < layer.tiles.length && x < layer.tiles[0].length 
                  ? layer.tiles[y][x] 
                  : null
              )
          );
        
        return {
          ...layer,
          tiles: newTiles
        };
      })
    }));
  };
  
  const createNewMapAction = (type: 'grid' | 'hex', tileSize: number, width: number, height: number) => {
    setState(createNewMap(type, tileSize, width, height));
  };
  
  const saveMap = async (name: string, description?: string): Promise<number> => {
    try {
      const response = await apiRequest('POST', '/api/maps', {
        name,
        description,
        width: state.mapSize.width,
        height: state.mapSize.height,
        tileSize: state.tileSize,
        mapType: state.mapType,
        layers: state.layers,
        userId: null,  // Replace with actual user ID if authentication is implemented
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const savedMap = await response.json();
      return savedMap.id;
    } catch (error) {
      console.error('Error saving map:', error);
      throw error;
    }
  };
  
  const loadMap = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/maps/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load map');
      }
      
      const map = await response.json();
      
      setState({
        mapType: map.mapType,
        tileSize: map.tileSize,
        mapSize: { width: map.width, height: map.height },
        selectedTool: 'smallBrush',
        currentLayer: 0,
        layers: map.layers,
        selectedTileset: tilesets.length > 0 ? tilesets[0].id : null,
        selectedTile: null,
        multiTileSelection: {
          width: 1,
          height: 1,
          tiles: [[null]]
        },
        cursorPosition: null,
        zoomLevel: 100
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading map:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  // Layer actions
  const addLayer = () => {
    setState(prevState => {
      const newLayer = createEmptyLayer(
        prevState.mapSize.width,
        prevState.mapSize.height,
        `Layer ${prevState.layers.length + 1}`
      );
      
      return {
        ...prevState,
        layers: [...prevState.layers, newLayer],
        currentLayer: prevState.layers.length  // Select the new layer
      };
    });
  };
  
  const removeLayer = (index: number) => {
    setState(prevState => {
      // Don't remove the last layer
      if (prevState.layers.length <= 1) {
        return prevState;
      }
      
      const newLayers = [...prevState.layers];
      newLayers.splice(index, 1);
      
      let newCurrentLayer = prevState.currentLayer;
      if (newCurrentLayer >= newLayers.length) {
        newCurrentLayer = newLayers.length - 1;
      }
      
      return {
        ...prevState,
        layers: newLayers,
        currentLayer: newCurrentLayer
      };
    });
  };
  
  const setCurrentLayer = (index: number) => {
    setState(prevState => ({
      ...prevState,
      currentLayer: index
    }));
  };
  
  const toggleLayerVisibility = (index: number) => {
    setState(prevState => {
      const newLayers = [...prevState.layers];
      newLayers[index] = {
        ...newLayers[index],
        visible: !newLayers[index].visible
      };
      
      return {
        ...prevState,
        layers: newLayers
      };
    });
  };
  
  const renameLayer = (index: number, name: string) => {
    setState(prevState => {
      const newLayers = [...prevState.layers];
      newLayers[index] = {
        ...newLayers[index],
        name
      };
      
      return {
        ...prevState,
        layers: newLayers
      };
    });
  };
  
  // Tool actions
  const setSelectedTool = (tool: DrawingTool) => {
    setState(prevState => ({
      ...prevState,
      selectedTool: tool
    }));
  };
  
  const setSelectedTileset = (id: number | null) => {
    setState(prevState => ({
      ...prevState,
      selectedTileset: id,
      selectedTile: null  // Reset selected tile when changing tileset
    }));
  };
  
  const setSelectedTile = (tile: TilePosition | null) => {
    setState(prevState => ({
      ...prevState,
      selectedTile: tile,
      // Reset multi-tile selection when selecting a single tile
      multiTileSelection: {
        width: 1,
        height: 1,
        tiles: tile ? [[tile]] : [[null]]
      }
    }));
  };
  
  const setMultiTileSelection = (width: number, height: number, tiles: (TilePosition | null)[][]) => {
    setState(prevState => ({
      ...prevState,
      multiTileSelection: {
        width,
        height,
        tiles
      },
      // Also update the selected tile to be the first non-null tile in the selection
      selectedTile: tiles.flat().find(tile => tile !== null) || null
    }));
  };
  
  const setCursorPosition = (x: number, y: number) => {
    setState(prevState => ({
      ...prevState,
      cursorPosition: { x, y }
    }));
  };
  
  const setZoomLevel = (level: number) => {
    setState(prevState => ({
      ...prevState,
      zoomLevel: level
    }));
  };
  
  // Drawing actions
  const applyToolAtPosition = (x: number, y: number) => {
    setState(prevState => {
      const newLayers = [...prevState.layers];
      const currentLayer = newLayers[prevState.currentLayer];
      
      // Clone the current layer's tiles to avoid direct mutation
      const newTiles = currentLayer.tiles.map(row => [...row]);
      
      // Check bounds
      if (x < 0 || y < 0 || x >= prevState.mapSize.width || y >= prevState.mapSize.height) {
        return prevState;
      }
      
      switch (prevState.selectedTool) {
        case 'smallBrush':
          if (prevState.selectedTile) {
            newTiles[y][x] = `${prevState.selectedTile.tilesetId},${prevState.selectedTile.x},${prevState.selectedTile.y}`;
          }
          break;
          
        case 'largeBrush':
          if (prevState.selectedTile) {
            // Draw a 3x3 area
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && ny >= 0 && nx < prevState.mapSize.width && ny < prevState.mapSize.height) {
                  newTiles[ny][nx] = `${prevState.selectedTile.tilesetId},${prevState.selectedTile.x},${prevState.selectedTile.y}`;
                }
              }
            }
          }
          break;
          
        case 'fill':
          if (prevState.selectedTile) {
            const targetValue = newTiles[y][x];
            const replacementValue = `${prevState.selectedTile.tilesetId},${prevState.selectedTile.x},${prevState.selectedTile.y}`;
            
            // Don't do anything if target is already the replacement
            if (targetValue === replacementValue) {
              return prevState;
            }
            
            // Simple queue-based flood fill
            const queue = [{x, y}];
            while (queue.length > 0) {
              const {x: cx, y: cy} = queue.shift()!;
              
              if (cx < 0 || cy < 0 || cx >= prevState.mapSize.width || cy >= prevState.mapSize.height) {
                continue;
              }
              
              if (newTiles[cy][cx] !== targetValue) {
                continue;
              }
              
              newTiles[cy][cx] = replacementValue;
              
              queue.push({x: cx + 1, y: cy});
              queue.push({x: cx - 1, y: cy});
              queue.push({x: cx, y: cy + 1});
              queue.push({x: cx, y: cy - 1});
            }
          }
          break;
          
        case 'eraser':
          newTiles[y][x] = null;
          break;
      }
      
      // Update the layer with new tiles
      newLayers[prevState.currentLayer] = {
        ...currentLayer,
        tiles: newTiles
      };
      
      return {
        ...prevState,
        layers: newLayers
      };
    });
  };

  const value = {
    state,
    tilesets,
    loadedTilesetImages,
    isLoading,
    
    // Map actions
    setMapType,
    setTileSize,
    setMapSize,
    createNewMap: createNewMapAction,
    saveMap,
    loadMap,
    
    // Layer actions
    addLayer,
    removeLayer,
    setCurrentLayer,
    toggleLayerVisibility,
    renameLayer,
    
    // Tool actions
    setSelectedTool,
    setSelectedTileset,
    setSelectedTile,
    setMultiTileSelection,
    setCursorPosition,
    setZoomLevel,
    
    // Drawing actions
    applyToolAtPosition
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
