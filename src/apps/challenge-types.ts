// src/apps/review/types/challenge.ts
export interface ChallengeType {
  value: string;
  label: string;
}

export interface Challenge {
  id: string;
  title: string;
  currentPhase: string;
  phaseEndDate: string;
  timeLeft: string;
  reviewProgress: number;
  type: string;
}

export interface ReviewSubmission {
  id: string;
  handle: string;
  userRatingColor: string;
  reviewDate: string | null;
  score: number | null;
  appealsMade: number;
  maxAppeals: number;
  reviewStatus: 'pending' | 'completed';
}

export interface Scorecard {
  id: string;
  title: string;
  sections: ScorecardSection[];
}

export interface ScorecardSection {
  id: string;
  title: string;
  questions: ScorecardQuestion[];
}

export interface ScorecardQuestion {
  id: string;
  title: string;
  weight: number;
  responseType: 'numeric' | 'boolean';
  guideline?: string;
  score?: number;
  responses?: QuestionResponse[];
}

export interface QuestionResponse {
  id: string;
  type: 'comment';
  comment: string;
}

export interface ReviewFetchParams {
  type: string;
  page: number;
  pageSize: number;
}
