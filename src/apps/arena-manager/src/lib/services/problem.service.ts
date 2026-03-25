/**
 * Problem library API service.
 *
 * Wraps the /problem endpoints of the arena-manager api.
 */
import { ResponseObject, SourceProblem } from '../models'

import { arenaApiRequest, arenaApiUploadBinary } from './arena-manager.service'

/**
 * Fetches the full list of registered problems.
 */
export async function getProblems(): Promise<ResponseObject<SourceProblem[]>> {
    return arenaApiRequest<SourceProblem[]>('GET', '/problem/list')
}

/**
 * Fetches a single problem by ID.
 */
export async function getProblem(
    problemId: string,
): Promise<ResponseObject<SourceProblem>> {
    return arenaApiRequest<SourceProblem>('GET', `/problem/${problemId}`)
}

/**
 * Uploads a problem ZIP file as a raw binary stream.
 * Returns the newly registered problem with its generated ID.
 */
export async function uploadProblem(
    file: File,
    problemName?: string,
): Promise<ResponseObject<SourceProblem>> {
    return arenaApiUploadBinary<SourceProblem>('/problem/upload', file, problemName)
}

/**
 * Triggers a Docker-based test run for a problem.
 * The backend returns the docker build/run log as a plain string in `data`.
 */
export async function testProblem(
    problemId: string,
): Promise<ResponseObject<string>> {
    return arenaApiRequest<string>('POST', `/problem/test/${problemId}`)
}

/**
 * Deletes a problem and its associated files from the server.
 */
export async function deleteProblem(
    problemId: string,
): Promise<ResponseObject<void>> {
    return arenaApiRequest<void>('DELETE', `/problem/${problemId}`)
}

/**
 * Fetches the Docker build log for the most recent test run of a problem.
 * Returns the raw log text in `data`.
 */
export async function getProblemLog(
    problemId: string,
): Promise<ResponseObject<string>> {
    return arenaApiRequest<string>('GET', `/problem/${problemId}/log`)
}

/**
 * Sets the contest-ready flag for a problem.
 * @param flag true = flag as contest-ready, false = unflag
 */
export async function flagProblem(
    problemId: string,
    flag: boolean,
): Promise<ResponseObject<SourceProblem>> {
    return arenaApiRequest<SourceProblem>(
        'POST',
        `/problem/flag/${problemId}`,
        { isContestReady: flag },
    )
}
