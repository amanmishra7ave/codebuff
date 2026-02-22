import os
import re

files = [
    "agents/base2/base2-max.ts",
    "agents/base2/base2-evals.ts",
    "agents/base2/base2-free.ts",
    "agents/base2/base2-max-evals.ts",
    "agents/base2/base2-fast.ts",
    "agents/base2/base2-fast-no-validation.ts",
    "agents/base2/base2.ts",
    "agents/base2/base2-plan.ts",
    "agents/file-explorer/file-lister.ts",
    "agents/file-explorer/directory-lister.ts",
    "agents/file-explorer/glob-matcher.ts",
    "agents/file-explorer/file-picker.ts",
    "agents/file-explorer/code-searcher.ts",
    "agents/file-explorer/file-picker-max.ts",
    "agents/editor/best-of-n/editor-implementor-gpt-5.ts",
    "agents/editor/best-of-n/editor-implementor.ts",
    "agents/editor/best-of-n/editor-implementor-opus.ts",
    "agents/editor/best-of-n/editor-multi-prompt.ts",
    "agents/editor/best-of-n/best-of-n-selector2.ts",
    "agents/editor/editor-gpt-5.ts",
    "agents/editor/editor.ts",
    "agents/editor/editor-glm.ts",
    "agents/general-agent/general-agent.ts",
    "agents/general-agent/gpt-5-agent.ts",
    "agents/general-agent/opus-agent.ts",
    "agents/researcher/researcher-web.ts",
    "agents/researcher/researcher-docs.ts",
    "agents/commander.ts",
    "agents/commander-lite.ts",
    "agents/reviewer/multi-prompt/code-reviewer-multi-prompt.ts",
    "agents/reviewer/code-reviewer.ts",
    "agents/thinker/best-of-n/thinker-best-of-n-opus.ts",
    "agents/thinker/best-of-n/thinker-selector.ts",
    "agents/thinker/best-of-n/thinker-best-of-n.ts",
    "agents/thinker/best-of-n/thinker-selector-opus.ts",
    "agents/thinker/thinker.ts",
    "agents/context-pruner.ts",
]

for file_path in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Remove publisher import
    content = re.sub(r"import\s+\{\s*publisher\s*\}\s+from\s+['\"].*?['\"]\n?", "", content)
    
    # Replace publisher: ... with nothing (handle comma)
    content = re.sub(r"publisher,\n?", "", content)
    content = re.sub(r"publisher:\s*publisher,\n?", "", content)
    content = re.sub(r"publisher:\s*['\"].*?['\"],\n?", "", content)
    
    # Replace model: ... with model: 'deepseek-coder'
    content = re.sub(r"model:\s*['\"].*?['\"]", "model: 'deepseek-coder'", content)
    
    # Remove reasoningOptions
    content = re.sub(r"reasoningOptions:\s*\{.*?\},\n?", "", content, flags=re.DOTALL)
    
    # Save back
    with open(file_path, 'w') as f:
        f.write(content)

print("Done processing agent files.")
