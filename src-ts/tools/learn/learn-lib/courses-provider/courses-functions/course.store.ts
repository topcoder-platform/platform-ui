import { learnUrlGet, learnXhrGetAsync } from '../../functions'

import { LearnCourse } from './learn-course.model'

export function getAsync(provider: string, certification: string):
    Promise<LearnCourse | undefined> {

    const url: string = learnUrlGet('courses', `?certification=${certification}&provider=${provider}`)

    return learnXhrGetAsync<Array<LearnCourse>>(url)
        .then(courses => courses[0])
}
