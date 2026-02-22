
export function startOAuthFlow(): { codeVerifier: string; authUrl: string } {
  throw new Error('Claude OAuth is not available in local-only mode.')
}

export async function openOAuthInBrowser(): Promise<string> {
  throw new Error('Claude OAuth is not available in local-only mode.')
}

export async function exchangeCodeForTokens(): Promise<any> {
  throw new Error('Claude OAuth is not available in local-only mode.')
}

export function disconnectClaudeOAuth(): void {
}

export function getClaudeOAuthStatus(): {
  connected: boolean
  expiresAt?: number
  connectedAt?: number
} {
  return { connected: false }
}
