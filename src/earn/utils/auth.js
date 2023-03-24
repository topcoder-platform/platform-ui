import _ from "lodash";
import store from "../../store";

/**
 * Get authenticated user tokens.
 */
export const getAuthUserTokens = () => {
    const { auth } = store.getState();
  
    if (auth.isInitialized) {
      return Promise.resolve(_.pick(auth, ["tokenV2", "tokenV3"]));
    } else {
      return new Promise((resolve) => {
        store.subscribe(() => {
          const { auth } = store.getState();
  
          if (auth.isInitialized) {
            resolve(_.pick(auth, ["tokenV2", "tokenV3"]));
          }
        });
      });
    }
  };
  