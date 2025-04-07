import { TilePosition, Layer, DrawingTool, MapSize } from "@shared/schema";

export interface EditorState {
  mapType: 'grid' | 'hex';
  tileSize: number;
  mapSize: MapSize;
  selectedTool: DrawingTool;
  currentLayer: number;
  layers: Layer[];
  selectedTileset: number | null;
  selectedTile: TilePosition | null;
  multiTileSelection: {
    width: number;
    height: number;
    tiles: (TilePosition | null)[][];
  };
  cursorPosition: { x: number; y: number } | null;
  zoomLevel: number;
}

export interface Tile {
  id: string;
  position: {
    x: number;
    y: number;
  };
  tilesetId: number;
  tilesetPosition: {
    x: number;
    y: number;
  };
}

export function createEmptyLayer(width: number, height: number, name: string): Layer {
  const tiles = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    visible: true,
    tiles
  };
}

export function createInitialEditorState(
  mapType: 'grid' | 'hex' = 'grid',
  tileSize: number = 16,
  width: number = 64,
  height: number = 64
): EditorState {
  const baseLayer = createEmptyLayer(width, height, "Layer 1 (Base)");
  
  return {
    mapType,
    tileSize,
    mapSize: { width, height },
    selectedTool: 'smallBrush',
    currentLayer: 0,
    layers: [baseLayer],
    selectedTileset: null,
    selectedTile: null,
    multiTileSelection: {
      width: 1,
      height: 1,
      tiles: [[null]]
    },
    cursorPosition: null,
    zoomLevel: 100
  };
}

export function createNewMap(
  mapType: 'grid' | 'hex',
  tileSize: number,
  width: number,
  height: number
): EditorState {
  return createInitialEditorState(mapType, tileSize, width, height);
}
