import { EditorState } from "./mapTypes";
import { TilePosition, Layer } from "@shared/schema";

// Calculate the position on canvas based on map coordinates
export function mapToCanvasPosition(
  x: number,
  y: number,
  tileSize: number,
  mapType: 'grid' | 'hex'
): { x: number, y: number } {
  if (mapType === 'grid') {
    return { 
      x: x * tileSize, 
      y: y * tileSize 
    };
  } else {
    // For hexagonal grid (flat-topped)
    const hexHeight = tileSize;
    const hexWidth = tileSize * 1.15;
    const yOffset = (x % 2 === 0) ? 0 : tileSize / 2;
    
    return {
      x: x * (hexWidth * 0.75),
      y: y * hexHeight + yOffset
    };
  }
}

// Calculate the map coordinates based on canvas position
export function canvasToMapPosition(
  x: number,
  y: number,
  tileSize: number,
  mapType: 'grid' | 'hex'
): { x: number, y: number } {
  if (mapType === 'grid') {
    return { 
      x: Math.floor(x / tileSize), 
      y: Math.floor(y / tileSize) 
    };
  } else {
    // For hexagonal grid (more complex calculation)
    const hexHeight = tileSize;
    const hexWidth = tileSize * 1.15;
    
    const hexColumn = Math.floor(x / (hexWidth * 0.75));
    const hexRow = Math.floor(y / hexHeight - (hexColumn % 2 ? 0.5 : 0));
    
    return { x: hexColumn, y: hexRow };
  }
}

// Draw the grid on canvas
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number,
  mapType: 'grid' | 'hex'
): void {
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
  ctx.lineWidth = 1;
  
  if (mapType === 'grid') {
    // Draw vertical lines
    for (let x = 0; x <= width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height * tileSize);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width * tileSize, y);
      ctx.stroke();
    }
  } else {
    // Draw hexagonal grid
    const hexHeight = tileSize;
    const hexWidth = tileSize * 1.15;
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const { x, y } = mapToCanvasPosition(col, row, tileSize, 'hex');
        drawHexagon(ctx, x, y, tileSize);
      }
    }
  }
}

// Helper function to draw a hexagon
function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  const hexHeight = size;
  const hexWidth = size * 1.15;
  
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30;
    const angleRad = Math.PI / 180 * angleDeg;
    const xPos = x + hexWidth / 2 * Math.cos(angleRad);
    const yPos = y + hexHeight / 2 * Math.sin(angleRad);
    
    if (i === 0) {
      ctx.moveTo(xPos, yPos);
    } else {
      ctx.lineTo(xPos, yPos);
    }
  }
  ctx.closePath();
  ctx.stroke();
}

// Draw the tiles on canvas from a tileset
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tilesetImg: HTMLImageElement,
  tilePosition: TilePosition,
  x: number,
  y: number,
  tileSize: number,
  mapType: 'grid' | 'hex'
): void {
  const { x: tileX, y: tileY } = tilePosition;
  
  const sourceX = tileX * tileSize;
  const sourceY = tileY * tileSize;
  
  const { x: destX, y: destY } = mapToCanvasPosition(x, y, tileSize, mapType);
  
  ctx.drawImage(
    tilesetImg,
    sourceX, sourceY, tileSize, tileSize,
    destX, destY, tileSize, tileSize
  );
}

// Draw all layers to the canvas
export function drawAllLayers(
  ctx: CanvasRenderingContext2D,
  tilesets: Map<number, HTMLImageElement>,
  layers: Layer[],
  tileSize: number,
  mapType: 'grid' | 'hex'
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw all visible layers from bottom to top
  layers.forEach(layer => {
    if (layer.visible) {
      drawLayer(ctx, tilesets, layer, tileSize, mapType);
    }
  });
}

// Draw a single layer to the canvas
function drawLayer(
  ctx: CanvasRenderingContext2D,
  tilesets: Map<number, HTMLImageElement>,
  layer: Layer,
  tileSize: number,
  mapType: 'grid' | 'hex'
): void {
  for (let y = 0; y < layer.tiles.length; y++) {
    for (let x = 0; x < layer.tiles[y].length; x++) {
      const tile = layer.tiles[y][x];
      
      if (tile) {
        // Parse the tile data
        const [tilesetId, tileX, tileY] = tile.split(',').map(Number);
        
        const tilesetImg = tilesets.get(tilesetId);
        if (tilesetImg) {
          drawTile(
            ctx,
            tilesetImg,
            { tilesetId, x: tileX, y: tileY },
            x,
            y,
            tileSize,
            mapType
          );
        }
      }
    }
  }
}

// Apply selected tool to the map
export function applyTool(
  state: EditorState,
  x: number,
  y: number,
  tool: string
): EditorState {
  if (!state.selectedTile && tool !== 'eraser') {
    return state;
  }
  
  const newLayers = [...state.layers];
  const currentLayer = newLayers[state.currentLayer];
  
  // Clone the current layer's tiles to avoid direct mutation
  const newTiles = currentLayer.tiles.map(row => [...row]);
  
  switch (tool) {
    case 'smallBrush':
      if (state.selectedTile) {
        setTile(
          newTiles,
          x,
          y,
          state.selectedTile,
          state.mapSize
        );
      }
      break;
      
    case 'largeBrush':
      if (state.selectedTile) {
        // Draw a 3x3 area
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            setTile(
              newTiles,
              x + dx,
              y + dy,
              state.selectedTile,
              state.mapSize
            );
          }
        }
      }
      break;
      
    case 'fill':
      if (state.selectedTile) {
        const targetValue = newTiles[y][x];
        floodFill(
          newTiles,
          x,
          y,
          targetValue,
          `${state.selectedTile.tilesetId},${state.selectedTile.x},${state.selectedTile.y}`,
          state.mapSize
        );
      }
      break;
      
    case 'eraser':
      setTile(
        newTiles,
        x,
        y,
        null,
        state.mapSize
      );
      break;
  }
  
  // Update the layer with new tiles
  newLayers[state.currentLayer] = {
    ...currentLayer,
    tiles: newTiles
  };
  
  return {
    ...state,
    layers: newLayers
  };
}

// Set a tile at the specified position
function setTile(
  tiles: (string | null)[][],
  x: number,
  y: number,
  tilePosition: TilePosition | null,
  mapSize: MapSize
): void {
  // Check bounds
  if (x < 0 || y < 0 || x >= mapSize.width || y >= mapSize.height) {
    return;
  }
  
  if (tilePosition === null) {
    tiles[y][x] = null;
  } else {
    tiles[y][x] = `${tilePosition.tilesetId},${tilePosition.x},${tilePosition.y}`;
  }
}

// Flood fill algorithm
function floodFill(
  tiles: (string | null)[][],
  x: number,
  y: number,
  targetValue: string | null,
  replacementValue: string,
  mapSize: MapSize
): void {
  // Check bounds
  if (x < 0 || y < 0 || x >= mapSize.width || y >= mapSize.height) {
    return;
  }
  
  // Check if we've already filled this or if it's not the target value
  if (tiles[y][x] !== targetValue) {
    return;
  }
  
  // Fill the current position
  tiles[y][x] = replacementValue;
  
  // Recursive fill in 4 directions
  floodFill(tiles, x + 1, y, targetValue, replacementValue, mapSize);
  floodFill(tiles, x - 1, y, targetValue, replacementValue, mapSize);
  floodFill(tiles, x, y + 1, targetValue, replacementValue, mapSize);
  floodFill(tiles, x, y - 1, targetValue, replacementValue, mapSize);
}

// Export the canvas to a PNG
export function exportCanvasToPng(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}
