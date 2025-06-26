
import { Shield, Lock, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export const SecurityCallout = () => {
  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <div className="flex items-center justify-center mb-4">
        <div className="bg-green-100 p-3 rounded-full">
          <Shield className="h-6 w-6 text-green-600" />
        </div>
      </div>
      <Link to="/privacy" className="block">
        <h3 className="text-xl font-semibold text-center mb-3 text-green-800 hover:text-green-900 transition-colors cursor-pointer">
          100% Private & Secure
        </h3>
      </Link>
      <p className="text-center text-gray-700 mb-4">
        Your PDF files are processed entirely in your browser. Nothing is uploaded to our servers.
      </p>
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center gap-2 text-green-700">
          <Lock className="h-4 w-4" />
          <span>No uploads</span>
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <Eye className="h-4 w-4" />
          <span>No tracking</span>
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <Shield className="h-4 w-4" />
          <span>Client-side only</span>
        </div>
      </div>
    </Card>
  );
};
