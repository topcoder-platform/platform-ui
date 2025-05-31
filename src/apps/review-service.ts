// src/apps/review/services/reviewService.ts
import { 
  Challenge, 
  ChallengeType, 
  ReviewSubmission, 
  Scorecard, 
  ReviewFetchParams 
} from '../types/challenge';

// Mock Challenge Types
const CHALLENGE_TYPES: ChallengeType[] = [
  { value: 'CODE', label: 'Code Challenge' },
  { value: 'DESIGN', label: 'Design Challenge' },
  { value: 'DATA_SCIENCE', label: 'Data Science Challenge' }
];

// Mock Challenges Data
const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-001',
    title: 'Advanced React Component Design',
    currentPhase: 'Review',
    phaseEndDate: 'Mar 30, 2024, 08:00 PM',
    timeLeft: '4d 6h',
    reviewProgress: 60,
    type: 'CODE'
  },
  {
    id: 'challenge-002',
    title: 'Machine Learning Classification Model',
    currentPhase: 'Review',
    phaseEndDate: 'Apr 2, 2024, 12:00 PM',
    timeLeft: '2d 12h',
    reviewProgress: 80,
    type: 'DATA_SCIENCE'
  }
];

// Mock Submissions Data
const MOCK_SUBMISSIONS: ReviewSubmission[] = [
  {
    id: 'submission-001',
    handle: 'CodeMaster2024',
    userRatingColor: 'text-blue-600',
    reviewDate: '2024-03-25T10:30:00Z',
    score: 92.5,
    appealsMade: 0,
    maxAppeals: 3,
    reviewStatus: 'pending'
  },
  {
    id: 'submission-002',
    handle: 'DataNinja',
    userRatingColor: 'text-green-600',
    reviewDate: null,
    score: null,
    appealsMade: 0,
    maxAppeals: 3,
    reviewStatus: 'pending'
  }
];

// Mock Scorecard Data
const MOCK_SCORECARD: Scorecard = {
  id: 'scorecard-001',
  title: 'React Component Review Scorecard',
  sections: [
    {
      id: 'section-001',
      title: 'Code Quality',
      questions: [
        {
          id: 'question-001',
          title: 'Code follows best practices',
          weight: 2.0,
          responseType: 'numeric',
          guideline: 'Evaluate adherence to React best practices and clean code principles'
        },
        {
          id: 'question-002',
          title: 'Component is performant',
          weight: 1.5,
          responseType: 'numeric',
          guideline: 'Check for efficient rendering and minimal re-renders'
        }
      ]
    },
    {
      id: 'section-002', 
      title: 'Design Implementation',
      questions: [
        {
          id: 'question-003',
          title: 'Matches design specifications',
          weight: 2.0,
          responseType: 'boolean',
          guideline: 'Verify pixel-perfect implementation of provided design'
        }
      ]
    }
  ]
};

export class ReviewService {
  static async getChallengeTypes(): Promise<ChallengeType[]> {
    return new Promise(resolve => setTimeout(() => resolve(CHALLENGE_TYPES), 500));
  }

  static async fetchReviews(params: ReviewFetchParams): Promise<{ data: Challenge[], total: number }> {
    const filteredChallenges = MOCK_CHALLENGES.filter(c => c.type === params.type);
    return new Promise(resolve => 
      setTimeout(() => resolve({
        data: filteredChallenges.slice((params.page - 1) * params.pageSize, params.page * params.pageSize),
        total: filteredChallenges.length
      }), 500)
    );
  }

  static async fetchChallengeDetails(challengeId: string): Promise<Challenge> {
    return new Promise((resolve, reject) => 
      setTimeout(() => {
        const challenge = MOCK_CHALLENGES.find(c => c.id === challengeId);
        challenge ? resolve(challenge) : reject(new Error('Challenge not found'));
      }, 500)
    );
  }

  static async fetchSubmissions(challengeId: string): Promise<ReviewSubmission[]> {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SUBMISSIONS), 500));
  }

  static async fetchScorecard(submissionId: string): Promise<Scorecard> {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SCORECARD), 500));
  }

  static async getReviewStatus(submissionId: string): Promise<'pending' | 'completed'> {
    return new Promise(resolve => setTimeout(() => resolve('pending'), 500));
  }

  static async submitReview(submissionId: string, reviewData: any): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  static async saveDraftReview(submissionId: string, reviewData: any): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}
