import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { memo, useEffect } from "react";
import { useExtensionState } from "../../context/ExtensionStateContext";
import { ToolUseName, AVAILABLE_TOOLS } from "../../types/extension";

export const ToolSelection = () => {
  const { enabledTools = [], setEnabledTools } = useExtensionState();

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