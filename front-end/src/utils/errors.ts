/** Extract error message from API error response. Backend always returns { error: string } for errors. */
export const getApiErrorMessage = (err: unknown): string | undefined => {
  const axiosErr = err as { response?: { data?: { error?: string } } };
  if (axiosErr.response && axiosErr.response.data) {
    return axiosErr.response.data.error;
  }
  return undefined;
};
