/**
 * Response from POST /uown/auth/authorize
 * Returns a bearer token (API key) for merchant LOS partner endpoints.
 */
export interface GetApiKeyResponse {
  /** Generated API key (bearer token) */
  key: string;
  /** Expiration date/time (ISO string from Java LocalDateTime) */
  expires: string;
  /** Error message (null on success) */
  error: string | null;
}

/**
 * Request body for POST /uown/auth/createOrUpdateApiUser
 */
export interface CreateApiUserRequest {
  /** pk=0 to create; pk>0 to update (must match existing record) */
  pk: number;
  companyName: string;
  username: string;
  password: string;
  /** API user type — drives Authorization format enforcement in RequestFilter */
  apiUserType: 'MERCHANT' | 'VENDOR' | null;
}

/**
 * Response from POST /uown/auth/createOrUpdateApiUser
 */
export interface CreateApiUserResponse {
  pk: number;
  info: {
    pk: number;
    companyName: string;
    username: string;
    password: string;
    apiUserType: 'MERCHANT' | 'VENDOR' | null;
  };
}
