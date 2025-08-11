"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, FileText, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Plus, Calendar, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ApiClient, type Application } from "@/lib/api";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <DashboardContent />
      </div>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiClient.getUserApplications();
      setApplications(response.applications);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUBMITTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "DRAFT":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "UNDER_REVIEW":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUBMITTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back to your Dashboard!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your hackathon journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">
                +1 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => app.status?.toUpperCase() === "SUBMITTED").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.reduce((total, app) => total + app.teamSize, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Applications</CardTitle>
                <CardDescription>
                  Manage and track your hackathon submissions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchApplications}
                  disabled={loading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button asChild>
                  <Link href="/submit">
                    <FileText className="mr-2 h-4 w-4" />
                    New Application
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading applications...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Applications</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchApplications}
                >
                  Try Again
                </Button>
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Trophy className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{application.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Team of {application.teamSize} members
                        </p>
                        {application.submittedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(application.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(application.status)}
                          {application.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/applications/${application.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by submitting your first hackathon idea
                </p>
                <Button asChild>
                  <Link href="/submit">
                    Create Your First Application
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
