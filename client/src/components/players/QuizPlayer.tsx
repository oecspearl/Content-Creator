import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { QuizData } from "@shared/schema";

type QuizPlayerProps = {
  data: QuizData;
};

export function QuizPlayer({ data }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | number | null)[]>(new Array(data.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = data.questions[currentIndex];
  const progress = ((currentIndex + 1) / data.questions.length) * 100;

  const handleAnswer = (answer: string | number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < data.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">{percentage}%</div>
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
            <Button onClick={handleRestart} data-testid="button-restart">
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
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Question {currentIndex + 1} of {data.questions.length}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            <Badge variant="outline">{currentQuestion.type.replace("-", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentIndex] === index;
                const isCorrectOption = currentQuestion.correctAnswer === index;
                const showCorrect = showExplanation && data.settings.showCorrectAnswers;

                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-start h-auto py-4 px-4 text-left ${
                      showCorrect && isCorrectOption ? "border-green-600 bg-green-50 dark:bg-green-950" : ""
                    } ${showCorrect && isSelected && !isCorrectOption ? "border-destructive bg-destructive/10" : ""}`}
                    onClick={() => !showExplanation && handleAnswer(index)}
                    disabled={showExplanation}
                    data-testid={`option-${index}`}
                  >
                    <span className="flex-1">{option}</span>
                    {showCorrect && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {showCorrect && isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-destructive" />}
                  </Button>
                );
              })}
            </div>
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
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={answers[currentIndex] === null}
            data-testid="button-next"
          >
            {currentIndex === data.questions.length - 1 ? "Finish" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
