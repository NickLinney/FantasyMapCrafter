import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useEditor } from '@/contexts/EditorContext';
import { useToast } from '@/hooks/use-toast';
import { exportCanvasToPng, drawGrid } from '@/lib/canvasUtils';
import FileSaver from 'file-saver';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose }) => {
  const [exportFormat, setExportFormat] = useState('png');
  const [includeGridLines, setIncludeGridLines] = useState(true);
  const [exportAllLayers, setExportAllLayers] = useState(true);
  const [exportViewportOnly, setExportViewportOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { state, loadedTilesetImages } = useEditor();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Create a temporary canvas without the brush preview
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      
      // Find the original canvas to get its dimensions
      const originalCanvas = document.querySelector('canvas');
      
      if (!originalCanvas || !ctx) {
        throw new Error("Canvas not found");
      }
      
      // Set the temp canvas to the same dimensions
      tempCanvas.width = originalCanvas.width;
      tempCanvas.height = originalCanvas.height;
      
      // Draw the grid if needed
      if (includeGridLines) {
        drawGrid(
          ctx,
          state.mapSize.width,
          state.mapSize.height,
          state.tileSize,
          state.mapType
        );
      }
      
      // Draw all layers or just the current one
      if (exportAllLayers) {
        const visibleLayers = state.layers.filter(layer => layer.visible);
        for (const layer of visibleLayers) {
          // Draw each layer
          for (let y = 0; y < layer.tiles.length; y++) {
            for (let x = 0; x < layer.tiles[y].length; x++) {
              const tile = layer.tiles[y][x];
              if (tile) {
                // Parse the tile data
                const [tilesetId, tileX, tileY] = tile.split(',').map(Number);
                const tilesetImg = loadedTilesetImages.get(tilesetId);
                
                if (tilesetImg) {
                  // Calculate positions and draw
                  const sourceX = tileX * state.tileSize;
                  const sourceY = tileY * state.tileSize;
                  const destX = x * state.tileSize;
                  const destY = y * state.tileSize;
                  
                  ctx.drawImage(
                    tilesetImg,
                    sourceX, sourceY, state.tileSize, state.tileSize,
                    destX, destY, state.tileSize, state.tileSize
                  );
                }
              }
            }
          }
        }
      } else {
        // Just draw the current layer
        const layer = state.layers[state.currentLayer];
        if (layer.visible) {
          for (let y = 0; y < layer.tiles.length; y++) {
            for (let x = 0; x < layer.tiles[y].length; x++) {
              const tile = layer.tiles[y][x];
              if (tile) {
                // Parse the tile data
                const [tilesetId, tileX, tileY] = tile.split(',').map(Number);
                const tilesetImg = loadedTilesetImages.get(tilesetId);
                
                if (tilesetImg) {
                  // Calculate positions and draw
                  const sourceX = tileX * state.tileSize;
                  const sourceY = tileY * state.tileSize;
                  const destX = x * state.tileSize;
                  const destY = y * state.tileSize;
                  
                  ctx.drawImage(
                    tilesetImg,
                    sourceX, sourceY, state.tileSize, state.tileSize,
                    destX, destY, state.tileSize, state.tileSize
                  );
                }
              }
            }
          }
        }
      }
      
      // Export as PNG
      if (exportFormat === 'png' || exportFormat === 'both') {
        const dataUrl = tempCanvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        FileSaver.saveAs(blob, `map-${state.mapSize.width}x${state.mapSize.height}.png`);
      }
      
      // Export as JSON
      if (exportFormat === 'json' || exportFormat === 'both') {
        const mapData = {
          mapType: state.mapType,
          tileSize: state.tileSize,
          width: state.mapSize.width,
          height: state.mapSize.height,
          layers: exportAllLayers ? state.layers : [state.layers[state.currentLayer]]
        };
        
        const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: "application/json" });
        FileSaver.saveAs(blob, `map-${state.mapSize.width}x${state.mapSize.height}.json`);
      }
      
      toast({
        title: "Export Successful",
        description: "Your map has been exported successfully."
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to export map:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your map. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Map</DialogTitle>
          <DialogDescription>
            Choose export options for your map.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="exportFormat">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger id="exportFormat">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem value="json">Map Data (JSON)</SelectItem>
                <SelectItem value="both">Both PNG & JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Export Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeGridLines" 
                checked={includeGridLines} 
                onCheckedChange={(checked) => setIncludeGridLines(!!checked)} 
              />
              <Label htmlFor="includeGridLines" className="text-sm font-normal">
                Include grid lines
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="exportAllLayers" 
                checked={exportAllLayers} 
                onCheckedChange={(checked) => setExportAllLayers(!!checked)} 
              />
              <Label htmlFor="exportAllLayers" className="text-sm font-normal">
                Export all layers
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="exportViewportOnly" 
                checked={exportViewportOnly} 
                onCheckedChange={(checked) => setExportViewportOnly(!!checked)} 
              />
              <Label htmlFor="exportViewportOnly" className="text-sm font-normal">
                Export viewport only
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
