import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Copy, Eye, EyeOff, Key, Trash2, Plus, Code, BookOpen, Zap } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  usage: number;
}

export default function APIPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production Key',
      key: 'pk_live_1234567890abcdef',
      created: '2024-01-15',
      lastUsed: '2024-01-20',
      usage: 1250
    }
  ]);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [newKeyName, setNewKeyName] = useState('');
  const { toast } = useToast();

  const generateApiKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your API key',
        variant: 'destructive'
      });
      return;
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `pk_${Math.random().toString(36).substr(2, 24)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      usage: 0
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    toast({
      title: 'API key generated',
      description: 'Your new API key has been created successfully'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard'
    });
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast({
      title: 'API key deleted',
      description: 'The API key has been permanently deleted'
    });
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '•'.repeat(16) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">API Access</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Integrate PDF Pro tools into your applications using our REST API
        </p>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          {/* Generate New Key */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
              <CardDescription>
                Create a new API key to access PDF Pro tools programmatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production, Staging, Mobile App"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={generateApiKey}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Keys */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Manage your existing API keys and monitor usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys generated yet. Create your first key above.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{apiKey.name}</h4>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created: {apiKey.created}</span>
                          <span>Last used: {apiKey.lastUsed}</span>
                          <span>Usage: {apiKey.usage} requests</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Info */}
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Keep your API keys secure and never share them publicly. 
              Each key has a rate limit of 1,000 requests per hour.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Complete reference for all PDF Pro API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base URL */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                <code className="block bg-muted p-3 rounded text-sm">
                  https://api.pdfpro.com/v1
                </code>
              </div>

              {/* Authentication */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                <p className="text-muted-foreground mb-2">
                  Include your API key in the Authorization header:
                </p>
                <code className="block bg-muted p-3 rounded text-sm">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              {/* Endpoints */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Endpoints</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>POST</Badge>
                      <code>/merge</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Merge multiple PDF files into a single document
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>POST</Badge>
                      <code>/split</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Split a PDF file into multiple documents
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>POST</Badge>
                      <code>/watermark</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add watermarks to PDF documents
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>POST</Badge>
                      <code>/convert</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Convert PDF pages to images
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Format */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Response Format</h3>
                <p className="text-muted-foreground mb-2">
                  All endpoints return JSON responses:
                </p>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "file_url": "https://cdn.pdfpro.com/result.pdf",
    "expires_at": "2024-01-21T12:00:00Z"
  },
  "message": "PDF processed successfully"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-6">
            {/* JavaScript Example */}
            <Card>
              <CardHeader>
                <CardTitle>JavaScript / Node.js</CardTitle>
                <CardDescription>
                  Example using fetch API to merge PDFs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`const formData = new FormData();
formData.append('file1', file1);
formData.append('file2', file2);

const response = await fetch('https://api.pdfpro.com/v1/merge', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const result = await response.json();
console.log(result.data.file_url);`}
                </pre>
              </CardContent>
            </Card>

            {/* Python Example */}
            <Card>
              <CardHeader>
                <CardTitle>Python</CardTitle>
                <CardDescription>
                  Example using requests library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`import requests

files = {
    'file1': open('document1.pdf', 'rb'),
    'file2': open('document2.pdf', 'rb')
}

headers = {
    'Authorization': 'Bearer YOUR_API_KEY'
}

response = requests.post(
    'https://api.pdfpro.com/v1/merge',
    files=files,
    headers=headers
)

result = response.json()
print(result['data']['file_url'])`}
                </pre>
              </CardContent>
            </Card>

            {/* cURL Example */}
            <Card>
              <CardHeader>
                <CardTitle>cURL</CardTitle>
                <CardDescription>
                  Command line example
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`curl -X POST https://api.pdfpro.com/v1/merge \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file1=@document1.pdf" \\
  -F "file2=@document2.pdf"`}
                </pre>
              </CardContent>
            </Card>

            {/* Monday.com Integration */}
            <Card>
              <CardHeader>
                <CardTitle>Monday.com Integration</CardTitle>
                <CardDescription>
                  Custom integration recipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      You can integrate PDF Pro with Monday.com using custom integrations or Zapier.
                    </AlertDescription>
                  </Alert>
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Monday.com Recipe Example
{
  "trigger": "file_uploaded",
  "action": {
    "url": "https://api.pdfpro.com/v1/merge",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    },
    "body": {
      "files": "{file_urls}"
    }
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
