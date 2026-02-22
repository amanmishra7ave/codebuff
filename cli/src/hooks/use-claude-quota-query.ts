
// Query keys for type-safe cache management
export const claudeQuotaQueryKeys = {
  all: ['claude-quota'] as const,
  current: () => [...claudeQuotaQueryKeys.all, 'current'] as const,
}

/**
 * Parsed quota data for display
 */
export interface ClaudeQuotaData {
  /** Remaining percentage for the 5-hour window (0-100) */
  fiveHourRemaining: number
  /** When the 5-hour quota resets */
  fiveHourResetsAt: Date | null
  /** Remaining percentage for the 7-day window (0-100) */
  sevenDayRemaining: number
  /** When the 7-day quota resets */
  sevenDayResetsAt: Date | null
}

export async function fetchClaudeQuota(): Promise<ClaudeQuotaData> {
  return {
    fiveHourRemaining: 100,
    fiveHourResetsAt: null,
    sevenDayRemaining: 100,
    sevenDayResetsAt: null,
  }
}

export function useClaudeQuotaQuery() {
  return {
    data: {
      fiveHourRemaining: 100,
      fiveHourResetsAt: null,
      sevenDayRemaining: 100,
      sevenDayResetsAt: null,
    },
    isLoading: false,
    isError: false,
  }
}
