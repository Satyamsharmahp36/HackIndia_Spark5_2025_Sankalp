import { Button } from "./ui/button";
import { X } from 'lucide-react';

interface PromotionPopupProps {
  onClose: () => void;
}

export default function PromotionPopup({ onClose }: PromotionPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl max-w-md w-full relative overflow-hidden border border-white/10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎁</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Special Offer!</h2>
            <p className="text-gray-400">Sign up now and get 30% off your first 3 months</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Unlimited messages and tasks</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Priority customer support</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Advanced analytics dashboard</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/signup'}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 text-lg"
            >
              Claim Your 30% Off
            </Button>
            <Button 
              onClick={onClose}
              variant="outline" 
              className="w-full py-3 text-lg"
            >
              Maybe Later
            </Button>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 text-center text-sm text-gray-400">
          Limited time offer. New customers only.
        </div>
      </div>
    </div>
  );
}
