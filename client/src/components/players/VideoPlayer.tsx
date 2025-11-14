import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, Check, X } from "lucide-react";
import { youtubeLoader } from "@/lib/youtube-loader";
import type { InteractiveVideoData, VideoHotspot } from "@shared/schema";

type VideoPlayerProps = {
  data: InteractiveVideoData;
};

export function VideoPlayer({ data }: VideoPlayerProps) {
  const [currentHotspot, setCurrentHotspot] = useState<VideoHotspot | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(data.videoUrl);

  useEffect(() => {
    if (!videoId) return;

    const initializePlayer = () => {
      if (!playerContainerRef.current) return;

      // Destroy existing player if any
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startTimeTracking();
            } else {
              setIsPlaying(false);
              stopTimeTracking();
            }
          },
        },
      });
    };

    // Use shared YouTube loader
    youtubeLoader.load(initializePlayer);

    return () => {
      stopTimeTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const startTimeTracking = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        checkForHotspots(time);
      }
    }, 100);
  };

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const checkForHotspots = (time: number) => {
    const hotspot = data.hotspots.find(
      (h) => Math.abs(h.timestamp - time) < 0.5 && !completedHotspots.has(h.id) && !currentHotspot
    );

    if (hotspot) {
      setCurrentHotspot(hotspot);
      playerRef.current?.pauseVideo();
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleSeek = (percentage: number) => {
    if (!playerRef.current || !duration) return;
    const time = (percentage / 100) * duration;
    playerRef.current.seekTo(time, true);
    setCurrentTime(time);
  };

  const handleFullscreen = () => {
    if (!playerRef.current) return;
    const iframe = playerRef.current.getIframe();
    if (iframe && iframe.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const jumpToHotspot = (hotspot: VideoHotspot) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(hotspot.timestamp, true);
    setCurrentTime(hotspot.timestamp);
    playerRef.current.playVideo();
  };

  const handleAnswerSubmit = () => {
    if (!currentHotspot || currentHotspot.type !== "question") return;
    setShowFeedback(true);
  };

  const handleContinue = () => {
    if (!currentHotspot) return;
    setCompletedHotspots(prev => new Set([...prev, currentHotspot.id]));
    setCurrentHotspot(null);
    setSelectedAnswer(null);
    setShowFeedback(false);
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Video Container with Overlay */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <div ref={playerContainerRef} className="w-full h-full" data-testid="video-iframe" />

        {/* Hotspot Overlay */}
        {currentHotspot && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-10">
            <Card className="w-full max-w-2xl">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={currentHotspot.type === "question" ? "default" : "outline"}>
                      {currentHotspot.type}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatTime(currentHotspot.timestamp)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold">{currentHotspot.title}</h3>
                  <p className="text-muted-foreground">{currentHotspot.content}</p>

                  {currentHotspot.type === "question" && currentHotspot.options && currentHotspot.options.length > 0 && (
                    <div className="space-y-3">
                      {currentHotspot.options.map((option, index) => {
                        const isCorrect = currentHotspot.correctAnswer === index;
                        const isSelected = selectedAnswer === index;
                        const showResult = showFeedback;

                        return (
                          <button
                            key={index}
                            onClick={() => !showFeedback && setSelectedAnswer(index)}
                            disabled={showFeedback}
                            aria-label={`Answer option ${index + 1}: ${option}`}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all hover-elevate ${
                              showResult
                                ? isCorrect
                                  ? "border-green-600 bg-green-50 dark:bg-green-950"
                                  : isSelected
                                  ? "border-red-600 bg-red-50 dark:bg-red-950"
                                  : "border-border"
                                : isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                            data-testid={`hotspot-option-${index}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {showResult && isCorrect && <Check className="h-5 w-5 text-green-600" />}
                              {showResult && isSelected && !isCorrect && <X className="h-5 w-5 text-red-600" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    {currentHotspot.type === "question" && currentHotspot.options && currentHotspot.options.length > 0 && !showFeedback && (
                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={selectedAnswer === null}
                        data-testid="button-submit-answer"
                      >
                        Submit Answer
                      </Button>
                    )}
                    {(currentHotspot.type !== "question" || !currentHotspot.options || currentHotspot.options.length === 0 || showFeedback) && (
                      <Button onClick={handleContinue} data-testid="button-continue">
                        Continue
                        <SkipForward className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="space-y-2">
            {/* Progress Bar with Hotspot Markers */}
            <div className="relative">
              <div
                role="slider"
                aria-label="Video progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.floor(progressPercentage)}
                tabIndex={0}
                className="h-2 bg-white/20 rounded-full cursor-pointer hover-elevate"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = (x / rect.width) * 100;
                  handleSeek(percentage);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    handleSeek(Math.max(0, progressPercentage - 5));
                  } else if (e.key === "ArrowRight") {
                    handleSeek(Math.min(100, progressPercentage + 5));
                  }
                }}
                data-testid="video-progress-bar"
              >
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
                {/* Hotspot Markers */}
                {data.hotspots.map((hotspot) => {
                  const position = duration > 0 ? (hotspot.timestamp / duration) * 100 : 0;
                  const isCompleted = completedHotspots.has(hotspot.id);
                  return (
                    <button
                      key={hotspot.id}
                      className={`absolute top-0 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-all ${
                        isCompleted ? "bg-green-500" : "bg-yellow-500"
                      } hover:scale-125`}
                      style={{ left: `${position}%`, top: "50%" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        jumpToHotspot(hotspot);
                      }}
                      aria-label={`Jump to ${hotspot.title} at ${formatTime(hotspot.timestamp)}`}
                      title={`${hotspot.title} at ${formatTime(hotspot.timestamp)}`}
                      data-testid={`marker-${hotspot.id}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMute}
                  className="text-white hover:bg-white/20"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  data-testid="button-mute"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <span className="text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
                aria-label="Enter fullscreen"
                data-testid="button-fullscreen"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspot Progress */}
      {data.hotspots.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Interactive Moments</h3>
              <Badge variant="outline">
                {completedHotspots.size}/{data.hotspots.length} Completed
              </Badge>
            </div>
            <Progress value={(completedHotspots.size / data.hotspots.length) * 100} className="mb-4" />
            <div className="space-y-2">
              {data.hotspots
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((hotspot) => {
                  const isCompleted = completedHotspots.has(hotspot.id);
                  return (
                    <button
                      key={hotspot.id}
                      className={`w-full p-3 rounded-lg border cursor-pointer transition-all hover-elevate text-left ${
                        isCompleted ? "border-green-600 bg-green-50 dark:bg-green-950" : "border-border"
                      }`}
                      onClick={() => jumpToHotspot(hotspot)}
                      aria-label={`Jump to ${hotspot.type} at ${formatTime(hotspot.timestamp)}: ${hotspot.title}`}
                      data-testid={`hotspot-item-${hotspot.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCompleted && <Check className="h-4 w-4 text-green-600" />}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {formatTime(hotspot.timestamp)}
                              </Badge>
                              <span className="text-sm font-medium">{hotspot.title}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={hotspot.type === "question" ? "default" : "outline"}>
                          {hotspot.type}
                        </Badge>
                      </div>
                    </button>
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
