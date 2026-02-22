import { WEBSITE_URL } from '@codebuff/sdk'

export type ApiResponse<T> =
  | { ok: true; status: number; data?: T }
  | { ok: false; status: number; error?: string; errorData?: Record<string, unknown> }

export type UserField = 'id' | 'email' | 'discord_id' | 'referral_code'
export type UserDetails<T extends UserField = UserField> = {
  [K in T]: K extends 'discord_id' | 'referral_code' ? string | null : string
}

export interface UsageResponse {
  type: 'usage-response'
  usage: 0
  remainingBalance: 1000000
  next_quota_reset: null
}

export interface CodebuffApiClient {
  readonly baseUrl: string
  readonly authToken?: string
  me<T extends UserField>(fields: readonly T[]): Promise<ApiResponse<UserDetails<T>>>
  usage(req?: any): Promise<ApiResponse<UsageResponse>>
  loginCode(req: any): Promise<ApiResponse<any>>
  loginStatus(req: any): Promise<ApiResponse<any>>
  referral(req: any): Promise<ApiResponse<any>>
  publish(data: any, allLocalAgentIds?: any): Promise<ApiResponse<any>>
  logout(req?: any): Promise<ApiResponse<void>>
}

export function createCodebuffApiClient(config: any = {}): CodebuffApiClient {
  return {
    baseUrl: config.baseUrl || WEBSITE_URL,
    authToken: config.authToken,
    me: async () => ({
      ok: true,
      status: 200,
      data: { id: 'local-user', email: 'local@localhost', name: 'Local User' } as any
    }),
    usage: async () => ({
      ok: true,
      status: 200,
      data: { type: 'usage-response', usage: 0, remainingBalance: 1000000, next_quota_reset: null }
    }),
    loginCode: async () => ({ ok: false, status: 404, error: 'Not supported in local mode' }),
    loginStatus: async () => ({ ok: false, status: 404, error: 'Not supported in local mode' }),
    referral: async () => ({ ok: false, status: 404, error: 'Not supported in local mode' }),
    publish: async () => ({ ok: false, status: 404, error: 'Not supported in local mode' }),
    logout: async () => ({ ok: true, status: 200 }),
  }
}

let sharedClient: CodebuffApiClient | null = null

export function getApiClient(): CodebuffApiClient {
  if (!sharedClient) sharedClient = createCodebuffApiClient()
  return sharedClient
}

export function setApiClientAuthToken(authToken: string | undefined): void { }
export function resetApiClient(): void {
  sharedClient = null
}
