import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}

export default function ToolPage({ title, description, icon: Icon, features }: ToolPageProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>

      {/* Tool Interface */}
      <div className="bg-card rounded-xl p-8 border shadow-sm">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="p-6 bg-muted/50 rounded-full w-fit mx-auto">
            <Icon className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-card-foreground">Coming Soon</h3>
            <p className="text-muted-foreground">
              This powerful {title.toLowerCase()} tool is currently in development
            </p>
          </div>

          {features.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-card-foreground">Planned Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          )}

          <Button disabled className="mt-6">
            {title} Tool - Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
}