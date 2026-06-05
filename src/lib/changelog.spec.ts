import { describe, expect, it } from "vitest"
import { allChangelog, currentVersionChangelog } from "./changelog"

describe("changelog", () => {
  it("shows the 2.1.10 patch before earlier 2.1 patches and the consolidated 2.1.0 release", () => {
    const entries = allChangelog()
    const versions = entries.map((entry) => entry.version)

    expect(versions[0]).toBe("2.1.10")
    expect(versions[1]).toBe("2.1.9")
    expect(versions[2]).toBe("2.1.8")
    expect(versions[3]).toBe("2.1.7")
    expect(versions[4]).toBe("2.1.6")
    expect(versions[5]).toBe("2.1.5")
    expect(versions[6]).toBe("2.1.4")
    expect(versions[7]).toBe("2.1.3")
    expect(versions[8]).toBe("2.1.2")
    expect(versions[9]).toBe("2.1.1")
    expect(versions[10]).toBe("2.1.0")
    expect(versions[11]).toBe("2.0.0")
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

  it("returns the 2.1.10 changelog entry for the current version", () => {
    const release = currentVersionChangelog("2.1.10")[0]
    const zh = release.highlights.zh.join("\n")
    const en = release.highlights.en.join("\n")

    expect(release.version).toBe("2.1.10")
    expect(en).toContain("Continue Next Chapter")
    expect(en).toContain("target chapter number")
    expect(zh).toContain("继续生成下一章")
    expect(zh).toContain("目标章节号")
    expect(zh).toContain("时间线定位")
    expect(zh).not.toContain("联系方式")
  })
})
