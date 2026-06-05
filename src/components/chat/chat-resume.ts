const DEEP_CHAPTER_FAILURE_RE = /深度生成章节失败|继续未完成失败|deep chapter generation failed|continue unfinished failed/i
const THINK_BLOCK_RE = /<think(?:ing)?>[\s\S]*?(?:<\/think(?:ing)?>|$)/i
const MAX_RESUME_CONTEXT_CHARS = 60_000
const RESUME_CONTEXT_COMMENT_RE = /<!--\s*qmai-continue-unfinished-context:([\s\S]*?)\s*-->/g

export interface ContinueUnfinishedDeepChapterContext {
  originalRequest?: string
  resumeContext: string
}

export function canContinueUnfinishedDeepChapter(content: string): boolean {
  return DEEP_CHAPTER_FAILURE_RE.test(content) && THINK_BLOCK_RE.test(content)
}

function compactResumeContext(content: string): string {
  const trimmed = content.trim()
  if (trimmed.length <= MAX_RESUME_CONTEXT_CHARS) return trimmed

  const headLength = 12_000
  const tailLength = MAX_RESUME_CONTEXT_CHARS - headLength
  return [
    trimmed.slice(0, headLength),
    "",
    `【中间过长内容已省略 ${trimmed.length - MAX_RESUME_CONTEXT_CHARS} 字，下面保留靠近中断处的内容】`,
    "",
    trimmed.slice(-tailLength),
  ].join("\n")
}

export function stripContinueUnfinishedDeepChapterContext(content: string): string {
  return content.replace(RESUME_CONTEXT_COMMENT_RE, "").trimEnd()
}

export function appendContinueUnfinishedDeepChapterContext(
  content: string,
  context: ContinueUnfinishedDeepChapterContext,
): string {
  const payload = encodeURIComponent(JSON.stringify(context))
  return `${stripContinueUnfinishedDeepChapterContext(content)}\n<!-- qmai-continue-unfinished-context:${payload} -->`
}

export function extractContinueUnfinishedDeepChapterContext(
  content: string,
): ContinueUnfinishedDeepChapterContext | null {
  const matches = [...content.matchAll(RESUME_CONTEXT_COMMENT_RE)]
  const encoded = matches.length > 0 ? matches[matches.length - 1]?.[1]?.trim() : undefined
  if (!encoded) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(encoded)) as ContinueUnfinishedDeepChapterContext
    if (!parsed || typeof parsed.resumeContext !== "string") return null
    return {
      originalRequest: typeof parsed.originalRequest === "string" ? parsed.originalRequest : undefined,
      resumeContext: parsed.resumeContext,
    }
  } catch {
    return null
  }
}

export function buildContinueUnfinishedDeepChapterPrompt(input: {
  originalRequest?: string
  failedAssistantContent: string
  persistedOriginalRequest?: string
  resumeContext?: string
}): string {
  const originalRequest =
    input.persistedOriginalRequest?.trim() ||
    input.originalRequest?.trim() ||
    "未找到上一条用户原始请求，请根据已有思考过程继续完成本章。"
  const resumeContext = compactResumeContext(input.resumeContext ?? input.failedAssistantContent)

  return [
    "继续未完成的深度章节生成。",
    "",
    "原始用户请求：",
    originalRequest,
    "",
    "上一次已经生成出来的思考过程和阶段内容如下。请把它当作已完成上下文，不要从头重复生成这些阶段：",
    resumeContext,
    "",
    "续写要求：",
    "1. 先判断上方内容最后停在哪个阶段，从最后未完成的位置继续。",
    "2. 不要重复阶段1上下文分析、阶段2任务书等已经完成的大段内容。",
    "3. 如果上方已有正文草稿，就继续后续审查、返修、简单审查、去AI味或补全正文；如果还没有正文草稿，就从正文生成阶段继续。",
    "4. 这次重点是节省 token：不要复述已有思考，不要解释为什么继续，直接把未完成的章节内容补完整。",
    "5. 最终输出必须是可直接保存到章节库的完整章节正文；如果需要少量承接说明，请放在思考中，不要混入正文。",
  ].join("\n")
}
