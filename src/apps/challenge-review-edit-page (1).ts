// src/apps/review/pages/challenge-review-edit-page.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  Button,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { 
  Scorecard, 
  ScorecardSection, 
  ScorecardQuestion,
  QuestionResponse
} from '../types/challenge';
import { ReviewService } from '../services/reviewService';
import { useParams, useNavigate } from 'react-router-dom';
import { MarkdownEditor } from '../components/markdown-editor';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const ChallengeReviewEditPage: React.FC = () => {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { challengeId, submissionId } = useParams<{ 
    challengeId: string, 
    submissionId: string 
  }>();
  const navigate = useNavigate();

  const validateReview = useMemo(() => {
    if (!scorecard) return false;

    // Check if all questions have a score
    return scorecard.sections.every(section => 
      section.questions.every(question => 
        question.score !== undefined && question.score !== null
      )
    );
  }, [scorecard]);

  useEffect(() => {
    const fetchScorecardAndStatus = async () => {
      if (!submissionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const fetchedScorecard = await ReviewService.fetchScorecard(submissionId);
        setScorecard(fetchedScorecard);

        const reviewStatus = await ReviewService.getReviewStatus(submissionId);
        setIsViewMode(reviewStatus === 'completed');

        // Calculate initial total score
        const initialTotalScore = fetchedScorecard.sections.reduce((total, section) => 
          total + section.questions.reduce((sectionTotal, q) => 
            sectionTotal + ((q.score || 0) * q.weight), 0), 0);
        
        setTotalScore(initialTotalScore);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred while fetching scorecard';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScorecardAndStatus();
  }, [submissionId]);

  const handleScoreChange = (sectionIndex: number, questionIndex: number, value: number) => {
    if (!scorecard) return;

    const updatedScorecard = {...scorecard};
    const question = updatedScorecard.sections[sectionIndex].questions[questionIndex];
    question.score = value;

    // Recalculate total score
    const newTotalScore = updatedScorecard.sections.reduce((total, section) => 
      total + section.questions.reduce((sectionTotal, q) => 
        sectionTotal + ((q.score || 0) * q.weight), 0), 0);
    
    setTotalScore(newTotalScore);
    setScorecard(updatedScorecard);
  };

  const addQuestionResponse = (sectionIndex: number, questionIndex: number) => {
    if (!scorecard) return;

    const updatedScorecard = {...scorecard};
    const question = updatedScorecard.sections[sectionIndex].questions[questionIndex];
    
    const newResponse: QuestionResponse = {
      id: `response-${(question.responses?.length || 0) + 1}`,
      type: 'comment',
      comment: ''
    };

    if (!question.responses) {
      question.responses = [];
    }
    question.responses.push(newResponse);

    setScorecard(updatedScorecard);
  };

  const updateQuestionResponse = (
    sectionIndex: number, 
    questionIndex: number, 
    responseIndex: number, 
    comment: string
  ) => {
    if (!scorecard) return;

    const updatedScorecard = {...scorecard};
    const responses = updatedScorecard.sections[sectionIndex]
      .questions[questionIndex].responses;
    
    if (responses && responses[responseIndex]) {
      responses[responseIndex].comment = comment;
    }

    setScorecard(updatedScorecard);
  };

  const renderQuestionInput = (
    sectionIndex: number, 
    questionIndex: number, 
    question: ScorecardQuestion
  ) => {
    if (isViewMode) {
      return <Badge variant="secondary">{question.score?.toFixed(2)}</Badge>;
    }

    switch (question.responseType) {
      case 'numeric':
        return (
          <Select 
            value={question.score?.toString() || ''}
            onValueChange={(value) => handleScoreChange(
              sectionIndex, 
              questionIndex, 
              parseFloat(value)
            )}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Score" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(10)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'boolean':
        return (
          <Select 
            value={question.score?.toString() || ''}
            onValueChange={(value) => handleScoreChange(
              sectionIndex, 
              questionIndex, 
              value === 'true' ? 10 : 0
            )}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Answer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  const renderResponseEditor = (
    sectionIndex: number, 
    questionIndex: number, 
    question: ScorecardQuestion
  ) => {
    if (isViewMode) return null;

    return (
      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => addQuestionResponse(sectionIndex, questionIndex)}
        >
          Add Response
        </Button>
        {question.responses?.map((response, responseIndex) => (
          <div key={response.id} className="mt-2">
            <MarkdownEditor
              initialValue={response.comment}
              onChange={(value) => updateQuestionResponse(
                sectionIndex, 
                questionIndex, 
                responseIndex, 
                value
              )}
              readOnly={isViewMode}
            />
          </div>
        ))}
      </div>
    );
  };

  const handleSubmitReview = async () => {
    if (!validateReview) {
      toast.error('Please complete all required scoring');
      return;
    }

    try {
      if (!submissionId || !scorecard) return;
      
      await ReviewService.submitReview(submissionId, {
        scorecard,
        totalScore
      });
      
      toast.success('Review submitted successfully');
      navigate(`/reviews/${challengeId}`);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while submitting review';
      toast.error(errorMessage);
      console.error('Error submitting review:', error);
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (!submissionId || !scorecard) return;
      
      await ReviewService.saveDraftReview(submissionId, {
        scorecard,
        totalScore
      });

      toast.success('Draft saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while saving draft';
      toast.error(errorMessage);
      console.error('Error saving draft:', error);
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate(`/reviews/${challengeId}`);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!scorecard) return <div>No scorecard found</div>;

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{scorecard.title}</h2>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                Total Score: {totalScore.toFixed(2)}
              </Badge>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Back to Challenge
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple">
            {scorecard.sections.map((section: ScorecardSection, sectionIndex) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger>{section.title}</AccordionTrigger>
                <AccordionContent>
                  {section.questions.map((question: ScorecardQuestion, questionIndex) => (
                    <div key={question.id} className="mb-4 p-4 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="font-medium">{question.title}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            (Weight: {question.weight})
                          </span>
                        </div>
                        {renderQuestionInput(sectionIndex, questionIndex, question)}
                      </div>
                      {question.guideline && (
                        <p className="text-sm text-gray-600 italic mb-2">
                          Guideline: {question.guideline}
                        </p>
                      )}
                      {renderResponseEditor(sectionIndex, questionIndex, question)}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {!isViewMode && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button 
                onClick={handleSubmitReview}
                disabled={!validateReview}
              >
                Submit Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancel</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep Editing</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmCancel}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};
