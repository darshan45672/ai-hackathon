"use client";

import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, Users, FileText, Clock, CheckCircle, XCircle, Search, 
  Calendar, Eye, Star, BarChart3, Filter
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  // Mock admin user data
  const user = {
    id: "admin1",
    name: "Admin User",
    email: "admin@hackathon.com",
    role: "ADMIN"
  };

  // Mock applications data for admin view
  const applications = [
    {
      id: "1",
      title: "AI-Powered Code Assistant",
      description: "An intelligent code completion and review tool",
      status: "SUBMITTED",
      submittedAt: "2025-01-15T10:30:00Z",
      applicant: "John Doe",
      teamSize: 3,
      techStack: ["React", "Python", "TensorFlow"],
      score: null
    },
    {
      id: "2", 
      title: "Smart Document Analyzer",
      description: "Automatically extract and analyze information from documents",
      status: "UNDER_REVIEW",
      submittedAt: "2025-01-12T14:20:00Z",
      applicant: "Jane Smith",
      teamSize: 2,
      techStack: ["Next.js", "Python", "FastAPI"],
      score: 8.5
    },
    {
      id: "3",
      title: "Voice-to-Action AI",
      description: "Natural language processing for smart home automation",
      status: "ACCEPTED",
      submittedAt: "2025-01-10T09:15:00Z",
      applicant: "Mike Johnson",
      teamSize: 4,
      techStack: ["Node.js", "Python", "TensorFlow"],
      score: 9.2
    },
    {
      id: "4",
      title: "Medical Image Analysis",
      description: "AI-powered diagnostic tool for medical imaging",
      status: "REJECTED",
      submittedAt: "2025-01-08T16:45:00Z",
      applicant: "Sarah Wilson",
      teamSize: 3,
      techStack: ["PyTorch", "OpenCV", "Flask"],
      score: 6.8
    }
  ];

  const stats = {
    totalApplications: applications.length,
    submitted: applications.filter(app => app.status === "SUBMITTED").length,
    underReview: applications.filter(app => app.status === "UNDER_REVIEW").length,
    accepted: applications.filter(app => app.status === "ACCEPTED").length,
    rejected: applications.filter(app => app.status === "REJECTED").length,
    averageScore: applications
      .filter(app => app.score !== null)
      .reduce((sum, app) => sum + (app.score || 0), 0) / 
      applications.filter(app => app.score !== null).length || 0
  };

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
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage all hackathon applications
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.underReview}</div>
              <p className="text-xs text-muted-foreground">
                Pending evaluation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.accepted / stats.totalApplications) * 100).toFixed(1)}% acceptance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">
                Across reviewed applications
              </p>
            </CardContent>
          </Card>
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
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>
              Review, score, and manage submitted applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {application.description}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {application.techStack.slice(0, 2).map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {application.techStack.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{application.techStack.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{application.applicant}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {application.teamSize}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(application.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(application.status)}
                          {application.status.replace("_", " ")}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.score ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{application.score}/10</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not scored</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(application.submittedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/applications/${application.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
