import { get } from 'lodash'
import { ComponentType, lazy, LazyExoticComponent } from 'react'

export type LazyLoadedComponent = LazyExoticComponent<ComponentType<any>>

export type LazyLoadType = (
    moduleImport: () => Promise<any>,
    namedExport?: string
) => LazyLoadedComponent

/**
 * Utility wrapper around react's `lazy` method,
 * it allows importing default and named exports from modules using the same unique method
 * (while react's `lazy` method only allows to import default exports)
 */
export const lazyLoad: LazyLoadType = (moduleImport: () => Promise<any>, namedExport: string = 'default') => (
    lazy(() => moduleImport()
        .then(m => ({ default: get(m, namedExport) })))
)
