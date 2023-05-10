import { Challenge } from './challenge.model'

export type CreateWorkRequest = Pick<
    Challenge,
    'description' |
    'discussions' |
    'legacy' |
    'metadata' |
    'name' |
    'tags' |
    'timelineTemplateId' |
    'trackId' |
    'typeId'
>
