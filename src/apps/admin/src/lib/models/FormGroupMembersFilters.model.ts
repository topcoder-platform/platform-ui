/**
 * Model for group members filters form
 */
export interface FormGroupMembersFilters {
  memberId?: string
  memberName?: string
  createdBy?: string
  modifiedBy?: string
  createdAtFrom?: Date | null
  createdAtTo?: Date | null
  modifiedAtFrom?: Date | null
  modifiedAtTo?: Date | null
}
