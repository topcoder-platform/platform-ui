export interface DefaultChallengeReviewer {
  id: string;
  typeId: string;
  trackId: string;
  timelineTemplateId?: string;
  scorecardId: string;
  isMemberReview: boolean;
  memberReviewerCount?: number;
  phaseName: string;
  phaseId?: string;
  fixedAmount?: number;
  baseCoefficient?: number;
  incrementalCoefficient?: number;
  opportunityType?: string;
  isAIReviewer: boolean;
  aiWorkflowId?: string;
  shouldOpenOpportunity: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DefaultChallengeReviewerWithNames extends DefaultChallengeReviewer {
  typeName?: string;
  trackName?: string;
  timelineTemplateName?: string;
  scorecardName?: string;
}

export interface FormAddDefaultReviewer {
  typeId: string;
  trackId: string;
  timelineTemplateId?: string;
  scorecardId: string;
  isMemberReview: boolean;
  memberReviewerCount?: number;
  phaseName: string;
  phaseId?: string;
  fixedAmount?: number;
  baseCoefficient?: number;
  incrementalCoefficient?: number;
  opportunityType?: string;
  isAIReviewer: boolean;
  shouldOpenOpportunity: boolean;
  aiWorkflowId?: string;
}
