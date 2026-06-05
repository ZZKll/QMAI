import { describe, expect, it } from "vitest"
import {
  appendContinueUnfinishedDeepChapterContext,
  buildContinueUnfinishedDeepChapterPrompt,
  canContinueUnfinishedDeepChapter,
  extractContinueUnfinishedDeepChapterContext,
  stripContinueUnfinishedDeepChapterContext,
} from "./chat-resume"

describe("chat deep chapter resume", () => {
  it("only allows continuation for failed deep chapter messages with thinking content", () => {
    expect(canContinueUnfinishedDeepChapter("<think>阶段1</think>\n\n出错：深度生成章节失败：无法连接")).toBe(true)
    expect(canContinueUnfinishedDeepChapter("<think>## 继续未完成\n已经继续了一段</think>\n\n出错：继续未完成失败：error sending request")).toBe(true)
    expect(canContinueUnfinishedDeepChapter("出错：深度生成章节失败：无法连接")).toBe(false)
    expect(canContinueUnfinishedDeepChapter("<think>阶段1</think>\n\n普通回答")).toBe(false)
  })

  it("builds a continuation prompt that reuses previous thinking without restarting all stages", () => {
    const prompt = buildContinueUnfinishedDeepChapterPrompt({
      originalRequest: "生成第7章内容",
      failedAssistantContent: "<think>\n## 阶段1：上下文分析\n## 阶段6：简单审查\n</think>\n\n出错：深度生成章节失败：error sending request",
    })

    expect(prompt).toContain("生成第7章内容")
    expect(prompt).toContain("阶段6：简单审查")
    expect(prompt).toContain("不要从头重复生成这些阶段")
    expect(prompt).toContain("从最后未完成的位置继续")
    expect(prompt).toContain("节省 token")
  })

  it("persists the original deep request in a hidden resume context", () => {
    const visible = "<think>阶段1：上下文分析</think>\n\n出错：深度生成章节失败：HTTP 429"
    const withContext = appendContinueUnfinishedDeepChapterContext(visible, {
      originalRequest: "生成第3章，主角进入旧城",
      resumeContext: "阶段1：上下文分析\n阶段2：任务书\n目标：生成第3章",
    })

    expect(withContext).toContain(visible)
    expect(stripContinueUnfinishedDeepChapterContext(withContext)).toBe(visible)

    const parsed = extractContinueUnfinishedDeepChapterContext(withContext)
    expect(parsed?.originalRequest).toBe("生成第3章，主角进入旧城")
    expect(parsed?.resumeContext).toContain("阶段2：任务书")
  })

  it("uses the persisted original request instead of the visible continue command", () => {
    const prompt = buildContinueUnfinishedDeepChapterPrompt({
      originalRequest: "继续未完成",
      failedAssistantContent: "<think>## 继续未完成\n只有很短的二次失败思考</think>\n\n出错：继续未完成失败：HTTP 429",
      resumeContext: "原始阶段1：上下文分析\n原始阶段2：任务书\n章节目标：生成第3章，主角进入旧城",
      persistedOriginalRequest: "生成第3章，主角进入旧城",
    })

    expect(prompt).toContain("生成第3章，主角进入旧城")
    expect(prompt).toContain("原始阶段2：任务书")
    expect(prompt).not.toContain("原始用户请求：\n继续未完成")
  })
})
