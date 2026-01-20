/**
 * App navigation
 */
import { NavigateOptions, To, useLocation, useNavigate } from 'react-router-dom'

interface AppNavigateOptions extends NavigateOptions {
    fallback?: string
}

interface AppNavigateFunction {
    (to: To | number, options?: AppNavigateOptions): void | Promise<void>
    (delta: number): void | Promise<void>
}

/**
 * Navigate with fallback
 * @returns navigate
 */
const useAppNavigate = (): AppNavigateFunction => {
    const location = useLocation()
    const navigateBase = useNavigate()

    const navigate: AppNavigateFunction = (
        to: To | number,
        options?: AppNavigateOptions,
    ) => {
        if (typeof to === 'number') {
            if (options?.fallback && to < 0 && location.key === 'default') {
                return navigateBase(options.fallback, {
                    replace: true,
                })
            }

            return navigateBase(to)
        }

        return navigateBase(to, options)
    }

    return navigate
}

export { useAppNavigate }
