// src/apps/review/routes.tsx
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ActiveReviewsPage } from './pages/active-reviews-page';
import { ChallengeReviewDetailsPage } from './pages/challenge-review-details-page';
import { ChallengeReviewEditPage } from './pages/challenge-review-edit-page';

export const ReviewRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/reviews" element={<ActiveReviewsPage />} />
      <Route path="/reviews/:challengeId" element={<ChallengeReviewDetailsPage />} />
      <Route 
        path="/reviews/:challengeId/submissions/:submissionId" 
        element={<ChallengeReviewEditPage />} 
      />
      {/* Redirect root of reviews to the active reviews page */}
      <Route path="/" element={<Navigate to="/reviews" replace />} />
    </Routes>
  );
};
