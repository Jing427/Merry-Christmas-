import React from 'react';
import { TreeMorphState } from '../types';

interface OverlayProps {
  state: TreeMorphState;
  onToggle: (newState: TreeMorphState) => void;
}

const Overlay: React.FC<OverlayProps> = ({ state, onToggle }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <div className="flex flex-col items-center pointer-events-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-arix-gold tracking-widest uppercase text-center drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] whitespace-nowrap">
          MERRY CHRISTMAS
        </h1>
        <p className="text-arix-goldLight text-xs md:text-sm tracking-[0.3em] mt-2 uppercase opacity-80">
          The Holiday Collection
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center mb-10 pointer-events-auto">
        <div className="flex gap-4 p-1 bg-black/30 backdrop-blur-md rounded-full border border-arix-gold/20">
            <button
                onClick={() => onToggle(TreeMorphState.SCATTERED)}
                className={`px-6 py-2 rounded-full font-serif tracking-widest transition-all duration-500 ${
                    state === TreeMorphState.SCATTERED 
                    ? 'bg-arix-gold text-arix-dark shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                    : 'text-arix-gold hover:bg-white/5'
                }`}
            >
                SCATTER
            </button>
            <button
                onClick={() => onToggle(TreeMorphState.TREE_SHAPE)}
                className={`px-6 py-2 rounded-full font-serif tracking-widest transition-all duration-500 ${
                    state === TreeMorphState.TREE_SHAPE 
                    ? 'bg-arix-gold text-arix-dark shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                    : 'text-arix-gold hover:bg-white/5'
                }`}
            >
                TREE
            </button>
        </div>
      </div>
    </div>
  );
};

export default Overlay;