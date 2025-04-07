import React, { useRef, useEffect, useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { drawGrid, canvasToMapPosition, drawAllLayers } from '@/lib/canvasUtils';

interface CanvasProps {
  onNewMapClick: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ onNewMapClick }) => {
  const { 
    state, 
    loadedTilesetImages, 
    setCursorPosition, 
    applyToolAtPosition,
    setZoomLevel 
  } = useEditor();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mapInfo, setMapInfo] = useState('');
  
  // Update canvas size when map size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas size based on map dimensions and tile size
    canvas.width = state.mapSize.width * state.tileSize;
    canvas.height = state.mapSize.height * state.tileSize;
    
    // Scale the canvas based on zoom level
    const scaleFactor = state.zoomLevel / 100;
    canvas.style.width = `${canvas.width * scaleFactor}px`;
    canvas.style.height = `${canvas.height * scaleFactor}px`;
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the grid
    drawGrid(
      context,
      state.mapSize.width,
      state.mapSize.height,
      state.tileSize,
      state.mapType
    );
    
    // Draw all visible layers
    drawAllLayers(
      context,
      loadedTilesetImages,
      state.layers,
      state.tileSize,
      state.mapType
    );
    
    // Update map info
    setMapInfo(`Map: ${state.mapSize.width}x${state.mapSize.height} (${state.mapType === 'grid' ? 'Grid' : 'Hex'}) | Tile Size: ${state.tileSize}px`);
  }, [state.mapSize, state.tileSize, state.mapType, state.layers, state.zoomLevel, loadedTilesetImages]);
  
  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const { x: mapX, y: mapY } = canvasToMapPosition(x, y, state.tileSize, state.mapType);
    
    applyToolAtPosition(mapX, mapY);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const { x: mapX, y: mapY } = canvasToMapPosition(x, y, state.tileSize, state.mapType);
    
    setCursorPosition(mapX, mapY);
    
    if (isDragging) {
      applyToolAtPosition(mapX, mapY);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
    setCursorPosition(-1, -1);
  };
  
  const handleZoomIn = () => {
    setZoomLevel(Math.min(state.zoomLevel + 25, 200));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(state.zoomLevel - 25, 50));
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative bg-neutral-700">
      {/* Canvas Controls */}
      <div className="bg-neutral-800 text-white p-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <label htmlFor="mapType" className="text-xs uppercase font-medium">Map Type:</label>
            <Select value={state.mapType} onValueChange={(val: 'grid' | 'hex') => useEditor().setMapType(val)}>
              <SelectTrigger className="bg-neutral-700 border-neutral-600 w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="hex">Hexagonal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-1">
            <label htmlFor="tileSize" className="text-xs uppercase font-medium">Tile Size:</label>
            <Select value={state.tileSize.toString()} onValueChange={(val) => useEditor().setTileSize(parseInt(val))}>
              <SelectTrigger className="bg-neutral-700 border-neutral-600 w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="24">24px</SelectItem>
                <SelectItem value="32">32px</SelectItem>
                <SelectItem value="40">40px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-1">
            <label htmlFor="mapSize" className="text-xs uppercase font-medium">Map Size:</label>
            <Select 
              value={`${state.mapSize.width}x${state.mapSize.height}`} 
              onValueChange={(val) => {
                const [width, height] = val.split('x').map(Number);
                useEditor().setMapSize(width, height);
              }}
            >
              <SelectTrigger className="bg-neutral-700 border-neutral-600 w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16x16">16x16</SelectItem>
                <SelectItem value="32x32">32x32</SelectItem>
                <SelectItem value="64x64">64x64</SelectItem>
                <SelectItem value="128x128">128x128</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center justify-center" 
            onClick={onNewMapClick}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            New Map
          </Button>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white" 
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm">{state.zoomLevel}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white" 
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 overflow-auto relative" id="canvasContainer">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="transparent-bg" style={{
            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ 
                cursor: 'crosshair', 
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-neutral-800 text-white px-3 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span>
            Position: X={state.cursorPosition?.x ?? '-'}, Y={state.cursorPosition?.y ?? '-'}
          </span>
          <span>
            Tool: {state.selectedTool}
          </span>
        </div>
        <div>
          {mapInfo}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
