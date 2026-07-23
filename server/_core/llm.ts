import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

/**
 * Task complexity hint for cost-optimized routing.
 * - 'high'  → forces Forge (gemini-2.5-flash) regardless of other params
 * - omitted → auto-route: Qwen2.5 7B (free) unless JSON schema or tools needed
 */
export type TaskComplexity = "high" | "medium" | "low";

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  /** Optional explicit model override (uses Forge endpoint) */
  model?: string;
  /** Complexity hint: 'high' forces Forge; omit/low/medium defaults to Qwen */
  complexity?: TaskComplexity;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () => {
  if (!ENV.forgeApiUrl || ENV.forgeApiUrl.trim().length === 0) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured. Set it to an OpenAI-compatible endpoint (e.g. https://api.openai.com).");
  }
  return `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY (LLM API key) is not configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// In-memory LRU cache for LLM responses (no Redis dependency required)
// Key: SHA-256 of serialized payload, Value: { result, expiresAt }
const _llmCache = new Map<string, { result: InvokeResult; expiresAt: number }>();
const LLM_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LLM_CACHE_MAX_SIZE = 500; // max entries

// Params that are safe to cache (no tools, no streaming, deterministic)
function isCacheable(params: InvokeParams): boolean {
  if (params.tools && params.tools.length > 0) return false;
  return true;
}

function getLLMCacheKey(payload: Record<string, unknown>): string {
  // Use a simple hash function that works in ESM context
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ── Qwen / Ollama health check ──────────────────────────────────────────────
// Cached health state to avoid pinging Ollama on every request.
// Re-checks every 30s. Falls back to Forge automatically when Ollama is down.
let _ollamaHealthy: boolean | null = null;
let _ollamaLastCheck = 0;
const OLLAMA_HEALTH_TTL_MS = 30_000;

async function checkOllamaHealth(): Promise<boolean> {
  const now = Date.now();
  if (_ollamaHealthy !== null && now - _ollamaLastCheck < OLLAMA_HEALTH_TTL_MS) {
    return _ollamaHealthy;
  }
  try {
    const baseUrl = ENV.ollamaApiUrl.replace(/\/v1$/, "");
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000), // 2s timeout — fast fail
    });
    _ollamaHealthy = res.ok;
  } catch {
    _ollamaHealthy = false;
  }
  _ollamaLastCheck = now;
  if (!_ollamaHealthy) {
    console.warn("[LLM] Ollama unreachable — falling back to Forge (Gemini)");
  }
  return _ollamaHealthy;
}

/**
 * Resolve which LLM provider/endpoint to use.
 *
 * Routing priority (Qwen-first to maximize free usage):
 * 1. Explicit model override → Forge (Gemini 2.5 Flash)
 * 2. JSON schema response_format → Forge (Ollama doesn't support json_schema)
 * 3. Tool/function calling → Forge
 * 4. complexity='high' → Forge
 * 5. Ollama health check fails → Forge (auto-fallback)
 * 6. Everything else → Qwen2.5 7B on Cloud Computer (FREE, simple queries only)
 */
async function resolveProvider(params: InvokeParams): Promise<{ apiUrl: string; apiKey: string; model: string }> {
  const hasJsonSchema = !!(params.responseFormat?.type === "json_schema" ||
    params.response_format?.type === "json_schema" ||
    params.outputSchema || params.output_schema);
  const hasTools = !!(params.tools && params.tools.length > 0);
  const forceForge = params.complexity === "high" || !!params.model;

  if (!forceForge && !hasJsonSchema && !hasTools) {
    // Only ping Ollama when we'd actually use it (simple text completions)
    const ollamaUp = await checkOllamaHealth();
    if (ollamaUp) {
      return {
        apiUrl: `${ENV.ollamaApiUrl}/chat/completions`,
        apiKey: "ollama",
        model: ENV.ollamaModel,
      };
    }
    // Ollama is down — fall through to Forge
  }

  // Primary fallback: Forge (Gemini 2.5 Flash) — handles JSON schema, tools, complex tasks
  // Forge is free via the platform and much faster than Ollama on CPU for complex prompts
  const model = params.model ?? "gemini-2.5-flash";
  return { apiUrl: resolveApiUrl(), apiKey: ENV.forgeApiKey, model };
}

/**
 * Get the current LLM provider status for the UI status badge.
 * Returns which provider is active and health state.
 */
export function getLlmStatus(): { provider: "qwen" | "gpt-4o-mini" | "gemini"; healthy: boolean; lastCheck: number } {
  if (_ollamaHealthy === true) {
    return { provider: "qwen", healthy: true, lastCheck: _ollamaLastCheck };
  }
  // Forge (Gemini 2.5 Flash) is the primary fallback for JSON schema / complex tasks
  return { provider: "gemini", healthy: true, lastCheck: _ollamaLastCheck };
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const { apiUrl, apiKey, model } = await resolveProvider(params);
  const isOllama = apiKey === "ollama";

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Non-Ollama params (max_tokens for GPT-4o-mini and Forge)
  if (!isOllama) {
    payload.max_tokens = 16384;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  // Check in-memory cache for deterministic calls (no tools)
  const cacheable = isCacheable(params);
  if (cacheable) {
    const cacheKey = getLLMCacheKey(payload);
    const cached = _llmCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    // Evict oldest entry if cache is full
    if (_llmCache.size >= LLM_CACHE_MAX_SIZE) {
      const firstKey = _llmCache.keys().next().value;
      if (firstKey) _llmCache.delete(firstKey);
    }
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const status = response.status;
    const errorText = await response.text();
    // Failover to OpenRouter (gpt-4o-mini) on quota / rate-limit errors from Forge
    const isQuotaError = status === 429 || status === 402 || status === 503 ||
      errorText.toLowerCase().includes("quota") ||
      errorText.toLowerCase().includes("token") ||
      errorText.toLowerCase().includes("rate limit");
    if (isQuotaError && apiKey !== "openrouter" && ENV.openRouterApiKey) {
      console.warn(`[LLM] Forge quota/rate-limit (${status}) — failing over to OpenRouter gpt-4o-mini`);
      const orPayload = { ...payload, model: ENV.openRouterModel };
      const orResponse = await fetch(ENV.openRouterApiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.openRouterApiKey}`,
          "HTTP-Referer": "https://chalkpicks.live",
          "X-Title": "ChalkPicks",
        },
        body: JSON.stringify(orPayload),
      });
      if (!orResponse.ok) {
        const orError = await orResponse.text();
        throw new Error(`LLM failover also failed: ${orResponse.status} – ${orError}`);
      }
      const orResult = (await orResponse.json()) as InvokeResult;
      return orResult;
    }
    throw new Error(
      `LLM invoke failed: ${status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as InvokeResult;

  // Store in cache if cacheable
  if (cacheable) {
    const cacheKey = getLLMCacheKey(payload);
    _llmCache.set(cacheKey, { result, expiresAt: Date.now() + LLM_CACHE_TTL_MS });
  }

  return result;
}
