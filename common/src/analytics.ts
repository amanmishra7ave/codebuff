import type { AnalyticsEvent } from './constants/analytics-events'
import type { Logger } from '@codebuff/common/types/contracts/logger'

export async function flushAnalytics(_logger?: Logger) {
  // Disable analytics for local-only mode
}

export function trackEvent({
  event,
  userId,
  properties,
  logger,
}: {
  event: AnalyticsEvent
  userId: string
  properties?: Record<string, any>
  logger: Logger
}) {
  // Always log event to debug logger, but never send to external services
  logger.debug({ event, userId, properties }, `[analytics] ${event}`)
}
