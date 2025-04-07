import React from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  GridIcon, 
  Paintbrush, 
  PaintBucket, 
  Eraser, 
  Layers, 
  Save, 
  Download 
} from 'lucide-react';
import { DrawingTool } from '@shared/schema';

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, tooltip, active = false, onClick }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="icon"
          className={`w-10 h-10 ${active ? 'bg-primary' : 'bg-white hover:bg-primary/20'} rounded-md shadow-sm transition-all`}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

interface ToolbarProps {
  onSaveClick: () => void;
  onExportClick: () => void;
  onLayerManagerClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onSaveClick, 
  onExportClick,
  onLayerManagerClick 
}) => {
  const { state, setSelectedTool, setMapType } = useEditor();
  
  const handleToolClick = (tool: DrawingTool) => {
    setSelectedTool(tool);
  };
  
  const handleGridToggle = () => {
    setMapType(state.mapType === 'grid' ? 'hex' : 'grid');
  };

  return (
    <div className="w-16 bg-neutral-200 border-r border-neutral-300 flex flex-col items-center py-4">
      {/* Tool Buttons */}
      <div className="space-y-3">
        <ToolButton
          icon={<GridIcon className="h-5 w-5" />}
          tooltip={`Map Type: ${state.mapType === 'grid' ? 'Grid' : 'Hex'}`}
          active={false}
          onClick={handleGridToggle}
        />
        
        <ToolButton
          icon={<Paintbrush className="h-5 w-5" />}
          tooltip="Small Brush"
          active={state.selectedTool === 'smallBrush'}
          onClick={() => handleToolClick('smallBrush')}
        />
        
        <ToolButton
          icon={<Paintbrush className="h-6 w-6" />}
          tooltip="Large Brush"
          active={state.selectedTool === 'largeBrush'}
          onClick={() => handleToolClick('largeBrush')}
        />
        
        <ToolButton
          icon={<PaintBucket className="h-5 w-5" />}
          tooltip="Fill Tool"
          active={state.selectedTool === 'fill'}
          onClick={() => handleToolClick('fill')}
        />
        
        <ToolButton
          icon={<Eraser className="h-5 w-5" />}
          tooltip="Eraser"
          active={state.selectedTool === 'eraser'}
          onClick={() => handleToolClick('eraser')}
        />
      </div>
      
      <div className="mt-6 w-full border-t border-neutral-300"></div>
      
      {/* Layer Management */}
      <div className="mt-6 space-y-3">
        <ToolButton
          icon={<Layers className="h-5 w-5" />}
          tooltip="Manage Layers"
          onClick={onLayerManagerClick}
        />
        
        <div className="bg-white px-2 py-1 rounded-md shadow-sm flex items-center justify-center">
          <span className="text-sm font-medium">{state.currentLayer + 1}</span>
        </div>
      </div>
      
      <div className="mt-auto space-y-3">
        <ToolButton
          icon={<Save className="h-5 w-5" />}
          tooltip="Save Map"
          onClick={onSaveClick}
        />
        
        <ToolButton
          icon={<Download className="h-5 w-5" />}
          tooltip="Export PNG"
          onClick={onExportClick}
        />
      </div>
    </div>
  );
};

export default Toolbar;
