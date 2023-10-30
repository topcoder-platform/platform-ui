export interface ModifyUserMFARequest {
    param: {
        mfaEnabled?: boolean
        diceEnabled?: boolean
    }
}

export interface ModifyUserMFAResponse {
    id: string
    result: {
        content: string
        success: boolean
    }
}
