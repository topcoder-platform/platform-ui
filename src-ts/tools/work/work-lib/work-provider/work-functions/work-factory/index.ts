export * from './work-solution.model'
export {
    create as workFactoryCreate,
    buildCreateBody as workFactoryBuildCreateBody,
    buildUpdateBody as workFactoryBuildUpdateBody,
    getStatus as workFactoryGetStatus,
    mapFormData as workFactoryMapFormData,
} from './work.factory'
