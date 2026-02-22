#!/usr/bin/env bun

import fs from 'fs'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'

import { getProjectFileTree } from '@codebuff/common/project-file-tree'
import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query'
import { Command } from 'commander'
import React from 'react'

import { App } from './app'
import { initializeApp } from './init/init-app'
import { getProjectRoot, setProjectRoot } from './project-files'
import { resetCodebuffClient } from './utils/codebuff-client'
import { getCliEnv } from './utils/env'
import { initializeAgentRegistry } from './utils/local-agent-registry'
import { clearLogFile, logger } from './utils/logger'
import { shouldShowProjectPicker } from './utils/project-picker'
import { saveRecentProject } from './utils/recent-projects'
import { installProcessCleanupHandlers } from './utils/renderer-cleanup'
import { initializeSkillRegistry } from './utils/skill-registry'
import { detectTerminalTheme } from './utils/terminal-color-detection'
import { setOscDetectedTheme } from './utils/theme-system'

import type { AgentMode } from './utils/constants'
import type { FileTreeNode } from '@codebuff/common/util/file'

const require = createRequire(import.meta.url)

function loadPackageVersion(): string {
  const env = getCliEnv()
  if (env.CODEBUFF_CLI_VERSION) {
    return env.CODEBUFF_CLI_VERSION
  }

  try {
    const pkg = require('../package.json') as { version?: string }
    if (pkg.version) {
      return pkg.version
    }
  } catch {
    // Continue to dev fallback
  }

  return 'dev'
}

focusManager.setEventListener(() => {
  return () => { }
})
focusManager.setFocused(true)

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}

type ParsedArgs = {
  initialPrompt: string | null
  agent?: string
  clearLogs: boolean
  continue: boolean
  continueId?: string | null
  cwd?: string
  initialMode?: AgentMode
}

function parseArgs(): ParsedArgs {
  const program = new Command()

  program
    .name('codebuff')
    .description('Codebuff CLI - Local AI-powered coding assistant')
    .version(loadPackageVersion(), '-v, --version', 'Print the CLI version')
    .option(
      '--agent <agent-id>',
      'Run a specific agent id',
    )
    .option('--clear-logs', 'Remove any existing CLI log files before starting')
    .option(
      '--continue [conversation-id]',
      'Continue from a previous conversation',
    )
    .option(
      '--cwd <directory>',
      'Set the working directory',
    )
    .helpOption('-h, --help', 'Show this help message')
    .argument('[prompt...]', 'Initial prompt to send to the agent')
    .allowExcessArguments(true)
    .parse(process.argv)

  const options = program.opts()
  const args = program.args

  const continueFlag = options.continue

  return {
    initialPrompt: args.length > 0 ? args.join(' ') : null,
    agent: options.agent,
    clearLogs: options.clearLogs || false,
    continue: Boolean(continueFlag),
    continueId:
      typeof continueFlag === 'string' && continueFlag.trim().length > 0
        ? continueFlag.trim()
        : null,
    cwd: options.cwd,
    initialMode: 'DEFAULT',
  }
}

async function main(): Promise<void> {
  if (process.stdin.isTTY && process.platform !== 'win32') {
    try {
      const oscTheme = await detectTerminalTheme()
      if (oscTheme) {
        setOscDetectedTheme(oscTheme)
      }
    } catch {
      // Silently ignore
    }
  }

  const {
    initialPrompt,
    agent,
    clearLogs,
    continue: continueChat,
    continueId,
    cwd,
    initialMode,
  } = parseArgs()

  await initializeApp({ cwd })

  const projectRoot = getProjectRoot()
  const homeDir = os.homedir()
  const startCwd = process.cwd()
  const showProjectPicker = shouldShowProjectPicker(startCwd, homeDir)

  await initializeAgentRegistry()
  await initializeSkillRegistry()

  if (clearLogs) {
    clearLogFile()
  }

  // Check if Ollama is running and has the required model
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error(`Ollama returned error: ${response.statusText}`);
    }
    const data = await response.json() as { models: any[] };
    const hasModel = data.models.some((m: any) => m.name === 'deepseek-coder' || m.name === 'deepseek-coder:latest');
    if (!hasModel) {
      console.error('\x1b[31mError: Model "deepseek-coder" not found in Ollama.\x1b[0m');
      console.error('Please run: \x1b[32mollama pull deepseek-coder\x1b[0m');
      process.exit(1);
    }
  } catch (error) {
    console.error('\x1b[31mError: Ollama is not running.\x1b[0m');
    console.error('Please start Ollama with: \x1b[32mollama serve\x1b[0m');
    process.exit(1);
  }

  const queryClient = createQueryClient()

  const AppWithAsyncAuth = () => {
    const [requireAuth, setRequireAuth] = React.useState<boolean | null>(false)
    const [hasInvalidCredentials, setHasInvalidCredentials] =
      React.useState(false)
    const [fileTree, setFileTree] = React.useState<FileTreeNode[]>([])
    const [currentProjectRoot, setCurrentProjectRoot] =
      React.useState(projectRoot)
    const [showProjectPickerScreen, setShowProjectPickerScreen] =
      React.useState(showProjectPicker)

    const loadFileTree = React.useCallback(async (root: string) => {
      try {
        if (root) {
          const tree = await getProjectFileTree({
            projectRoot: root,
            fs: fs.promises,
          })
          setFileTree(tree)
        }
      } catch (error) {
        // Silently fail
      }
    }, [])

    React.useEffect(() => {
      loadFileTree(currentProjectRoot)
    }, [currentProjectRoot, loadFileTree])

    const handleProjectChange = React.useCallback(
      async (newProjectPath: string) => {
        process.chdir(newProjectPath)
        setProjectRoot(newProjectPath)
        resetCodebuffClient()
        saveRecentProject(newProjectPath)
        setCurrentProjectRoot(newProjectPath)
        setFileTree([])
        setShowProjectPickerScreen(false)
      },
      [],
    )

    return (
      <App
        initialPrompt={initialPrompt}
        agentId={agent}
        requireAuth={requireAuth}
        hasInvalidCredentials={hasInvalidCredentials}
        fileTree={fileTree}
        continueChat={continueChat}
        continueChatId={continueId ?? undefined}
        initialMode={initialMode}
        showProjectPicker={showProjectPickerScreen}
        onProjectChange={handleProjectChange}
      />
    )
  }

  const renderer = await createCliRenderer({
    backgroundColor: 'transparent',
    exitOnCtrlC: false,
  })
  installProcessCleanupHandlers(renderer)
  createRoot(renderer).render(
    <QueryClientProvider client={queryClient}>
      <AppWithAsyncAuth />
    </QueryClientProvider>,
  )
}

void main()