export interface ChangelogEntry {
  version: string
  date: string
  highlights: {
    en: string[]
    zh: string[]
  }
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-06-01",
    highlights: {
      en: [
        "Fixed the bug where AI generation could still pull stale memory after outline, graph, or snapshot updates.",
        "Snapshot sync now records revision metadata, archives superseded memory, and keeps current memory projections separate from history.",
        "Rollback now rebuilds the active entity, structured memory, cognition, character-state, and foreshadowing layers so restored memory becomes the default source again.",
      ],
      zh: [
        "修复大纲、图谱或快照更新后，AI 生成内容仍可能读取旧记忆数据的问题。",
        "同步记忆时新增快照版本元数据，并将历史归档与当前有效记忆投影分开管理。",
        "回滚历史快照时会同步重建当前实体页、结构化记忆、角色认知、人物状态与伏笔追踪，使恢复后的记忆重新成为默认读取来源。",
      ],
    },
  },
  {
    version: "0.4.20",
    date: "2026-06-01",
    highlights: {
      en: [
        "AI会话：删除「保存为正式章节」和「废弃草稿」按钮，保留「保存到章节库」（保存为草稿并自动跳转到正文编辑）。",
        "AI大纲：增加复制、重新生成按钮，增加引用资料展示。",
      ],
      zh: [
        "AI会话：删除「保存为正式章节」和「废弃草稿」按钮，保留「保存到章节库」（保存为草稿并自动跳转到正文编辑）。",
        "AI大纲：增加复制、重新生成按钮，增加引用资料展示。",
      ],
    },
  },
  {
    version: "0.4.19",
    date: "2026-05-31",
    highlights: {
      en: [
        "AI生成时允许向上滚动查看已生成内容（不再强制锁定到底部）。",
        "保存到章节库改为创建草稿章节，不再触发审查和记忆摄取。",
        "大纲库增加AI大纲按钮，底部对话面板可基于大纲+章节内容进行AI对话，生成结果可保存为新大纲文件。",
      ],
      zh: [
        "AI生成时允许向上滚动查看已生成内容（不再强制锁定到底部）。",
        "保存到章节库改为创建草稿章节，不再触发审查和记忆摄取。",
        "大纲库增加AI大纲按钮，底部对话面板可基于大纲+章节内容进行AI对话，生成结果可保存为新大纲文件。",
      ],
    },
  },
  {
    version: "0.4.16",
    date: "2026-05-31",
    highlights: {
      en: [
        "修复人物小传快照标题显示为「第-312章」的问题，现在正确显示大纲名称。",
        "修复「打开大纲」按钮点击后不跳转到大纲页面的问题。",
        "「切换项目」改为「切换小说」。",
        "检查更新增加下载进度条和「立即安装」按钮。",
      ],
      zh: [
        "修复人物小传快照标题显示为「第-312章」的问题，现在正确显示大纲名称。",
        "修复「打开大纲」按钮点击后不跳转到大纲页面的问题。",
        "「切换项目」改为「切换小说」。",
        "检查更新增加下载进度条和「立即安装」按钮。",
      ],
    },
  },
  {
    version: "0.4.15",
    date: "2026-05-31",
    highlights: {
      en: [
        "左下角状态指示器改为模型连接检测（绿色=连接正常，红色=连接失败）。",
        "删除网络设置中的网页剪藏端口配置。",
        "修复模型连接检测URL构建错误导致始终显示红色的问题。",
      ],
      zh: [
        "左下角状态指示器改为模型连接检测（绿色=连接正常，红色=连接失败）。",
        "删除网络设置中的网页剪藏端口配置。",
        "修复模型连接检测URL构建错误导致始终显示红色的问题。",
      ],
    },
  },
  {
    version: "0.4.13",
    date: "2026-05-31",
    highlights: {
      en: [
        "大纲模块增加\u201c查看快照\u201d功能，提取初始记忆后可直接查看和编辑快照内容。",
        "修复\u201c提取初始记忆\u201d按钮状态无法保持的问题，切换页面后返回仍显示已提取状态。",
        "设置页面更新日志增加完整版本历史和\u201c检查更新\u201d功能。",
      ],
      zh: [
        "大纲模块增加\u201c查看快照\u201d功能，提取初始记忆后可直接查看和编辑快照内容。",
        "修复\u201c提取初始记忆\u201d按钮状态无法保持的问题，切换页面后返回仍显示已提取状态。",
        "设置页面更新日志增加完整版本历史和\u201c检查更新\u201d功能。",
      ],
    },
  },
  {
    version: "0.4.12",
    date: "2026-05-31",
    highlights: {
      en: [
        "修复大纲提取初始记忆在记忆中心显示\u201c第0章\u201d的问题，现在正确显示大纲名称。",
        "修复人物小传提取初始记忆后无法在记忆中心显示的问题（之前会被总大纲覆盖）。",
      ],
      zh: [
        "修复大纲提取初始记忆在记忆中心显示\u201c第0章\u201d的问题，现在正确显示大纲名称。",
        "修复人物小传提取初始记忆后无法在记忆中心显示的问题（之前会被总大纲覆盖）。",
      ],
    },
  },
  {
    version: "0.4.11",
    date: "2026-05-31",
    highlights: {
      en: [
        "新增用户统计功能（下载人数 + 在线人数），基于 Cloudflare Workers + D1 零成本方案。",
      ],
      zh: [
        "新增用户统计功能（下载人数 + 在线人数），基于 Cloudflare Workers + D1 零成本方案。",
      ],
    },
  },
  {
    version: "0.4.10",
    date: "2026-05-20",
    highlights: {
      en: [
        "更新为小说写作助手定位，围绕长篇小说创作整理章节、大纲、人物状态、伏笔、时间线和图谱能力。",
        "强化写作上下文、章节记忆、审稿检查与长篇连续性相关功能，减少长篇创作中的遗忘和设定冲突。",
      ],
      zh: [
        "更新为小说写作助手定位，围绕长篇小说创作整理章节、大纲、人物状态、伏笔、时间线和图谱能力。",
        "强化写作上下文、章节记忆、审稿检查与长篇连续性相关功能，减少长篇创作中的遗忘和设定冲突。",
      ],
    },
  },
]

export function currentVersionChangelog(version: string): ChangelogEntry[] {
  return CHANGELOG.filter((entry) => entry.version === version)
}

export function allChangelog(): ChangelogEntry[] {
  return CHANGELOG
}
