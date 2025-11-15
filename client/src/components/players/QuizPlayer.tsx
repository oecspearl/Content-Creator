import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { QuizData } from "@shared/schema";
import { useProgressTracker } from "@/hooks/use-progress-tracker";
import { ScreenReaderAnnouncer, useScreenReaderAnnounce } from "@/components/ScreenReaderAnnouncer";

type QuizPlayerProps = {
  data: QuizData;
  contentId: string;
};

export function QuizPlayer({ data, contentId }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | number | null)[]>(new Array(data.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const { announcement, announce } = useScreenReaderAnnounce();
  const restartButtonRef = useRef<HTMLButtonElement>(null);

  const { progress: savedProgress, isProgressFetched, updateProgress, saveQuizAttempt, logInteraction, isAuthenticated } = useProgressTracker(contentId);
  const [lastSentProgress, setLastSentProgress] = useState<number>(-1);
  const [isProgressInitialized, setIsProgressInitialized] = useState(false);
  const pendingMilestoneRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousAuthRef = useRef<boolean>(isAuthenticated);

  const currentQuestion = data.questions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / data.questions.length) * 100;

  // Reset initialization when auth changes from false → true
  useEffect(() => {
    if (!previousAuthRef.current && isAuthenticated) {
      // User just logged in - reset to wait for progress fetch
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

  // Initialize from persisted progress and reconcile when savedProgress updates
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
      // After initialization, reconcile: server can only raise, never lower
      // Only update if savedProgress is truthy (skip null refetches)
      setLastSentProgress(prev => Math.max(prev, savedProgress.completionPercentage));
      // Clear pending milestone if it's been saved
      if (pendingMilestoneRef.current !== null && savedProgress.completionPercentage >= pendingMilestoneRef.current) {
        pendingMilestoneRef.current = null;
        if (pendingTimeoutRef.current) {
          clearTimeout(pendingTimeoutRef.current);
          pendingTimeoutRef.current = null;
        }
      }
    }
  }, [savedProgress, isProgressFetched, isAuthenticated, isProgressInitialized]);

  // Update progress as user advances through questions (monotonic, only after initialization)
  useEffect(() => {
    if (!isProgressInitialized || !isAuthenticated) return;
    
    if (answers[currentIndex] !== null) {
      const completionPercentage = Math.round(
        (answers.filter((a) => a !== null).length / data.questions.length) * 100
      );
      // Only send if higher than local high water mark, not yet complete, and not already pending
      if (completionPercentage > lastSentProgress && completionPercentage < 100 && completionPercentage !== pendingMilestoneRef.current) {
        pendingMilestoneRef.current = completionPercentage;
        updateProgress(completionPercentage);
        // Clear pending after 5 seconds to allow retry on failure
        if (pendingTimeoutRef.current) {
          clearTimeout(pendingTimeoutRef.current);
        }
        pendingTimeoutRef.current = setTimeout(() => {
          pendingMilestoneRef.current = null;
          pendingTimeoutRef.current = null;
        }, 5000);
      }
    }
  }, [currentIndex, answers, lastSentProgress, isProgressInitialized, isAuthenticated]);

  const handleAnswer = (answer: string | number) => {
    // Don't allow changing answers after explanation is shown
    if (showExplanation) return;
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
    
    // Log interaction
    logInteraction("answered");
    
    // If immediate feedback is enabled, show explanation
    if (data.settings.provideFeedback && currentQuestion.explanation) {
      setShowExplanation(true);
    }
    
    // Screen reader announcement
    const isCorrect = currentQuestion.correctAnswer === answer;
    announce(
      isCorrect 
        ? "Correct! " + (currentQuestion.explanation || "")
        : "Incorrect. " + (currentQuestion.explanation || ""),
      "assertive"
    );
  };

  const handleNext = () => {
    // Don't allow advancing without an answer
    if (answers[currentIndex] === null) {
      announce("Please select an answer before continuing", "assertive");
      return;
    }
    
    setShowExplanation(false);
    if (currentIndex < data.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Announce question change for screen readers
      announce(`Question ${currentIndex + 2} of ${data.questions.length}`, "polite");
    } else {
      // Quiz completed - save attempt and show results
      const score = calculateScore();
      const answersData = data.questions.map((q, i) => ({
        questionId: q.id,
        answer: answers[i] || "",
        isCorrect: q.correctAnswer === answers[i],
      }));
      
      // Save quiz attempt (which also updates progress to 100%)
      // Don't update local state here - let reconciliation handle it on success
      saveQuizAttempt(score, data.questions.length, answersData);
      setShowResults(true);
      announce(`Quiz complete! You scored ${Math.round((score / data.questions.length) * 100)}%`, "assertive");
      // Focus the restart button when results are shown
      setTimeout(() => {
        restartButtonRef.current?.focus();
      }, 100);
    }
  };

  const handlePrevious = () => {
    setShowExplanation(false);
    setCurrentIndex(currentIndex - 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers(new Array(data.questions.length).fill(null));
    setShowResults(false);
    setShowExplanation(false);
    logInteraction("quiz_restarted");
  };

  const calculateScore = () => {
    return data.questions.reduce((score, question, index) => {
      const answer = answers[index];
      if (question.correctAnswer === answer) {
        return score + 1;
      }
      return score;
    }, 0);
  };

  const isCorrect = (questionIndex: number) => {
    return data.questions[questionIndex].correctAnswer === answers[questionIndex];
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / data.questions.length) * 100);

    return (
      <Card className="max-w-2xl mx-auto" role="region" aria-label="Quiz results">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2" aria-label={`Your score is ${percentage} percent`}>{percentage}%</div>
            <p className="text-lg text-muted-foreground">
              You got {score} out of {data.questions.length} questions correct
            </p>
          </div>

          {data.settings.showCorrectAnswers && (
            <div className="space-y-3">
              <h3 className="font-semibold">Results:</h3>
              {data.questions.map((question, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {isCorrect(index) ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{question.question}</p>
                    {!isCorrect(index) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Correct answer: {typeof question.correctAnswer === "number" && question.options
                          ? question.options[question.correctAnswer]
                          : String(question.correctAnswer)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          {data.settings.allowRetry && (
            <Button 
              ref={restartButtonRef}
              onClick={handleRestart} 
              data-testid="button-restart" 
              aria-label="Restart the quiz"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Screen Reader Announcer */}
      <ScreenReaderAnnouncer announcement={announcement} />
      
      {/* Progress */}
      <div className="space-y-2" role="region" aria-label="Quiz progress">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Question {currentIndex + 1} of {data.questions.length}</span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" aria-label={`Quiz progress: ${Math.round(progressPercentage)}%`} />
      </div>

      {/* Question Card */}
      <Card role="region" aria-label={`Question ${currentIndex + 1} of ${data.questions.length}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle id={`question-${currentIndex}`} className="text-xl">{currentQuestion.question}</CardTitle>
            <Badge variant="outline">{currentQuestion.type.replace("-", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
            <RadioGroup 
              value={answers[currentIndex]?.toString() || ""}
              onValueChange={(value) => handleAnswer(parseInt(value))}
              disabled={showExplanation}
              aria-labelledby={`question-${currentIndex}`}
              aria-required="true"
              className="space-y-2"
            >
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentIndex] === index;
                const isCorrectOption = currentQuestion.correctAnswer === index;
                const showCorrect = showExplanation && data.settings.showCorrectAnswers;

                return (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 border rounded-lg p-4 ${
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    } ${
                      showCorrect && isCorrectOption ? "border-green-600 bg-green-50 dark:bg-green-950" : ""
                    } ${
                      showCorrect && isSelected && !isCorrectOption ? "border-destructive bg-destructive/10" : ""
                    }`}
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${currentIndex}-${index}`}
                      disabled={showExplanation}
                      data-testid={`option-${index}`}
                    />
                    <Label 
                      htmlFor={`option-${currentIndex}-${index}`}
                      className="flex-1 cursor-pointer text-base"
                    >
                      {option}
                    </Label>
                    {showCorrect && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {showCorrect && isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-destructive" />}
                  </div>
                );
              })}
            </RadioGroup>
          )}

          {currentQuestion.type === "true-false" && (
            <div className="flex gap-3">
              <Button
                variant={answers[currentIndex] === "true" ? "default" : "outline"}
                className="flex-1 h-16"
                onClick={() => !showExplanation && handleAnswer("true")}
                disabled={showExplanation}
                data-testid="button-true"
              >
                True
              </Button>
              <Button
                variant={answers[currentIndex] === "false" ? "default" : "outline"}
                className="flex-1 h-16"
                onClick={() => !showExplanation && handleAnswer("false")}
                disabled={showExplanation}
                data-testid="button-false"
              >
                False
              </Button>
            </div>
          )}

          {currentQuestion.type === "fill-blank" && (
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border bg-background"
              placeholder="Type your answer..."
              value={answers[currentIndex] as string || ""}
              onChange={(e) => !showExplanation && handleAnswer(e.target.value)}
              disabled={showExplanation}
              data-testid="input-fill-blank"
              aria-label="Answer input"
            />
          )}

          {showExplanation && currentQuestion.explanation && (
            <div className="mt-4 p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            data-testid="button-previous"
            aria-label="Go to previous question"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={answers[currentIndex] === null}
            data-testid="button-next"
            aria-label={currentIndex === data.questions.length - 1 ? "Finish quiz" : "Go to next question"}
          >
            {currentIndex === data.questions.length - 1 ? "Finish" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
