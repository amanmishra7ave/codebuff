import type {
  AddAgentStepFn,
  FetchAgentFromDatabaseFn,
  FinishAgentRunFn,
  GetUserInfoFromApiKeyInput,
  GetUserInfoFromApiKeyOutput,
  StartAgentRunFn,
  UserColumn,
} from '@codebuff/common/types/contracts/database'
import type { ParamsOf } from '@codebuff/common/types/function-params'

export async function getUserInfoFromApiKey<T extends UserColumn>(
  params: GetUserInfoFromApiKeyInput<T>,
): GetUserInfoFromApiKeyOutput<T> {
  const { fields } = params
  const mockUser: any = {
    id: 'local-user',
    email: 'local@localhost',
    name: 'Local User',
    stripe_customer_id: null,
    banned: false,
  }

  return Object.fromEntries(
    fields.map((field) => [field, mockUser[field]]),
  ) as Awaited<GetUserInfoFromApiKeyOutput<T>>
}

export async function fetchAgentFromDatabase(
  params: ParamsOf<FetchAgentFromDatabaseFn>,
): ReturnType<FetchAgentFromDatabaseFn> {
  return null
}

export async function startAgentRun(
  params: ParamsOf<StartAgentRunFn>,
): ReturnType<StartAgentRunFn> {
  return 'local-run-' + Math.random().toString(36).substring(7)
}

export async function finishAgentRun(
  params: ParamsOf<FinishAgentRunFn>,
): ReturnType<FinishAgentRunFn> {
  return
}

export async function addAgentStep(
  params: ParamsOf<AddAgentStepFn>,
): ReturnType<AddAgentStepFn> {
  return 'local-step-' + Math.random().toString(36).substring(7)
}
