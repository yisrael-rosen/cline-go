import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
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
    cacheWrites,
    cacheReads,
    totalCost,
    onClose,
}: TaskHeaderProps) => {
	const { apiConfiguration } = useExtensionState()

	const shouldShowPromptCacheInfo = apiConfiguration?.apiModelId
		? apiConfiguration.apiModelId in anthropicModels && anthropicModels[apiConfiguration.apiModelId as keyof typeof anthropicModels].supportsPromptCache
		: false

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 5,
				padding: "10px 20px",
				borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
			}}>
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
			{shouldShowPromptCacheInfo && (
				<p
					style={{
						fontSize: "12px",
						margin: 0,
						color: "var(--vscode-descriptionForeground)",
					}}>
					<span style={{ fontWeight: 500 }}>Note:</span> Prompt caching is enabled for this model. Cline will
					try to reuse previous responses to save on API costs.{" "}
					<VSCodeLink
						href="https://github.com/cline/cline#prompt-caching"
						style={{ display: "inline", fontSize: "inherit" }}>
						Learn more
					</VSCodeLink>
				</p>
			)}
		</div>
	)
}

export default memo(TaskHeader)
