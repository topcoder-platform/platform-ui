/**
 * Model for user status history info
 */
export interface UserStatusHistory {
    id: number | string
    comment: string
    createdAt: Date
}

/**
 * Update user status history to show in ui
 * @param userStatusHistory data from backend response
 * @returns updated user status history info
 */
export function adjustUserStatusHistoryResponse(
    userStatusHistory: UserStatusHistory,
): UserStatusHistory {
    return {
        ...userStatusHistory,
        createdAt: new Date(userStatusHistory.createdAt),
    }
}
