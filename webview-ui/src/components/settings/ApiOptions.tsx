import {
	VSCodeCheckbox,
	VSCodeDropdown,
	VSCodeLink,
	VSCodeOption,
	VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react"
import { Fragment, memo, useMemo, useState } from "react"
import { type ApiConfiguration, type ModelInfo, anthropicModels } from "../../../../src/shared/api"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { normalizeApiConfiguration } from "../../utils/api"

interface ApiOptionsProps {
	showModelOptions: boolean
	apiErrorMessage?: string
	modelIdErrorMessage?: string
}

const ApiOptions = ({ showModelOptions, apiErrorMessage, modelIdErrorMessage }: ApiOptionsProps) => {
	const { apiConfiguration, setApiConfiguration } = useExtensionState()
	const [anthropicBaseUrlSelected, setAnthropicBaseUrlSelected] = useState(!!apiConfiguration?.anthropicBaseUrl)

	const handleInputChange = (field: keyof ApiConfiguration) => (event: any) => {
		setApiConfiguration({ ...apiConfiguration, [field]: event.target.value })
	}

	const { selectedModelId, selectedModelInfo } = useMemo(() => {
		return normalizeApiConfiguration(apiConfiguration)
	}, [apiConfiguration])

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
			<div>
				<VSCodeTextField
					value={apiConfiguration?.apiKey || ""}
					style={{ width: "100%" }}
					type="password"
					onInput={handleInputChange("apiKey")}
					placeholder="Enter API Key...">
					<span style={{ fontWeight: 500 }}>Anthropic API Key</span>
				</VSCodeTextField>

				<VSCodeCheckbox
					checked={anthropicBaseUrlSelected}
					onChange={(e: any) => {
						const isChecked = e.target.checked === true
						setAnthropicBaseUrlSelected(isChecked)
						if (!isChecked) {
							setApiConfiguration({ ...apiConfiguration, anthropicBaseUrl: "" })
						}
					}}>
					Use custom base URL
				</VSCodeCheckbox>

				{anthropicBaseUrlSelected && (
					<VSCodeTextField
						value={apiConfiguration?.anthropicBaseUrl || ""}
						style={{ width: "100%", marginTop: 3 }}
						type="url"
						onInput={handleInputChange("anthropicBaseUrl")}
						placeholder="Default: https://api.anthropic.com"
					/>
				)}

				<p
					style={{
						fontSize: "12px",
						marginTop: 3,
						color: "var(--vscode-descriptionForeground)",
					}}>
					This key is stored locally and only used to make API requests from this extension.
					{!apiConfiguration?.apiKey && (
						<VSCodeLink
							href="https://console.anthropic.com/settings/keys"
							style={{ display: "inline", fontSize: "inherit" }}>
							You can get an Anthropic API key by signing up here.
						</VSCodeLink>
					)}
				</p>
			</div>

			{apiErrorMessage && (
				<p
					style={{
						margin: "-10px 0 4px 0",
						fontSize: 12,
						color: "var(--vscode-errorForeground)",
					}}>
					{apiErrorMessage}
				</p>
			)}

			{showModelOptions && (
				<>
					<div className="dropdown-container">
						<label htmlFor="model-id">
							<span style={{ fontWeight: 500 }}>Model</span>
						</label>
						<VSCodeDropdown
							id="model-id"
							value={selectedModelId}
							onChange={handleInputChange("apiModelId")}
							style={{ width: "100%" }}>
							<VSCodeOption value="">Select a model...</VSCodeOption>
							{(Object.keys(anthropicModels) as Array<keyof typeof anthropicModels>).map((modelId) => (
								<VSCodeOption
									key={modelId}
									value={modelId}
									style={{
										whiteSpace: "normal",
										wordWrap: "break-word",
										maxWidth: "100%",
									}}>
									{modelId}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>

					<ModelInfo modelInfo={selectedModelInfo} />
				</>
			)}

			{modelIdErrorMessage && (
				<p
					style={{
						margin: "-10px 0 4px 0",
						fontSize: 12,
						color: "var(--vscode-errorForeground)",
					}}>
					{modelIdErrorMessage}
				</p>
			)}
		</div>
	)
}

const formatPrice = (price: number) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price)
}

interface ModelInfoProps {
	modelInfo: ModelInfo
}

const ModelInfo = ({ modelInfo }: ModelInfoProps) => {
	const infoItems = [
		modelInfo.description && (
			<span key="description" style={{ whiteSpace: "pre-wrap" }}>
				{modelInfo.description}
			</span>
		),
		<ModelInfoSupportsItem
			key="supportsImages"
			isSupported={modelInfo.supportsImages ?? false}
			supportsLabel="Supports images"
			doesNotSupportLabel="Does not support images"
		/>,
		<ModelInfoSupportsItem
			key="supportsComputerUse"
			isSupported={modelInfo.supportsComputerUse ?? false}
			supportsLabel="Supports computer use"
			doesNotSupportLabel="Does not support computer use"
		/>,
		<ModelInfoSupportsItem
			key="supportsPromptCache"
			isSupported={modelInfo.supportsPromptCache}
			supportsLabel="Supports prompt caching"
			doesNotSupportLabel="Does not support prompt caching"
		/>,
		modelInfo.maxTokens !== undefined && modelInfo.maxTokens > 0 && (
			<span key="maxTokens">
				<span style={{ fontWeight: 500 }}>Max output:</span> {modelInfo.maxTokens?.toLocaleString()} tokens
			</span>
		),
		modelInfo.inputPrice !== undefined && modelInfo.inputPrice > 0 && (
			<span key="inputPrice">
				<span style={{ fontWeight: 500 }}>Input price:</span> {formatPrice(modelInfo.inputPrice)}/million tokens
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheWritesPrice && (
			<span key="cacheWritesPrice">
				<span style={{ fontWeight: 500 }}>Cache writes price:</span>{" "}
				{formatPrice(modelInfo.cacheWritesPrice || 0)}/million tokens
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheReadsPrice && (
			<span key="cacheReadsPrice">
				<span style={{ fontWeight: 500 }}>Cache reads price:</span>{" "}
				{formatPrice(modelInfo.cacheReadsPrice || 0)}/million tokens
			</span>
		),
		modelInfo.outputPrice !== undefined && modelInfo.outputPrice > 0 && (
			<span key="outputPrice">
				<span style={{ fontWeight: 500 }}>Output price:</span> {formatPrice(modelInfo.outputPrice)}/million
				tokens
			</span>
		),
	].filter(Boolean)

	return (
		<p style={{ fontSize: "12px", marginTop: "2px", color: "var(--vscode-descriptionForeground)" }}>
			{infoItems.map((item, index) => (
				<Fragment key={index}>
					{item}
					{index < infoItems.length - 1 && <br />}
				</Fragment>
			))}
		</p>
	)
}

interface ModelInfoSupportsItemProps {
	isSupported: boolean
	supportsLabel: string
	doesNotSupportLabel: string
}

const ModelInfoSupportsItem = ({
	isSupported,
	supportsLabel,
	doesNotSupportLabel,
}: ModelInfoSupportsItemProps) => {
	const style = {
		fontWeight: 500,
		color: isSupported ? "var(--vscode-charts-green)" : "var(--vscode-errorForeground)",
	} as const

	const iconStyle = {
		marginRight: 4,
		marginBottom: isSupported ? 1 : -1,
		fontSize: isSupported ? 11 : 13,
		fontWeight: 700,
		display: "inline-block",
		verticalAlign: "bottom",
	} as const

	return (
		<span style={style}>
			<i className={`codicon codicon-${isSupported ? "check" : "x"}`} style={iconStyle}></i>
			{isSupported ? supportsLabel : doesNotSupportLabel}
		</span>
	)
}

export default memo(ApiOptions)
