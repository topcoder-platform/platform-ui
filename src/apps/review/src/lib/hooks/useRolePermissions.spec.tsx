/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { FC, PropsWithChildren } from 'react'
import { renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'

import {
    ChallengeDetailContext,
    ReviewAppContext,
} from '../contexts'
import type {
    ChallengeDetailContextModel,
    ReviewAppContextModel,
} from '../models'

import {
    useRolePermissions,
    UseRolePermissionsResult,
} from './useRolePermissions'

jest.mock('../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
        ReviewAppContext: React.createContext({}),
    }
})

jest.mock('~/libs/core', () => ({
    UserRole: {
        administrator: 'administrator',
        projectManager: 'project manager',
    },
}), { virtual: true })

const challengeContext = {
    challengeId: 'completed-design-f2f',
    myResources: [{
        id: 'iterative-reviewer-resource',
        memberId: 'iterative-reviewer-member',
        roleName: 'Iterative Reviewer',
    }],
    myRoles: ['Iterative Reviewer'],
} as unknown as ChallengeDetailContextModel

const reviewAppContext = {
    loginUserInfo: {
        roles: [],
        userId: 'iterative-reviewer-member',
    },
} as unknown as ReviewAppContextModel

/**
 * Supplies the challenge and login contexts for an Iterative Reviewer.
 *
 * @param props React children rendered by the hook test.
 * @returns Context providers containing an Iterative Reviewer assignment.
 * @throws Never.
 */
const ContextWrapper: FC<PropsWithChildren> = props => (
    <ReviewAppContext.Provider value={reviewAppContext}>
        <ChallengeDetailContext.Provider value={challengeContext}>
            {props.children}
        </ChallengeDetailContext.Provider>
    </ReviewAppContext.Provider>
)

describe('useRolePermissions', () => {
    it('lets an Iterative Reviewer view all submissions without regular Reviewer permissions', () => {
        const { result }: RenderHookResult<
            UseRolePermissionsResult,
            unknown
        > = renderHook(
            () => useRolePermissions(),
            { wrapper: ContextWrapper },
        )

        expect(result.current.hasReviewerRole)
            .toBe(false)
        expect(result.current.canViewAllSubmissions)
            .toBe(true)
    })
})
