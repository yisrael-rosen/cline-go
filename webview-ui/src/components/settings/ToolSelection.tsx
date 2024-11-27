import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { memo, useEffect } from "react";
import { useExtensionState } from "../../context/ExtensionStateContext";
import { ToolUseName } from "../../types/extension";

const AVAILABLE_TOOLS: Array<{id: ToolUseName; name: string; description: string}> = [
  {
    id: "execute_command",
    name: "Execute Command",
    description: "Run CLI commands on your system"
  },
  {
    id: "search_files",
    name: "Search Files",
    description: "Search across files using regex patterns"
  },
  {
    id: "list_files",
    name: "List Files",
    description: "List directory contents"
  },
  {
    id: "list_code_definition_names",
    name: "List Code Definitions",
    description: "Get overview of code structure"
  },
  {
    id: "find_references",
    name: "Find References",
    description: "Find all references to code symbols"
  },
  {
    id: "browser_action",
    name: "Browser Control",
    description: "Interact with web pages"
  },
  {
    id: "get_code_symbols",
    name: "Get Code Symbols",
    description: "Analyze code structure"
  },
  {
    id: "edit_code_symbols",
    name: "Edit Code Symbols",
    description: "Make precise code changes"
  },
  {
    id: "edit_go_symbols",
    name: "Edit Go Symbols",
    description: "Make precise changes to Go code"
  },
  {
    id: "get_go_symbols",
    name: "Get Go Symbols",
    description: "Analyze Go code structure"
  },
  {
    id: "read_file",
    name: "Read File",
    description: "Read file contents"
  },
  {
    id: "write_to_file",
    name: "Write to File",
    description: "Create or modify files"
  },
  {
    id: "ask_followup_question",
    name: "Ask Questions",
    description: "Request additional information from user"
  },
  {
    id: "attempt_completion",
    name: "Complete Task",
    description: "Present task results"
  }
] as const;

const ToolSelection = () => {
  const { enabledTools = [], setEnabledTools } = useExtensionState();

  // Enable all tools by default when component mounts and no tools are enabled
  useEffect(() => {
    if (enabledTools.length === 0) {
      const allTools = AVAILABLE_TOOLS.map(tool => tool.id);
      setEnabledTools(allTools);
    }
  }, [enabledTools.length, setEnabledTools]);

  const handleToolToggle = (toolId: ToolUseName, enabled: boolean) => {
    if (enabled) {
      setEnabledTools([...enabledTools, toolId]);
    } else {
      setEnabledTools(enabledTools.filter(id => id !== toolId));
    }
  };

  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ fontWeight: "500", marginBottom: "8px" }}>Enabled Tools</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {AVAILABLE_TOOLS.map(tool => (
          <div key={tool.id}>
            <VSCodeCheckbox
              checked={enabledTools.includes(tool.id)}
              onChange={(e: any) => handleToolToggle(tool.id, e.target.checked)}
            >
              <span style={{ fontWeight: "500" }}>{tool.name}</span>
            </VSCodeCheckbox>
            <p
              style={{
                fontSize: "12px",
                marginTop: "2px",
                marginLeft: "20px",
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              {tool.description}
            </p>
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: "12px",
          marginTop: "5px",
          color: "var(--vscode-descriptionForeground)",
        }}
      >
        Select which tools Cline can use. Unchecked tools will be excluded from the system prompt.
      </p>
    </div>
  );
};

export default memo(ToolSelection);
