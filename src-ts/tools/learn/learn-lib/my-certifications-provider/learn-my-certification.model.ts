import { LearnCertification } from '../certifications-provider'

import { LearnMyCertificationProgress } from './learn-my-certification-progress.model'

export interface LearnMyCertification extends LearnCertification {
    progress: LearnMyCertificationProgress
}
