export interface ApiResponse<TData> {
  data: TData | null;
  isSuccess: boolean;
  errorMessage: string | null;
}

export interface UserQueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}
