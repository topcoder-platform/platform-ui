// src/apps/review/pages/active-reviews-page.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
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
  ChallengeType, 
  ReviewFetchParams 
} from '../types/challenge';
import { ReviewService } from '../services/reviewService';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const ActiveReviewsPage: React.FC = () => {
  const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('CODE');
  const [reviews, setReviews] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch challenge types
      const types = await ReviewService.getChallengeTypes();
      setChallengeTypes(types);

      // Fetch reviews
      const reviewParams: ReviewFetchParams = {
        type: selectedType,
        page: pagination.page,
        pageSize: pagination.pageSize
      };
      const fetchedReviews = await ReviewService.fetchReviews(reviewParams);
      setReviews(fetchedReviews.data);
      setPagination(prev => ({
        ...prev,
        total: fetchedReviews.total
      }));
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while fetching reviews';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType, pagination.page]);

  const getTimeLeftColor = (timeLeft: string) => {
    if (timeLeft.startsWith('-')) return 'destructive';
    const timeValue = parseInt(timeLeft);
    if (timeValue < 1) return 'warning';
    return 'success';
  };

  const handleChallengeSelect = (challengeId: string) => {
    navigate(`/reviews/${challengeId}`);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Reviews</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Active Reviews</h2>
            <Select 
              value={selectedType}
              onValueChange={setSelectedType}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Challenge Type" />
              </SelectTrigger>
              <SelectContent>
                {challengeTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {['#', 'Project', 'Phase', 'Time Left', 'Review Progress', 'Actions'].map(header => (
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
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No active reviews found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead>Review Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review, index) => (
                    <TableRow key={review.id}>
                      <TableCell>{(pagination.page - 1) * pagination.pageSize + index + 1}</TableCell>
                      <TableCell 
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => handleChallengeSelect(review.id)}
                      >
                        {review.title}
                      </TableCell>
                      <TableCell>{review.currentPhase}</TableCell>
                      <TableCell>
                        <Badge variant={getTimeLeftColor(review.timeLeft)}>
                          {review.timeLeft}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{width: `${review.reviewProgress}%`}}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleChallengeSelect(review.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagination.total > pagination.pageSize && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
