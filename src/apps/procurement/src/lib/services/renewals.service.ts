import {
    deleteAsync,
    getAsync,
    patchAsync,
    postAsync,
    putAsync,
} from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { Renewal, RenewalMutationPayload, RenewalStage, RenewalStageMetadata } from '../models'
import {
    buildProcurementApiUrl,
    normalizeDateOnly,
    normalizeOptionalNumber,
    normalizeOptionalText,
} from '../utils/api.utils'

interface RenewalStageMutationPayload {
    targetStage: RenewalStage
}

/**
 * API helpers for procurement renewal CRUD and workflow endpoints.
 */

/**
 * Creates a renewal workflow at the backend starting stage.
 *
 * @param payload Editable renewal fields.
 * @returns Created renewal response.
 */
export function createRenewal(payload: RenewalMutationPayload): Promise<Renewal> {
    return postAsync<RenewalMutationPayload, Renewal>(
        buildProcurementApiUrl('renewals'),
        normalizeRenewalPayload(payload),
    )
}

/**
 * Deletes a renewal workflow.
 *
 * @param renewalId Renewal identifier to delete.
 * @returns Deleted renewal response.
 */
export function deleteRenewal(renewalId: string): Promise<Renewal> {
    return deleteAsync<Renewal>(buildProcurementApiUrl(`renewals/${renewalId}`))
}

/**
 * Loads all renewal workflows.
 *
 * @returns Renewals sorted by the backend.
 */
export function getRenewals(): Promise<Renewal[]> {
    return getAsync<Renewal[]>(buildProcurementApiUrl('renewals'))
}

/**
 * Loads backend renewal workflow stage metadata.
 *
 * @returns Stage metadata sorted by the backend.
 */
export function getRenewalStages(): Promise<RenewalStageMetadata[]> {
    return getAsync<RenewalStageMetadata[]>(buildProcurementApiUrl('renewals/stages'))
}

/**
 * Moves a renewal workflow one adjacent stage forward or backward.
 *
 * @param renewalId Renewal identifier to transition.
 * @param targetStage Adjacent target stage.
 * @returns Updated renewal response.
 */
export function moveRenewalStage(renewalId: string, targetStage: RenewalStage): Promise<Renewal> {
    return patchAsync<RenewalStageMutationPayload, Renewal>(
        buildProcurementApiUrl(`renewals/${renewalId}/stage`),
        { targetStage },
    )
}

/**
 * Replaces editable renewal fields without changing workflow stage.
 *
 * @param payload Editable renewal fields.
 * @param renewalId Renewal identifier to update.
 * @returns Updated renewal response.
 */
export function updateRenewal(renewalId: string, payload: RenewalMutationPayload): Promise<Renewal> {
    return putAsync<RenewalMutationPayload, Renewal>(
        buildProcurementApiUrl(`renewals/${renewalId}`),
        normalizeRenewalPayload(payload),
    )
}

/**
 * Normalizes renewal mutation payloads before xhr submission.
 *
 * @param payload Editable renewal fields.
 * @returns API-ready renewal payload.
 */
function normalizeRenewalPayload(payload: RenewalMutationPayload): RenewalMutationPayload {
    return {
        assignee: normalizeOptionalText(payload.assignee),
        contractId: payload.contractId,
        newEndDate: normalizeDateOnly(payload.newEndDate) || payload.newEndDate,
        newStartDate: normalizeDateOnly(payload.newStartDate) || payload.newStartDate,
        newValue: normalizeOptionalNumber(payload.newValue),
        notes: normalizeOptionalText(payload.notes),
        renewalTermMonths: payload.renewalTermMonths,
    }
}
