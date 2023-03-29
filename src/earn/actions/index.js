import auth from "./auth";
import challenges from "./challenges";
import filter from "./filter";
import lookup from "./lookup";

export const actions = {
  ...auth,
  challenges,
  filter,
  ...lookup,
};

export default actions;
