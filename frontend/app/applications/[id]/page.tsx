"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Code, 
  Globe, 
  Github, 
  ExternalLink, 
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { ApiClient, type Application } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function ApplicationDetailPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <ApplicationDetailContent />
      </div>
    </ProtectedRoute>
  );
}

function ApplicationDetailContent() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationId = params.id as string;

  // Redirect admin users to admin panel - they shouldn't access participant features
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        setError(null);
        const app = await ApiClient.getApplication(applicationId);
        setApplication(app);
      } catch (err) {
        console.error('Failed to fetch application:', err);
        setError(err instanceof Error ? err.message : 'Failed to load application');
        toast.error('Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUBMITTED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "DRAFT":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "UNDER_REVIEW":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading application...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Application</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{application.title}</h1>
              <p className="text-muted-foreground mt-2">
                Application Details
              </p>
            </div>
            <Badge className={`${getStatusColor(application.status)} flex items-center gap-2`}>
              {getStatusIcon(application.status)}
              {application.status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
        </div>

        <div className="space-y-8">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Project Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{application.description}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Problem Statement</h4>
                <p className="text-muted-foreground">{application.problemStatement}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Proposed Solution</h4>
                <p className="text-muted-foreground">{application.solution}</p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                <CardTitle>Technical Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {application.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {(application.githubRepo || application.demoUrl) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {application.githubRepo && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          GitHub Repository
                        </h4>
                        <Button variant="outline" asChild className="w-full">
                          <a href={application.githubRepo} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Repository
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {application.demoUrl && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Live Demo
                        </h4>
                        <Button variant="outline" asChild className="w-full">
                          <a href={application.demoUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Demo
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Team Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Team Size</h4>
                  <p className="text-muted-foreground">{application.teamSize} members</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Submitted</h4>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {application.submittedAt 
                      ? new Date(application.submittedAt).toLocaleDateString()
                      : new Date(application.createdAt).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Team Members</h4>
                <div className="space-y-2">
                  {application.teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">
                        {index === 0 ? 'Team Leader' : 'Member'}
                      </Badge>
                      <span>{member}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
            {application.status?.toUpperCase() === 'DRAFT' && (
              <Button asChild>
                <Link href={`/submit?edit=${application.id}`}>
                  Continue Editing
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
