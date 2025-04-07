import React from 'react';
import TileMapEditor from '@/components/TileMapEditor';
import Navbar from '@/components/Navbar';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      
      {/* Main Editor */}
      <TileMapEditor />
    </div>
  );
};

export default Home;
