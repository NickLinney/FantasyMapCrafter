import React from 'react';
import TileMapEditor from '@/components/TileMapEditor';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-neutral-800 text-white shadow-md">
        <div className="container mx-auto py-3 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg 
              className="h-8 w-8 mr-2 text-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
              <path d="M12 22v-6"></path>
              <path d="M22 8.5l-10 7-10-7"></path>
              <path d="M2 15.5l10-7 10 7"></path>
              <path d="M12 2v6"></path>
            </svg>
            <h1 className="text-lg font-bold">Fantasy Tile Map Maker</h1>
          </div>
          <div className="flex items-center">
            {/* For future implementation of user authentication */}
            <button className="flex items-center space-x-2 bg-neutral-700 hover:bg-neutral-600 rounded-md px-3 py-1.5 transition">
              <span className="text-xs">Sign In</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Editor */}
      <TileMapEditor />
    </div>
  );
};

export default Home;
