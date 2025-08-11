"use client";

import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, FileText, Clock, CheckCircle, XCircle, Search, Calendar, Eye } from "lucide-react";
import Link from "next/link";

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <ApplicationsContent />
      </div>
    </ProtectedRoute>
  );
}

function ApplicationsContent() {
  // Mock applications data
  const applications = [
    {
      id: "1",
      title: "AI-Powered Code Assistant",
      description: "An intelligent code completion and review tool powered by machine learning",
      status: "SUBMITTED",
      submittedAt: "2025-01-15T10:30:00Z",
      teamSize: 3,
      techStack: ["React", "Python", "TensorFlow", "OpenAI API"],
      teamMembers: ["John Doe", "Jane Smith", "Mike Johnson"],
      githubRepo: "https://github.com/team/ai-code-assistant",
      demoUrl: "https://ai-code-assistant.demo.com"
    },
    {
      id: "2",
      title: "Smart Document Analyzer",
      description: "Automatically extract and analyze information from various document formats",
      status: "DRAFT",
      submittedAt: null,
      teamSize: 2,
      techStack: ["Next.js", "Python", "FastAPI", "spaCy"],
      teamMembers: ["John Doe", "Alice Brown"],
      githubRepo: "",
      demoUrl: ""
    },
    {
      id: "3",
      title: "Voice-to-Action AI",
      description: "Natural language processing system for voice-controlled smart home automation",
      status: "UNDER_REVIEW",
      submittedAt: "2025-01-10T14:20:00Z",
      teamSize: 4,
      techStack: ["Node.js", "Python", "TensorFlow", "WebRTC"],
      teamMembers: ["John Doe", "Bob Wilson", "Carol Davis", "Eve Taylor"],
      githubRepo: "https://github.com/team/voice-action-ai",
      demoUrl: "https://voice-action-ai.demo.com"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "DRAFT":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "UNDER_REVIEW":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "ACCEPTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not submitted";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const filterApplications = (status?: string) => {
    if (!status || status === "all") return applications;
    return applications.filter(app => app.status === status);
  };

  const ApplicationCard = ({ application }: { application: typeof applications[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{application.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {application.description}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(application.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(application.status)}
              {application.status.replace("_", " ")}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {application.teamSize} members
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(application.submittedAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {application.techStack.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {application.techStack.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{application.techStack.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/applications/${application.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Link>
          </Button>
          {application.status === "DRAFT" && (
            <Button size="sm" asChild>
              <Link href={`/applications/${application.id}/edit`}>
                Edit & Submit
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your hackathon submissions
            </p>
          </div>
          <Button asChild>
            <Link href="/submit">
              <FileText className="mr-2 h-4 w-4" />
              New Application
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="DRAFT">Drafts</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
            <TabsTrigger value="DRAFT">
              Drafts ({filterApplications("DRAFT").length})
            </TabsTrigger>
            <TabsTrigger value="SUBMITTED">
              Submitted ({filterApplications("SUBMITTED").length})
            </TabsTrigger>
            <TabsTrigger value="UNDER_REVIEW">
              Under Review ({filterApplications("UNDER_REVIEW").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {applications.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {applications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
          </TabsContent>

          <TabsContent value="DRAFT" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterApplications("DRAFT").map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="SUBMITTED" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterApplications("SUBMITTED").map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="UNDER_REVIEW" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterApplications("UNDER_REVIEW").map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
