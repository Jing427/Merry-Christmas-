import React, { useState } from 'react';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import { TreeMorphState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);

  return (
    <div className="relative w-full h-screen bg-arix-dark overflow-hidden">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Experience treeState={treeState} />
      </div>

      {/* UI Overlay Layer */}
      <Overlay state={treeState} onToggle={setTreeState} />
      
      {/* Decorative Border Frame */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-arix-gold/10 m-4 md:m-8 rounded-sm" />
    </div>
  );
};

export default App;