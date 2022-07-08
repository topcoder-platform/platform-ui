import { LearnMyCertificationProgress } from './learn-my-certification-progress.model'

export function decorateCompletedPercentage(myCertification: LearnMyCertificationProgress): LearnMyCertificationProgress {
    const progress: {completedLessons: number, lessonCount: number } = myCertification.modules.reduce((prev, m) => ({
        completedLessons: prev.completedLessons + m.completedLessons.length,
        lessonCount: prev.lessonCount + m.lessonCount,
    }), {lessonCount: 0, completedLessons: 0})

    return {
        ...myCertification,
        completedPercentage: progress.completedLessons / progress.lessonCount,
    }
}

export function mapCompletedPercentage(myCertifications: Array<LearnMyCertificationProgress>): Array<LearnMyCertificationProgress> {
    return myCertifications.map(decorateCompletedPercentage)
}
