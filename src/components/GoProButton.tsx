
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const GoProButton = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to="/waitlist" 
            state={{ from: 'pro' }}
            className="flex-1 w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-700 text-white font-black text-lg shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 border-0 relative overflow-hidden group"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              <span className="relative z-10 font-black">✨ Go Pro</span>
              
              {/* Enhanced glow effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-gray-700 max-w-xs">
          <p className="text-sm font-medium">
            🚀 Unlock premium features: CSV exports, batch processing, AI redaction & more
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
