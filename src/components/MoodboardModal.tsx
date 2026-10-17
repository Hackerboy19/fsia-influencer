import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Heart } from 'lucide-react';
import { useDialog, Portal } from '../lib/dialog';

interface MoodboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: string[];
  onRemoveItem: (url: string) => void;
  onClearAll: () => void;
}

export default function MoodboardModal({ isOpen, onClose, items, onRemoveItem, onClearAll }: MoodboardModalProps) {
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <Portal>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="moodboard-title"
          tabIndex={-1}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-black/5 bg-[#F4F3F0]/60">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-600 fill-red-600" aria-hidden="true" />
              <h2 id="moodboard-title" className="font-serif-display text-2xl font-bold tracking-tight text-[#111]">
                My Moodboard
              </h2>
              <span className="bg-black/5 text-[#444] px-2 py-0.5 rounded-full text-xs font-bold font-sans">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close moodboard"
              className="p-2.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#333]" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-3">
                <Heart className="w-12 h-12 text-black/15" aria-hidden="true" />
                <p className="font-serif-text text-[#2e2c29] text-lg">Your moodboard is empty.</p>
                <p className="font-sans text-xs text-[#47453f] tracking-wider uppercase">Heart lookbook photos to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-[3/4] border border-black/5 shadow-sm">
                    <img 
                      src={url} 
                      alt={`Saved lookbook photo ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button
                        onClick={() => onRemoveItem(url)}
                        className="w-11 h-11 rounded-full bg-black/50 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove from moodboard"
                        aria-label={`Remove saved photo ${idx + 1} from moodboard`}
                      >
                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-black/5 bg-[#F4F3F0]/30 flex justify-end">
              <button
                onClick={onClearAll}
                className="text-xs font-sans font-bold tracking-widest uppercase text-red-700 hover:text-red-800 px-4 py-2.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
    </Portal>
  );
}
