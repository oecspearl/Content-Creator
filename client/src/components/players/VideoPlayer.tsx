import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InteractiveVideoData } from "@shared/schema";

type VideoPlayerProps = {
  data: InteractiveVideoData;
};

export function VideoPlayer({ data }: VideoPlayerProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);

  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(data.videoUrl);

  return (
    <div className="space-y-6">
      {/* Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          data-testid="video-iframe"
        />
      </div>

      {/* Hotspot Timeline */}
      {data.hotspots.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Interactive Moments</h3>
            <div className="space-y-3">
              {data.hotspots
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((hotspot, index) => {
                  const minutes = Math.floor(hotspot.timestamp / 60);
                  const seconds = hotspot.timestamp % 60;
                  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

                  return (
                    <div
                      key={hotspot.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover-elevate ${
                        selectedHotspot === index ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedHotspot(selectedHotspot === index ? null : index)}
                      data-testid={`hotspot-${index}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={hotspot.type === "question" ? "default" : "outline"}>
                              {hotspot.type}
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground">{timeStr}</span>
                          </div>
                          <h4 className="font-medium mb-1">{hotspot.title}</h4>
                          <p className="text-sm text-muted-foreground">{hotspot.content}</p>

                          {selectedHotspot === index && hotspot.options && (
                            <div className="mt-4 space-y-2">
                              {hotspot.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded-lg border ${
                                    hotspot.correctAnswer === optIndex
                                      ? "border-green-600 bg-green-50 dark:bg-green-950"
                                      : "bg-muted/50"
                                  }`}
                                >
                                  {option}
                                  {hotspot.correctAnswer === optIndex && (
                                    <span className="ml-2 text-xs text-green-600 font-medium">Correct</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {data.hotspots.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">No interactive hotspots added yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
