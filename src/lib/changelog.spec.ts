import { describe, expect, it } from "vitest"
import { allChangelog, currentVersionChangelog } from "./changelog"

describe("changelog", () => {
  it("shows the latest CI fix release before the consolidated 2.0.0 release", () => {
    const entries = allChangelog()
    const versions = entries.map((entry) => entry.version)

    expect(versions[0]).toBe("2.0.1")
    expect(versions[1]).toBe("2.0.0")
    expect(versions).toContain("1.0.7")
    for (let patch = 8; patch <= 32; patch += 1) {
      expect(versions).not.toContain(`1.0.${patch}`)
    }

    const ciRelease = currentVersionChangelog("2.0.1")[0]
    expect(ciRelease.highlights.en.join("\n")).toContain("GitHub Actions CI")
    expect(ciRelease.highlights.en.join("\n")).toContain("PDFium")

    const release = currentVersionChangelog("2.0.0")[0]
    expect(release.highlights.en.join("\n")).toContain("Major release")
    expect(release.highlights.en.join("\n")).toContain("Review Center")
    expect(release.highlights.en.join("\n")).toContain("AI Rewrite")
  })
})
