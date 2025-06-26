
import { Upload, ArrowRight, Shuffle, Download } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload PDFs",
      description: "Select your PDF files - they stay on your device",
      color: "blue"
    },
    {
      icon: Shuffle,
      title: "Reorder & Merge",
      description: "Drag to reorder, then click merge - all in your browser",
      color: "purple"
    },
    {
      icon: Download,
      title: "Download Result",
      description: "Get your merged PDF instantly - no server involved",
      color: "green"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="mt-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          How It Works
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Simple, secure, and private PDF merging in just three steps
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8 max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col md:flex-row items-center">
            <div className="text-center max-w-xs">
              <div className={`p-4 rounded-full w-fit mx-auto mb-4 ${getColorClasses(step.color)}`}>
                <step.icon className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="hidden md:block mx-6">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
