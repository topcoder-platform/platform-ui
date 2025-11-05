export interface Scorecard {
  id: string;
  name: string;
  status: string;
  type: string;
  challengeTrack: string;
  challengeType: string;
  version: string;
  minScore: number;
  maxScore: number;
  minimumPassingScore: number;
}
