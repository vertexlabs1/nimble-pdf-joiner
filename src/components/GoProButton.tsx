
import { useState, useEffect } from 'react';
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
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    // Trigger sparkle animation on component mount
    const timer = setTimeout(() => {
      setShowSparkle(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/waitlist" className="flex-1 w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-700 text-white font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 animate-pulse-glow border-0 relative overflow-hidden group"
            >
              <Sparkles 
                className={`h-4 w-4 mr-2 ${showSparkle ? 'animate-sparkle' : ''}`} 
              />
              <span className="relative z-10">✨ Go Pro</span>
              
              {/* Glow effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-gray-700 max-w-xs">
          <p className="text-sm font-medium">
            Unlock CSV exports, redaction, batch uploads & more
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
