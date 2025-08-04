import { BackendResource } from './BackendResource.model'

/**
 * My role infos mapping type
 */
export type MyRoleInfosMappingType = {
    [challengeId: string]: BackendResource[]
}
