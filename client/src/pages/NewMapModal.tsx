import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEditor } from '@/contexts/EditorContext';
import { useToast } from '@/hooks/use-toast';

interface NewMapModalProps {
  open: boolean;
  onClose: () => void;
}

const NewMapModal: React.FC<NewMapModalProps> = ({ open, onClose }) => {
  const [mapType, setMapType] = useState<'grid' | 'hex'>('grid');
  const [tileSize, setTileSize] = useState('16');
  const [mapSize, setMapSize] = useState('64x64');
  
  const { createNewMap } = useEditor();
  const { toast } = useToast();
  
  const handleCreateMap = () => {
    const [width, height] = mapSize.split('x').map(Number);
    
    try {
      createNewMap(mapType, parseInt(tileSize), width, height);
      
      toast({
        title: "New Map Created",
        description: `Created a new ${mapType} map with size ${width}x${height} and tile size ${tileSize}px.`
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to create new map:", error);
      toast({
        title: "Error Creating Map",
        description: "There was an error creating your map. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Map</DialogTitle>
          <DialogDescription>
            Configure the settings for your new map.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mapType" className="text-right">
              Map Type
            </Label>
            <Select value={mapType} onValueChange={(value: 'grid' | 'hex') => setMapType(value)}>
              <SelectTrigger id="mapType" className="col-span-3">
                <SelectValue placeholder="Select map type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="hex">Hexagonal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tileSize" className="text-right">
              Tile Size
            </Label>
            <Select value={tileSize} onValueChange={setTileSize}>
              <SelectTrigger id="tileSize" className="col-span-3">
                <SelectValue placeholder="Select tile size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="24">24px</SelectItem>
                <SelectItem value="32">32px</SelectItem>
                <SelectItem value="40">40px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mapSize" className="text-right">
              Map Size
            </Label>
            <Select value={mapSize} onValueChange={setMapSize}>
              <SelectTrigger id="mapSize" className="col-span-3">
                <SelectValue placeholder="Select map size" />
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateMap}>
            Create Map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewMapModal;
