export interface ApiErrorLike {
  response?: {
    data?: string | {
      message?: string;
    };
  };
  message?: string;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const apiError = error as ApiErrorLike;
    const responseData = apiError.response?.data;
    if (typeof responseData === 'string' && responseData) return responseData;
    if (responseData && typeof responseData === 'object' && responseData.message) {
      return responseData.message;
    }
    return apiError.message || fallback;
  }

  return fallback;
}
