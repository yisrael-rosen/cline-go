import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { memo } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { anthropicModels } from "../../../../src/shared/api"
import { ClineMessage } from "../../../../src/shared/ExtensionMessage"

interface TaskHeaderProps {
    task: ClineMessage;
    tokensIn: number;
    tokensOut: number;
    doesModelSupportPromptCache: boolean;
    cacheWrites?: number;
    cacheReads?: number;
    totalCost: number;
    onClose: () => void;
}

const TaskHeader = ({
    task,
    tokensIn,
    tokensOut,
    doesModelSupportPromptCache,
    cacheWrites = 0,
    cacheReads = 0,
    totalCost,
    onClose,
}: TaskHeaderProps) => {
	const { apiConfiguration } = useExtensionState()

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 5,
				padding: "10px 20px",
				borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
			}}>
			<div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "space-between" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 5 }}>
					<VSCodeButton
						appearance="icon"
						onClick={onClose}
						style={{ padding: 5 }}>
						<span className="codicon codicon-close"></span>
					</VSCodeButton>
					<VSCodeButton
						appearance="icon"
						onClick={() => vscode.postMessage({ type: "exportCurrentTask" })}
						style={{ padding: 5 }}>
						<span className="codicon codicon-export"></span>
					</VSCodeButton>
				</div>
				<div style={{ 
					display: "flex", 
					gap: 15, 
					fontSize: "12px",
					color: "var(--vscode-descriptionForeground)"
				}}>
					<div>
						<span style={{ fontWeight: 500 }}>Input Tokens:</span> {tokensIn.toLocaleString()}
					</div>
					<div>
						<span style={{ fontWeight: 500 }}>Output Tokens:</span> {tokensOut.toLocaleString()}
					</div>
					<div>
						<span style={{ fontWeight: 500 }}>Total Tokens:</span> {(tokensIn + tokensOut).toLocaleString()}
					</div>
					<div>
						<span style={{ fontWeight: 500 }}>Cache Reads:</span> {cacheReads.toLocaleString()}
					</div>
					<div>
						<span style={{ fontWeight: 500 }}>Cache Writes:</span> {cacheWrites.toLocaleString()}
					</div>
					<div>
						<span style={{ fontWeight: 500 }}>Cost:</span> ${totalCost.toFixed(4)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default memo(TaskHeader)
