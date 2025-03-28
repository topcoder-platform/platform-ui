// src/apps/review/pages/challenge-review-details-page.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton
} from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Challenge, 
  ReviewSubmission 
} from '../types/challenge';
import { ReviewService } from '../services/reviewService';
import { useParams, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const ChallengeReviewDetailsPage: React.FC = () => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();

  const fetchChallengeDetails = async () => {
    if (!challengeId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedChallenge = await ReviewService.fetchChallengeDetails(challengeId);
      setChallenge(fetchedChallenge);

      const fetchedSubmissions = await ReviewService.fetchSubmissions(challengeId);
      setSubmissions(fetchedSubmissions);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while fetching challenge details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetails();
  }, [challengeId]);

  const handleReviewSubmission = (submissionId: string) => {
    navigate(`/reviews/${challengeId}/submissions/${submissionId}`);
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Challenge Details</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchChallengeDetails}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Card className="w-full">
        {isLoading ? (
          <CardHeader>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="flex space-x-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          </CardHeader>
        ) : challenge ? (
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{challenge.title}</h2>
              <div className="flex space-x-4 mt-2">
                <span>Phase: {challenge.currentPhase}</span>
                <span>Phase End: {challenge.phaseEndDate}</span>
                <Badge variant={challenge.timeLeft.startsWith('-') ? 'destructive' : 'success'}>
                  Time Left: {challenge.timeLeft}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">Contact Manager</Button>
              <Button variant="outline">Forum</Button>
            </div>
          </CardHeader>
        ) : null}
        
        <CardContent>
          <Tabs defaultValue="review">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="submission">Submission / Screening</TabsTrigger>
              <TabsTrigger value="review" className="font-bold">Review / Appeals</TabsTrigger>
              <TabsTrigger value="winners">Winners</TabsTrigger>
              <TabsTrigger value="action">Action</TabsTrigger>
            </TabsList>
            <TabsContent value="review">
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Submission ID', 'Handle', 'Review Date', 'Score', 'Appeals', 'Actions'].map(header => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        {[...Array(6)].map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No submissions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submission ID</TableHead>
                      <TableHead>Handle</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Appeals</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map(submission => (
                      <TableRow key={submission.id}>
                        <TableCell>{submission.id}</TableCell>
                        <TableCell 
                          className={`font-medium ${submission.userRatingColor}`}
                        >
                          {submission.handle}
                        </TableCell>
                        <TableCell>{submission.reviewDate || 'Not Reviewed'}</TableCell>
                        <TableCell>
                          {submission.score ? 
                            <Badge variant="secondary">{submission.score.toFixed(2)}</Badge> 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {submission.appealsMade} / {submission.maxAppeals}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleReviewSubmission(submission.id)}
                          >
                            {submission.reviewStatus === 'completed' ? 
                              'View Review' : 'Submit Review'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
