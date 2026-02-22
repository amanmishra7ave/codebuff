import fs from 'fs'
import os from 'os'
import path from 'path'

import { env } from '@codebuff/common/env'
import { z } from 'zod'

// User schema
const userSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string(),
  authToken: z.string(),
  fingerprintId: z.string().optional(),
  fingerprintHash: z.string().optional(),
  credits: z.number().optional(),
})

export type User = z.infer<typeof userSchema>

// Get the config directory path
export const getConfigDir = (): string => {
  return path.join(
    os.homedir(),
    '.config',
    'manicode' +
    (env.NEXT_PUBLIC_CB_ENVIRONMENT !== 'prod'
      ? `-${env.NEXT_PUBLIC_CB_ENVIRONMENT}`
      : ''),
  )
}

// Get the credentials file path
export const getCredentialsPath = (): string => {
  return path.join(getConfigDir(), 'credentials.json')
}

/**
 * Get user credentials from file system
 */
export const getUserCredentials = (): User | null => {
  return {
    id: 'local-user',
    name: 'Local User',
    email: 'local@localhost',
    authToken: 'local-token',
  }
}

export const saveUserCredentials = (user: User): void => {
  // No-op in local mode
}

export type AuthTokenSource = 'local' | null

export interface AuthTokenDetails {
  token?: string
  source: AuthTokenSource
}

export const getAuthTokenDetails = (): AuthTokenDetails => {
  return { token: 'local-token', source: 'local' }
}

export const getAuthToken = (): string | undefined => {
  return 'local-token'
}

export const hasAuthCredentials = (): boolean => {
  return true
}

export interface AuthValidationResult {
  authenticated: boolean
  hasInvalidCredentials: boolean
}

export const logoutUser = async (): Promise<boolean> => {
  return true
}
