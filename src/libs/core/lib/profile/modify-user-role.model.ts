export interface ModifyUserPropertyRequest {
    param: {
        primaryRole?: string
        credential?: {
            currentPassword: string
            password: string
        }
    }
}

export interface ModifyUserPropertyResponse {
    id: string
    result: {
        content: string | any
        success: boolean
    }
}
