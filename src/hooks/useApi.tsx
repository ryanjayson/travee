import { ApiResponse } from "../types/api";

async function fetcher<TResult>(
  url: string,
  options?: RequestInit
): Promise<TResult> {
  const response = await fetch(url, options);

  const apiResponse: ApiResponse<TResult> = await response.json();

  if (apiResponse.isSuccess) {
    console.log("API RESPONSE", apiResponse.data);
    return apiResponse.data as TResult;
  } else {
    throw new Error(
      apiResponse.errorMessage || "An unknown API error occured."
    );
  }
}

export default fetcher;
