
import { useState } from 'react';
import { Info, Shield, Lock, Eye, Server, Monitor } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const SecurityInfoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 transition-colors">
          <Info className="h-3 w-3" />
          <span>Learn More</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-800">
            <Shield className="h-5 w-5" />
            Your Privacy & Security
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              What does "Client-Side" mean?
            </h3>
            <p className="text-sm text-gray-600">
              Client-side processing means everything happens directly in your web browser. 
              Your PDF files are processed using JavaScript that runs on your device, 
              not on our servers or in the cloud.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              Nothing Ever Leaves Your Browser
            </h3>
            <p className="text-sm text-gray-600">
              Your files never travel across the internet. They stay on your device 
              from upload to download. We can't see your files, and neither can anyone else.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              Why This Is Safer
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Traditional PDF tools upload your files to cloud servers for processing. 
              This creates security risks and privacy concerns.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-red-800 mb-2">
                  <Server className="h-3 w-3" />
                  Cloud-Based Tools
                </div>
                <ul className="space-y-1 text-red-700">
                  <li>• Files uploaded to servers</li>
                  <li>• Data stored temporarily</li>
                  <li>• Potential security breaches</li>
                  <li>• Privacy policies to trust</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-green-800 mb-2">
                  <Monitor className="h-3 w-3" />
                  Our Tool
                </div>
                <ul className="space-y-1 text-green-700">
                  <li>• Files never leave your device</li>
                  <li>• No server storage</li>
                  <li>• Zero security risk</li>
                  <li>• Complete privacy guaranteed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Technical Note:</strong> We use PDF-lib, a JavaScript library 
              that runs entirely in your browser to merge PDF files. This is the same 
              technology used by privacy-focused applications worldwide.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
