import z from 'zod'

import { jsonValueSchema } from '../json'

export const providerMetadataSchema = z.record(
  z.string(),
  z.record(z.string(), jsonValueSchema),
)

export type ProviderMetadata = z.infer<typeof providerMetadataSchema>
