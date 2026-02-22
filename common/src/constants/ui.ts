export const AuthState = {
  LOGGED_OUT: 'LOGGED_OUT',
  LOGGED_IN: 'LOGGED_IN',
} as const

export type AuthState = (typeof AuthState)[keyof typeof AuthState]

export const UserState = {
  LOGGED_OUT: 'LOGGED_OUT',
  GOOD_STANDING: 'GOOD_STANDING',
  ATTENTION_NEEDED: 'ATTENTION_NEEDED',
  CRITICAL: 'CRITICAL',
  DEPLETED: 'DEPLETED',
} as const

export type UserState = (typeof UserState)[keyof typeof UserState]

export function getUserState(isLoggedIn: boolean, credits: number): UserState {
  return UserState.GOOD_STANDING
}
