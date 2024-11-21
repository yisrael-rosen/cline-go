const fs = require('fs');
const path = require('path');

// Read the original file
const filePath = path.join('src', 'core', 'Cline.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix TypeScript errors
content = content.replace(
    /const firstChunk = await iterator\.next\(\)\s+yield firstChunk\.value/g,
    'const firstChunk = await iterator.next()\nif (firstChunk.value) {\n\tyield firstChunk.value\n} else {\n\tthrow new Error("No value in first chunk")\n}'
);

content = content.replace(
    /inputTokens \+= chunk\.inputTokens/g,
    'inputTokens += chunk.inputTokens ?? 0'
);

content = content.replace(
    /outputTokens \+= chunk\.outputTokens/g,
    'outputTokens += chunk.outputTokens ?? 0'
);

// Remove model-specific references
content = content.replace(
    /\/\/ pre-processing newContent for cases where weaker models might add artifacts like markdown codeblock markers \(deepseek\/llama\) or extra escape characters \(gemini\)/g,
    '// Pre-process content to handle any markdown or HTML artifacts'
);

content = content.replace(
    /if \(!this\.api\.getModel\(\)\.id\.includes\("claude"\)\) \{\s*\/\/ it seems not just llama models are doing this, but also gemini and potentially others/g,
    'if ( // Handle any HTML entity escaping'
);

content = content.replace(
    /\/\/ only need to gracefully abort if this instance isn't abandoned \(sometimes openrouter stream hangs, in which case this would affect future instances of cline\)/g,
    '// Only need to gracefully abort if this instance isn\'t abandoned'
);

content = content.replace(
    /\/\/ PREV: we need to let the request finish for openrouter to get generation details\s*\/\/ UPDATE: it's better UX to interrupt the request at the cost of the api cost not being retrieved/g,
    '// Interrupt the request for better UX'
);

content = content.replace(
    /this\.api\.getModel\(\)\.id\.includes\("claude"\)\s*\?\s*`[^`]+`\s*:\s*"[^"]+"/g,
    '`This may indicate a failure in the thought process or inability to use a tool properly, which can be mitigated with some user guidance (e.g. "Try breaking down the task into smaller steps").`'
);

// Write the updated content back to the file
fs.writeFileSync(filePath, content);
