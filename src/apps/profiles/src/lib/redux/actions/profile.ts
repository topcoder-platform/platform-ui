/**
 * @module "actions.profile"
 * @desc Actions for interactions with profile details API.
 * @todo Some of them repeat actions in {@link actions.members.md}. The code
 *  should be refactored to avoid redundancy.
 */
import { createActions } from 'redux-actions'

/**
 * @static
 * @desc Creates and action that loads user profile.
 * @todo This action does not follow the pattern with init/done pairs of
 *  actions. Should be improved.
 * @param {String} handle User handle.
 * @return {Action}
 */
function loadProfile(handle: string): string {
    return handle
}

export default createActions({
    PROFILE: {
        LOAD_PROFILE: loadProfile,
    },
})
