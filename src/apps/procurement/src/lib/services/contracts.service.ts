import {
    deleteAsync,
    getAsync,
    postAsync,
    putAsync,
} from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { Contract, ContractMutationPayload } from '../models'
import {
    buildProcurementApiUrl,
    normalizeDateOnly,
    normalizeOptionalNumber,
    normalizeRequiredText,
} from '../utils/api.utils'

/**
 * API helpers for procurement contract CRUD endpoints.
 */

/**
 * Creates a procurement contract.
 *
 * @param payload Editable contract fields.
 * @returns Created contract response.
 */
export function createContract(payload: ContractMutationPayload): Promise<Contract> {
    return postAsync<ContractMutationPayload, Contract>(
        buildProcurementApiUrl('contracts'),
        normalizeContractPayload(payload),
    )
}

/**
 * Deletes a procurement contract.
 *
 * @param contractId Contract identifier to delete.
 * @returns Deleted contract response.
 */
export function deleteContract(contractId: string): Promise<Contract> {
    return deleteAsync<Contract>(buildProcurementApiUrl(`contracts/${contractId}`))
}

/**
 * Loads all procurement contracts.
 *
 * @returns Contracts sorted by the backend.
 */
export function getContracts(): Promise<Contract[]> {
    return getAsync<Contract[]>(buildProcurementApiUrl('contracts'))
}

/**
 * Replaces editable procurement contract fields.
 *
 * @param contractId Contract identifier to update.
 * @param payload Editable contract fields.
 * @returns Updated contract response.
 */
export function updateContract(contractId: string, payload: ContractMutationPayload): Promise<Contract> {
    return putAsync<ContractMutationPayload, Contract>(
        buildProcurementApiUrl(`contracts/${contractId}`),
        normalizeContractPayload(payload),
    )
}

/**
 * Normalizes contract mutation payloads before xhr submission.
 *
 * @param payload Editable contract fields.
 * @returns API-ready contract payload.
 */
function normalizeContractPayload(payload: ContractMutationPayload): ContractMutationPayload {
    return {
        autoRenew: payload.autoRenew,
        contractNumber: normalizeRequiredText(payload.contractNumber),
        description: payload.description === undefined ? undefined : payload.description.trim(),
        endDate: normalizeDateOnly(payload.endDate) || payload.endDate,
        renewalNoticeDays: normalizeOptionalNumber(payload.renewalNoticeDays),
        startDate: normalizeDateOnly(payload.startDate) || payload.startDate,
        status: payload.status,
        title: normalizeRequiredText(payload.title),
        value: payload.value,
        vendorId: payload.vendorId,
    }
}
