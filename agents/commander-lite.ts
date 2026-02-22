import commander from './commander'

import type { AgentDefinition } from './types/agent-definition'

const definition: AgentDefinition = {
  ...commander,
  id: 'commander-lite',
  displayName: 'Commander Lite',
  model: 'deepseek-coder',
}

export default definition
