import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Zap, Shield, Clock } from 'lucide-react';

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your PDFs with powerful tools designed for professionals.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-card-foreground">Files Processed</h3>
          </div>
          <p className="text-2xl font-bold text-card-foreground">0</p>
          <p className="text-sm text-muted-foreground">Total documents</p>
        </div>

        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-card-foreground">Operations</h3>
          </div>
          <p className="text-2xl font-bold text-card-foreground">0</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>

        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-card-foreground">Security</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">Active</p>
          <p className="text-sm text-muted-foreground">All operations secure</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl p-6 border shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No recent activity</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start by uploading a PDF or using one of our tools
          </p>
        </div>
      </div>
    </div>
  );
}