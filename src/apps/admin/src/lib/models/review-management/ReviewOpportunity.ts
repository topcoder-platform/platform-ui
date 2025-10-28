import { Reviewer } from './Reviewer'

export interface ReviewOpportunity {
    /** Id */
    id: string;
    /** Challenge id */
    challengeId: string;
    /** Open positions */
    openPositions: number;
    /** Start Date */
    startDate: string;
    /** Number Of submissions */
    submissions: number;
    /** Review type */
    type: string;
    /** Review applications */
    applications: Reviewer[];
}
