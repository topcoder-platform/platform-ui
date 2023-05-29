export interface ModifyUserRoleRequest {
    param: {
        primaryRole: string
    }
}

export interface ModifyUserRoleResponse {
    id: string
    result: {
        content: string
        success: boolean
    }
}
