import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { DragAndDropData } from "@shared/schema";
import { useProgressTracker } from "@/hooks/use-progress-tracker";

type DragDropPlayerProps = {
  data: DragAndDropData;
  contentId: string;
};

export function DragDropPlayer({ data, contentId }: DragDropPlayerProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  const { progress: savedProgress, isProgressFetched, updateProgress, logInteraction, isAuthenticated } = useProgressTracker(contentId);
  const [lastSentProgress, setLastSentProgress] = useState<number>(-1);
  const [isProgressInitialized, setIsProgressInitialized] = useState(false);
  const pendingMilestoneRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousAuthRef = useRef<boolean>(isAuthenticated);

  useEffect(() => {
    if (!previousAuthRef.current && isAuthenticated) {
      setIsProgressInitialized(false);
      setLastSentProgress(-1);
      pendingMilestoneRef.current = null;
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
    }
    previousAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isProgressInitialized) {
      if (!isAuthenticated) {
        setIsProgressInitialized(true);
      } else if (isProgressFetched) {
        if (savedProgress) {
          setLastSentProgress(savedProgress.completionPercentage);
        }
        setIsProgressInitialized(true);
      }
    } else if (savedProgress) {
      setLastSentProgress(prev => Math.max(prev, savedProgress.completionPercentage));
      if (pendingMilestoneRef.current !== null && savedProgress.completionPercentage >= pendingMilestoneRef.current) {
        pendingMilestoneRef.current = null;
        if (pendingTimeoutRef.current) {
          clearTimeout(pendingTimeoutRef.current);
          pendingTimeoutRef.current = null;
        }
      }
    }
  }, [savedProgress, isProgressFetched, isAuthenticated, isProgressInitialized]);

  useEffect(() => {
    if (!isProgressInitialized || !isAuthenticated) return;

    const placedCount = Object.keys(placements).length;
    if (placedCount > 0 && data.items.length > 0) {
      const completionPercentage = Math.round((placedCount / data.items.length) * 100);
      if (completionPercentage > lastSentProgress && completionPercentage !== pendingMilestoneRef.current) {
        pendingMilestoneRef.current = completionPercentage;
        updateProgress(completionPercentage);
        if (pendingTimeoutRef.current) {
          clearTimeout(pendingTimeoutRef.current);
        }
        pendingTimeoutRef.current = setTimeout(() => {
          pendingMilestoneRef.current = null;
          pendingTimeoutRef.current = null;
        }, 5000);
      }
    }
  }, [placements, lastSentProgress, isProgressInitialized, isAuthenticated]);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (zoneId: string) => {
    if (!draggedItem) return;

    const zone = data.zones.find(z => z.id === zoneId);
    if (!zone) return;

    if (!zone.allowMultiple) {
      const existingInZone = Object.entries(placements).find(([_, z]) => z === zoneId);
      if (existingInZone && existingInZone[0] !== draggedItem) return;
    }

    setPlacements(prev => ({ ...prev, [draggedItem]: zoneId }));

    if (data.settings.instantFeedback) {
      const item = data.items.find(i => i.id === draggedItem);
      const isCorrect = item?.correctZone === zoneId;
      setFeedback(prev => ({ ...prev, [draggedItem]: isCorrect }));
      logInteraction("item_dropped", {
        itemId: draggedItem,
        zoneId,
        isCorrect,
      });
    }

    setDraggedItem(null);
  };

  const checkAnswers = () => {
    const newFeedback: Record<string, boolean> = {};
    data.items.forEach(item => {
      const placedZone = placements[item.id];
      newFeedback[item.id] = placedZone === item.correctZone;
    });
    setFeedback(newFeedback);
    setShowResults(true);

    const correct = Object.values(newFeedback).filter(Boolean).length;
    logInteraction("check_answers", {
      score: correct,
      total: data.items.length,
    });
  };

  const reset = () => {
    setPlacements({});
    setFeedback({});
    setShowResults(false);
    setDraggedItem(null);
  };

  const score = Object.values(feedback).filter(Boolean).length;
  const total = data.items.length;
  const completionPercentage = Object.keys(placements).length > 0 ? (Object.keys(placements).length / total) * 100 : 0;

  const unplacedItems = data.items.filter(item => !placements[item.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Progress value={completionPercentage} className="w-48" data-testid="progress-bar" />
          <p className="text-sm text-muted-foreground mt-1">
            {Object.keys(placements).length} of {total} items placed
          </p>
        </div>
        <div className="flex gap-2">
          {!data.settings.instantFeedback && !showResults && (
            <Button onClick={checkAnswers} disabled={Object.keys(placements).length !== total} data-testid="button-check">
              Check Answers
            </Button>
          )}
          {showResults && data.settings.allowRetry && (
            <Button onClick={reset} variant="outline" data-testid="button-retry">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>

      {showResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                Score: {score}/{total}
              </p>
              <p className="text-muted-foreground">
                {score === total ? "Perfect! Well done!" : `You got ${score} out of ${total} correct.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Items to Drag</h3>
            <div className="space-y-2">
              {unplacedItems.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  className="p-3 bg-card border-2 border-border rounded-lg cursor-move hover-elevate active-elevate-2 select-none"
                  data-testid={`drag-item-${item.id}`}
                >
                  {item.content}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold">Drop Zones</h3>
          {data.zones.map(zone => {
            const itemsInZone = data.items.filter(item => placements[item.id] === zone.id);
            return (
              <Card
                key={zone.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(zone.id)}
                className="min-h-32 border-2 border-dashed"
                data-testid={`drop-zone-${zone.id}`}
              >
                <CardContent className="p-4">
                  {data.settings.showZoneLabels && (
                    <h4 className="font-medium mb-2">{zone.label}</h4>
                  )}
                  <div className="space-y-2">
                    {itemsInZone.map(item => (
                      <div
                        key={item.id}
                        className="p-3 bg-accent border-2 border-border rounded-lg flex items-center justify-between"
                        data-testid={`placed-item-${item.id}`}
                      >
                        <span>{item.content}</span>
                        {feedback[item.id] !== undefined && (
                          feedback[item.id] ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" data-testid={`correct-${item.id}`} />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" data-testid={`incorrect-${item.id}`} />
                          )
                        )}
                      </div>
                    ))}
                    {itemsInZone.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Drop items here
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
