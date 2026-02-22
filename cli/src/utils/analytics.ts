import type { AnalyticsEvent } from '@codebuff/common/constants/analytics-events'

export function initAnalytics() { }
export async function flushAnalytics() { }
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, any>) { }
export function identifyUser(userId: string, properties?: Record<string, any>) { }
export function logError(error: any, userId?: string, properties?: Record<string, any>) { }
export function setAnalyticsErrorLogger(loggerFn: any) { }
export function resetAnalyticsState(deps?: any) { }
export let identified: boolean = false
