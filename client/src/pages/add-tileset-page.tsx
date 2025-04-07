import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import Navbar from '@/components/Navbar';

const AddTilesetPage = () => {
  const [name, setName] = useState('');
  const [tileWidth, setTileWidth] = useState(16);
  const [tileHeight, setTileHeight] = useState(16);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive'
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Calculate the grid dimensions based on the image size and tile dimensions
      const img = new window.Image();
      img.onload = () => {
        const width = Math.floor(img.width / tileWidth);
        const height = Math.floor(img.height / tileHeight);
        setGridWidth(width);
        setGridHeight(height);
      };
      img.src = url;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image file for the tileset.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!name) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the tileset.',
        variant: 'destructive'
      });
      return;
    }
    
    if (tileWidth <= 0 || tileHeight <= 0) {
      toast({
        title: 'Invalid tile dimensions',
        description: 'Tile width and height must be positive values.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('tileWidth', tileWidth.toString());
      formData.append('tileHeight', tileHeight.toString());
      formData.append('gridWidth', gridWidth.toString());
      formData.append('gridHeight', gridHeight.toString());
      formData.append('image', selectedFile);
      
      const response = await fetch('/api/tilesets', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload tileset: ${response.statusText}`);
      }
      
      toast({
        title: 'Tileset uploaded',
        description: 'Your tileset was successfully uploaded.',
      });
      
      // Redirect back to the main application
      setLocation('/');
    } catch (error) {
      console.error('Error uploading tileset:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button 
          variant="ghost" 
          className="mb-6 text-sm"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map Editor
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Add New Tileset</CardTitle>
            <CardDescription>
              Upload a tileset image and configure its properties. The image will be divided into a grid of tiles based on the specified tile width and height.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tileset Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Fantasy Terrain"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tileWidth">Tile Width (px)</Label>
                <Input
                  id="tileWidth"
                  type="number"
                  min="1"
                  value={tileWidth}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setTileWidth(value);
                    if (selectedFile && value > 0) {
                      const img = new window.Image();
                      img.onload = () => setGridWidth(Math.floor(img.width / value));
                      img.src = previewUrl;
                    }
                  }}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tileHeight">Tile Height (px)</Label>
                <Input
                  id="tileHeight"
                  type="number"
                  min="1"
                  value={tileHeight}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setTileHeight(value);
                    if (selectedFile && value > 0) {
                      const img = new window.Image();
                      img.onload = () => setGridHeight(Math.floor(img.height / value));
                      img.src = previewUrl;
                    }
                  }}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Tileset Image</Label>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                  className="w-full flex items-center justify-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              {previewUrl && (
                <div className="mt-4 p-2 border rounded">
                  <h3 className="text-sm font-medium mb-2">Preview</h3>
                  <div className="flex items-center justify-center bg-neutral-100 p-2 rounded">
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="Tileset preview" 
                        className="max-h-64 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="absolute inset-0 border border-dashed border-primary/50 pointer-events-none"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm text-neutral-600">
                    <span>Selected file: {selectedFile?.name}</span>
                    <span>Grid size: {gridWidth} × {gridHeight} tiles</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation('/')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Tileset'}
              </Button>
            </CardFooter>
          </form>
      </Card>
      </div>
    </div>
  );
};

export default AddTilesetPage;