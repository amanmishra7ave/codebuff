import { useCallback } from 'react'

// Query keys for type-safe cache management
export const usageQueryKeys = {
  all: ['usage'] as const,
  current: () => [...usageQueryKeys.all, 'current'] as const,
}

interface UsageResponse {
  type: 'usage-response'
  usage: number
  remainingBalance: number | null
  balanceBreakdown?: {
    free: number
    paid: number
    ad?: number
    referral?: number
    admin?: number
  }
  next_quota_reset: string | null
  autoTopupEnabled?: boolean
}

export async function fetchUsageData(): Promise<UsageResponse> {
  return {
    type: 'usage-response',
    usage: 0,
    remainingBalance: 1000000,
    next_quota_reset: null,
  }
}

export function useUsageQuery() {
  return {
    data: {
      type: 'usage-response',
      usage: 0,
      remainingBalance: 1000000,
      next_quota_reset: null,
    },
    isLoading: false,
    isError: false,
  }
}

export function useRefreshUsage() {
  return useCallback(() => { }, [])
}
