import React from 'react';
import { BarChart3, Users, FileText, TrendingUp } from 'lucide-react';

export default function AdminPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">App Admin</h1>
        <p className="text-muted-foreground">Platform statistics and management</p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-card-foreground">Total Users</h3>
          </div>
          <p className="text-2xl font-bold text-card-foreground">0</p>
          <p className="text-sm text-muted-foreground">Registered users</p>
        </div>

        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-card-foreground">Files Processed</h3>
          </div>
          <p className="text-2xl font-bold text-card-foreground">0</p>
          <p className="text-sm text-muted-foreground">Total uploads</p>
        </div>

        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-card-foreground">Operations</h3>
          </div>
          <p className="text-2xl font-bold text-card-foreground">0</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>

        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-card-foreground">Growth</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">+0%</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-card rounded-xl p-6 border shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">Admin Tools</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Admin management tools coming soon</p>
          <p className="text-sm text-muted-foreground mt-1">
            User management, analytics, and system controls
          </p>
        </div>
      </div>
    </div>
  );
}