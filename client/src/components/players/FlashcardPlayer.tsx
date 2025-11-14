import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import type { FlashcardData } from "@shared/schema";

type FlashcardPlayerProps = {
  data: FlashcardData;
};

export function FlashcardPlayer({ data }: FlashcardPlayerProps) {
  const [cards, setCards] = useState(data.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(cards.length - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRestart = () => {
    setCards(data.cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      {data.settings.showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Flashcard */}
      <div
        className="relative cursor-pointer"
        style={{ aspectRatio: "3/2" }}
        onClick={() => setIsFlipped(!isFlipped)}
        data-testid="flashcard"
      >
        <div
          className={`absolute inset-0 transition-all duration-500 transform preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <Card
            className={`absolute inset-0 backface-hidden ${
              isFlipped ? "invisible" : "visible"
            } flex items-center justify-center hover-elevate`}
          >
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Front</div>
                <div className="text-2xl font-semibold">{currentCard.front}</div>
                {currentCard.category && (
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
                    {currentCard.category}
                  </div>
                )}
                <div className="text-sm text-muted-foreground pt-4">Click to flip</div>
              </div>
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className={`absolute inset-0 backface-hidden ${
              !isFlipped ? "invisible" : "visible"
            } flex items-center justify-center bg-primary/5 hover-elevate`}
            style={{ transform: "rotateY(180deg)" }}
          >
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Back</div>
                <div className="text-2xl font-semibold">{currentCard.back}</div>
                {currentCard.category && (
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
                    {currentCard.category}
                  </div>
                )}
                <div className="text-sm text-muted-foreground pt-4">Click to flip</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="icon" onClick={handlePrevious} data-testid="button-previous">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          {data.settings.shuffleCards && (
            <Button variant="outline" size="sm" onClick={handleShuffle} data-testid="button-shuffle">
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRestart} data-testid="button-restart">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={handleNext} data-testid="button-next">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
