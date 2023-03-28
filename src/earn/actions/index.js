import auth from "./auth";
import challenges from "./challenges";
import filter from "./filter";

export const actions = {
  ...auth,
  challenges,
  filter,
};

export default actions;
