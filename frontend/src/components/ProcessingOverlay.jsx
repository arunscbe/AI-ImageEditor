import React from 'react';
import { Settings } from 'lucide-react';
import useStore from '../store/useStore';

const ProcessingOverlay = () => {
  const { isProcessing, processingMessage } = useStore();

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-brand-primary px-8 py-6 flex items-center gap-4 animate-fade-in">
        <div className="relative">
          <Settings
            className="text-brand-primary animate-spin"
            size={32}
            strokeWidth={2}
          />
        </div>
        <div>
          <p className="text-lg font-heading font-bold text-gray-900">
            Processing...
          </p>
          <p className="text-sm text-gray-600 font-sans">
            {processingMessage || 'Please wait'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;


