import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AIGenerationModal } from "@/components/AIGenerationModal";
import { 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  Trash2,
  Globe
} from "lucide-react";
import type { H5pContent, InteractiveVideoData, VideoHotspot } from "@shared/schema";

export default function InteractiveVideoCreator() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const contentId = params.id;
  const isEditing = !!contentId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [hotspots, setHotspots] = useState<VideoHotspot[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: content } = useQuery<H5pContent>({
    queryKey: ["/api/content", contentId],
    enabled: isEditing,
  });

  useEffect(() => {
    if (content && content.type === "interactive-video") {
      setTitle(content.title);
      setDescription(content.description || "");
      const videoData = content.data as InteractiveVideoData;
      setVideoUrl(videoData.videoUrl || "");
      setHotspots(videoData.hotspots || []);
      setIsPublished(content.isPublished);
    }
  }, [content]);

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean = false) => {
      const data: InteractiveVideoData = { videoUrl, hotspots };
      
      if (isEditing) {
        return await apiRequest("PUT", `/api/content/${contentId}`, {
          title,
          description,
          data,
          isPublished: publish,
        });
      } else {
        return await apiRequest("POST", "/api/content", {
          title,
          description,
          type: "interactive-video",
          data,
          isPublished: publish,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      if (!isEditing) {
        navigate(`/create/interactive-video/${data.id}`);
      }
      toast({ title: "Saved!", description: "Interactive video saved successfully." });
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (!title || !videoUrl) return;
    
    const timer = setTimeout(() => {
      setIsSaving(true);
      saveMutation.mutate(isPublished);
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, description, videoUrl, hotspots]);

  const addHotspot = () => {
    const newHotspot: VideoHotspot = {
      id: Date.now().toString(),
      timestamp: 0,
      type: "question",
      title: "",
      content: "",
    };
    setHotspots([...hotspots, newHotspot]);
  };

  const updateHotspot = (index: number, updates: Partial<VideoHotspot>) => {
    const updated = [...hotspots];
    updated[index] = { ...updated[index], ...updates };
    setHotspots(updated);
  };

  const removeHotspot = (index: number) => {
    setHotspots(hotspots.filter((_, i) => i !== index));
  };

  const handleAIGenerated = (data: any) => {
    if (data.hotspots) {
      setHotspots([...hotspots, ...data.hotspots]);
    }
  };

  const handlePublish = async () => {
    setIsPublished(!isPublished);
    await saveMutation.mutateAsync(!isPublished);
    toast({
      title: isPublished ? "Unpublished" : "Published!",
      description: isPublished
        ? "Interactive video is now private."
        : "Interactive video is now publicly accessible via share link.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Interactive Video Creator</h1>
              {isSaving && <Badge variant="outline">Saving...</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAIModal(true)} data-testid="button-ai-generate">
              <Sparkles className="h-4 w-4 mr-1" />
              AI Generate
            </Button>
            <Button
              variant={isPublished ? "outline" : "default"}
              size="sm"
              onClick={handlePublish}
              disabled={!title || !videoUrl}
              data-testid="button-publish"
            >
              <Globe className="h-4 w-4 mr-1" />
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Title & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Cell Division Explained"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this interactive video..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 resize-none"
                  data-testid="textarea-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">YouTube Video URL *</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  data-testid="input-video-url"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube video URL to add interactive hotspots
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hotspots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Hotspots ({hotspots.length})</h3>
              <Button onClick={addHotspot} size="sm" data-testid="button-add-hotspot">
                <Plus className="h-4 w-4 mr-1" />
                Add Hotspot
              </Button>
            </div>

            {hotspots.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    No hotspots yet. Add interactive moments to your video.
                  </p>
                  <Button onClick={addHotspot} data-testid="button-add-first-hotspot">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hotspot
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotspots.map((hotspot, index) => (
                  <Card key={hotspot.id} data-testid={`hotspot-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">Hotspot {index + 1}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(hotspot.timestamp)}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeHotspot(index)}
                          data-testid={`button-delete-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Timestamp (seconds)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={hotspot.timestamp}
                          onChange={(e) => updateHotspot(index, { timestamp: parseInt(e.target.value) || 0 })}
                          data-testid={`input-timestamp-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={hotspot.type}
                          onValueChange={(value: any) => updateHotspot(index, { type: value })}
                        >
                          <SelectTrigger data-testid={`select-type-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="question">Question</SelectItem>
                            <SelectItem value="info">Information</SelectItem>
                            <SelectItem value="navigation">Navigation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="Hotspot title..."
                          value={hotspot.title}
                          onChange={(e) => updateHotspot(index, { title: e.target.value })}
                          data-testid={`input-title-${index}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea
                          placeholder="Description or question..."
                          value={hotspot.content}
                          onChange={(e) => updateHotspot(index, { content: e.target.value })}
                          className="h-20 resize-none"
                          data-testid={`textarea-content-${index}`}
                        />
                      </div>

                      {hotspot.type === "question" && (
                        <>
                          <div className="space-y-2">
                            <Label>Options (comma-separated)</Label>
                            <Input
                              placeholder="Option 1, Option 2, Option 3"
                              value={hotspot.options?.join(", ") || ""}
                              onChange={(e) =>
                                updateHotspot(index, { options: e.target.value.split(",").map((s) => s.trim()) })
                              }
                              data-testid={`input-options-${index}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Correct Answer (index, 0-based)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={hotspot.correctAnswer || 0}
                              onChange={(e) => updateHotspot(index, { correctAnswer: parseInt(e.target.value) || 0 })}
                              data-testid={`input-correct-${index}`}
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AIGenerationModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        contentType="interactive-video"
        onGenerated={handleAIGenerated}
      />
    </div>
  );
}
