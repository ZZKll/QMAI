import { describe, expect, it } from "vitest"
import { allChangelog, currentVersionChangelog } from "./changelog"

describe("changelog", () => {
  it("shows the 2.2.9 release before earlier visible releases", () => {
    const entries = allChangelog()
    const versions = entries.map((entry) => entry.version)

    expect(versions[0]).toBe("2.2.9")
    expect(versions[1]).toBe("2.2.8")
    expect(versions[2]).toBe("2.2.7")
    expect(versions[3]).toBe("2.2.0")
    expect(versions[4]).toBe("2.1.0")
    expect(versions[5]).toBe("2.0.0")

    for (let patch = 1; patch <= 6; patch += 1) {
      expect(versions).not.toContain(`2.2.${patch}`)
      expect(currentVersionChangelog(`2.2.${patch}`)).toEqual([])
    }
    for (let patch = 1; patch <= 10; patch += 1) {
      expect(versions).not.toContain(`2.1.${patch}`)
      expect(currentVersionChangelog(`2.1.${patch}`)).toEqual([])
    }
    for (let patch = 1; patch <= 12; patch += 1) {
      expect(versions).not.toContain(`2.0.${patch}`)
      expect(currentVersionChangelog(`2.0.${patch}`)).toEqual([])
    }

    expect(versions).toContain("1.0.7")
    for (let patch = 8; patch <= 32; patch += 1) {
      expect(versions).not.toContain(`1.0.${patch}`)
    }

    const release = currentVersionChangelog("2.0.0")[0]
    expect(release.highlights.en.join("\n")).toContain("Major release")
    expect(release.highlights.en.join("\n")).toContain("Review Center")
    expect(release.highlights.en.join("\n")).toContain("AI Rewrite")
  })

  it("returns the 2.2.0 changelog entry", () => {
    const release = currentVersionChangelog("2.2.0")[0]
    const zh = release.highlights.zh.join("\n")
    const en = release.highlights.en.join("\n")

    expect(release.version).toBe("2.2.0")
    expect(en).toContain("Continue Next Chapter")
    expect(en).toContain("target chapter number")
    expect(en).toContain("Character Soul")
    expect(en).toContain("2,200-3,200")
    expect(en).toContain("network errors")
    expect(zh).not.toContain("联系方式")
  })

  it("returns the 2.2.7 changelog entry for the hidden dismantling library and resume recovery", () => {
    const release = currentVersionChangelog("2.2.7")[0]
    const zh = release.highlights.zh.join("\n")
    const en = release.highlights.en.join("\n")

    expect(release.version).toBe("2.2.7")
    expect(en).toContain("Hidden the Dismantling Library UI")
    expect(en).toContain("Removed the 2.2.6 to 2.2.1 release notes")
    expect(en).toContain("saved stage checkpoint")
    expect(en).toContain("Switching models")
    expect(en).toContain("newly inserted paragraph")
    expect(zh).toContain("拆文库做隐藏处理")
    expect(zh).toContain("删除软件内 2.2.6 到 2.2.1 的更新日志展示")
    expect(zh).toContain("阶段快照")
    expect(zh).toContain("第一次中断时的原始阶段链")
    expect(zh).toContain("切换了模型")
  })
  it("returns the 2.2.8 changelog entry for accepted PR sync without reduced review retrieval", () => {
    const release = currentVersionChangelog("2.2.8")[0]
    const zh = release.highlights.zh.join("\n")
    const en = release.highlights.en.join("\n")

    expect(release.version).toBe("2.2.8")
    expect(en).toContain("review-context retrieval complete")
    expect(en).toContain("vector search, graph search, and reranking")
    expect(en).toContain("selected chapter file names")
    expect(en).toContain("different projects no longer share retrieval graphs")
    expect(zh).toContain("保留完整审稿上下文检索")
    expect(zh).toContain("向量检索、图谱检索和重排序")
    expect(zh).toContain("避免旧 frontmatter 章节号")
    expect(zh).toContain("不同项目即使 dataVersion 相同")
  })

  it("returns the 2.2.9 changelog entry for deep chapter length control", () => {
    const release = currentVersionChangelog("2.2.9")[0]
    const zh = release.highlights.zh.join("\n")
    const en = release.highlights.en.join("\n")

    expect(release.version).toBe("2.2.9")
    expect(en).toContain("3,500-character cap")
    expect(en).toContain("6,000 characters")
    expect(zh).toContain("正文草稿最多 3500 字")
    expect(zh).toContain("上限调整为 6000 字")
    expect(zh).toContain("避免流程反复中断")
  })
})
