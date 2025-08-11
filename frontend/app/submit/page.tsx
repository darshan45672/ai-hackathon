"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, FileText, Users, Code, Globe } from "lucide-react";
import { toast } from "sonner";

export default function SubmitPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <SubmitContent />
      </div>
    </ProtectedRoute>
  );
}

function SubmitContent() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemStatement: "",
    solution: "",
    techStack: [] as string[],
    teamSize: "",
    teamMembers: [""],
    githubRepo: "",
    demoUrl: ""
  });

  const [newTech, setNewTech] = useState("");

  const addTechStack = () => {
    if (newTech.trim() && !formData.techStack.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTech.trim()]
      }));
      setNewTech("");
    }
  };

  const removeTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, ""]
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const updateTeamMember = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? value : member
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      toast.error("Please enter a project title");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Please enter a project description");
      return;
    }

    // TODO: Submit to API
    console.log("Submitting application:", { ...formData, isDraft });
    toast.success(isDraft ? "Draft saved successfully!" : "Application submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Submit Your Idea</h1>
          <p className="text-muted-foreground mt-2">
            Share your innovative AI project with the community
          </p>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Project Details</CardTitle>
              </div>
              <CardDescription>
                Tell us about your AI project idea
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your project title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project in detail..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Problem Statement</Label>
                <Textarea
                  id="problem"
                  placeholder="What problem does your project solve?"
                  rows={3}
                  value={formData.problemStatement}
                  onChange={(e) => setFormData(prev => ({ ...prev, problemStatement: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution">Proposed Solution</Label>
                <Textarea
                  id="solution"
                  placeholder="How does your project solve the problem?"
                  rows={3}
                  value={formData.solution}
                  onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                />
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
              <CardDescription>
                Specify the technologies and tools you'll use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add technology (e.g., React, Python, TensorFlow)"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTechStack())}
                  />
                  <Button type="button" onClick={addTechStack}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary" className="gap-1">
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTechStack(tech)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Repository</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username/repo"
                    value={formData.githubRepo}
                    onChange={(e) => setFormData(prev => ({ ...prev, githubRepo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo">Demo URL</Label>
                  <Input
                    id="demo"
                    placeholder="https://your-demo-url.com"
                    value={formData.demoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Team Information</CardTitle>
              </div>
              <CardDescription>
                Tell us about your team composition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, teamSize: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Solo (1 member)</SelectItem>
                    <SelectItem value="2">2 members</SelectItem>
                    <SelectItem value="3">3 members</SelectItem>
                    <SelectItem value="4">4 members</SelectItem>
                    <SelectItem value="5">5+ members</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="space-y-2">
                  {formData.teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={index === 0 ? "Your name (team leader)" : "Team member name"}
                        value={member}
                        onChange={(e) => updateTeamMember(index, e.target.value)}
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeTeamMember(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTeamMember}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
            >
              Save as Draft
            </Button>
            <Button type="submit">
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
