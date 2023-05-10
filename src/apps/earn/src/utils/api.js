export const tryThrowError = async (res) => {
  if (!res.ok) {
    // network failure
    if (res.statusText) {
      throw new Error(res.statusText);
    }
  }

  return res;
};
