import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useEditor } from '@/contexts/EditorContext';
import { useToast } from '@/hooks/use-toast';

interface SaveMapModalProps {
  open: boolean;
  onClose: () => void;
}

const SaveMapModal: React.FC<SaveMapModalProps> = ({ open, onClose }) => {
  const [mapName, setMapName] = useState('Untitled Map');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { saveMap } = useEditor();
  const { toast } = useToast();
  
  const handleSave = async () => {
    if (!mapName.trim()) {
      toast({
        title: "Error",
        description: "Map name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      const mapId = await saveMap(mapName, description || undefined);
      
      toast({
        title: "Map Saved",
        description: `Map "${mapName}" has been saved successfully.`
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to save map:", error);
      toast({
        title: "Error Saving Map",
        description: "There was an error saving your map. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Map</DialogTitle>
          <DialogDescription>
            Give your map a name and optional description before saving.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mapName" className="text-right">
              Map Name
            </Label>
            <Input
              id="mapName"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Optional description"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMapModal;
