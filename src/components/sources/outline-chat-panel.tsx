import { useState, useRef, useCallback, useEffect } from "react"
import { Send, X, Save, Copy, RefreshCw, FileText } from "lucide-react"
import { useWikiStore } from "@/stores/wiki-store"
import { normalizePath } from "@/lib/path-utils"
import { readFile, writeFile, listDirectory, createDirectory, fileExists } from "@/commands/fs"
import { streamChat, type ChatMessage } from "@/lib/llm-client"
import { hasUsableLlm } from "@/lib/has-usable-llm"
import ReactMarkdown from "react-markdown"

interface OutlineChatMessage {
  role: "user" | "assistant"
  content: string
}

async function loadOutlineContext(projectPath: string): Promise<{ context: string; sources: string[] }> {
  const pp = normalizePath(projectPath)
  const sections: string[] = []
  const sources: string[] = []

  // 读取大纲目录内容
  try {
    const outlinesDir = `${pp}/wiki/outlines`
    const tree = await listDirectory(outlinesDir)
    for (const file of tree.slice(0, 10)) {
      if (file.name.endsWith(".md")) {
        try {
          const content = await readFile(`${outlinesDir}/${file.name}`)
          const trimmed = content.length > 3000 ? content.slice(0, 3000) + "\n...(已截断)" : content
          sections.push(`【${file.name.replace(/\.md$/, "")}】\n${trimmed}`)
          sources.push(`大纲: ${file.name.replace(/\.md$/, "")}`)
        } catch { /* skip */ }
      }
    }
  } catch { /* no outlines dir */ }

  // 读取最近章节摘要
  try {
    const chaptersDir = `${pp}/wiki/chapters`
    const tree = await listDirectory(chaptersDir)
    const chapterFiles = tree.filter(f => f.name.endsWith(".md")).slice(-5)
    for (const file of chapterFiles) {
      try {
        const content = await readFile(`${chaptersDir}/${file.name}`)
        const preview = content.length > 1500 ? content.slice(0, 1500) + "\n...(已截断)" : content
        sections.push(`【章节:${file.name.replace(/\.md$/, "")}】\n${preview}`)
        sources.push(`章节: ${file.name.replace(/\.md$/, "")}`)
      } catch { /* skip */ }
    }
  } catch { /* no chapters dir */ }

  return { context: sections.join("\n\n---\n\n"), sources }
}

async function generateOutlineTitle(content: string): Promise<string> {
  // 从内容的前几行提取标题
  const lines = content.split("\n").filter(l => l.trim())
  for (const line of lines.slice(0, 5)) {
    const headingMatch = line.match(/^#+\s+(.+)/)
    if (headingMatch) return headingMatch[1].trim().slice(0, 20)
    if (line.length > 2 && line.length < 30 && !line.startsWith("-") && !line.startsWith("*")) {
      return line.trim().slice(0, 20)
    }
  }
  return `AI大纲-${new Date().toISOString().slice(0, 10)}`
}

async function getUniqueOutlinePath(outlinesDir: string, title: string): Promise<string> {
  const fileName = `${title}.md`
  const firstPath = `${outlinesDir}/${fileName}`
  if (!(await fileExists(firstPath))) return firstPath
  for (let i = 2; i <= 99; i++) {
    const candidate = `${outlinesDir}/${title}-${i}.md`
    if (!(await fileExists(candidate))) return candidate
  }
  return `${outlinesDir}/${title}-${Date.now()}.md`
}

export function OutlineChatPanel({ onClose }: { onClose: () => void }) {
  const project = useWikiStore((s) => s.project)
  const llmConfig = useWikiStore((s) => s.llmConfig)
  const [messages, setMessages] = useState<OutlineChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState("")
  const [saveStatus, setSaveStatus] = useState("")
  const [lastSources, setLastSources] = useState<string[]>([])
  const [copied, setCopied] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const userScrolledUpRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const lastUserInputRef = useRef("")

  // Auto-scroll with user override
  useEffect(() => {
    const container = scrollRef.current
    if (!container || userScrolledUpRef.current) return
    container.scrollTop = container.scrollHeight
  }, [messages, streamContent])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
      userScrolledUpRef.current = !atBottom
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !project || streaming) return
    if (!hasUsableLlm(llmConfig)) return

    const userMsg: OutlineChatMessage = { role: "user", content: input.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    lastUserInputRef.current = input.trim()
    setInput("")
    setStreaming(true)
    setStreamContent("")
    userScrolledUpRef.current = false

    try {
      const { context, sources } = await loadOutlineContext(project.path)
      setLastSources(sources)
      const systemPrompt = `你是一个专业的小说大纲编辑助手。以下是当前小说的大纲和章节内容，请根据用户的问题进行大纲相关的讨论和创作。

${context}`

      const chatMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...updatedMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ]

      let result = ""
      const controller = new AbortController()
      abortRef.current = controller

      await streamChat(llmConfig, chatMessages, {
        onToken: (token) => {
          result += token
          setStreamContent(result)
        },
        onDone: () => {},
        onError: () => {},
      }, controller.signal)

      setMessages([...updatedMessages, { role: "assistant", content: result }])
      setStreamContent("")
    } catch {
      // ignore abort
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, project, streaming, llmConfig, messages])

  const handleRegenerate = useCallback(async (msgIndex: number) => {
    if (!project || streaming) return
    if (!hasUsableLlm(llmConfig)) return

    // Remove the last assistant message and resend
    const targetMessages = messages.slice(0, msgIndex)
    setMessages(targetMessages)
    setStreaming(true)
    setStreamContent("")
    userScrolledUpRef.current = false

    try {
      const { context, sources } = await loadOutlineContext(project.path)
      setLastSources(sources)
      const systemPrompt = `你是一个专业的小说大纲编辑助手。以下是当前小说的大纲和章节内容，请根据用户的问题进行大纲相关的讨论和创作。

${context}`

      const chatMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...targetMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ]

      let result = ""
      const controller = new AbortController()
      abortRef.current = controller

      await streamChat(llmConfig, chatMessages, {
        onToken: (token) => {
          result += token
          setStreamContent(result)
        },
        onDone: () => {},
        onError: () => {},
      }, controller.signal)

      setMessages([...targetMessages, { role: "assistant", content: result }])
      setStreamContent("")
    } catch {
      // ignore
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [project, streaming, llmConfig, messages])

  const handleCopy = useCallback((content: string, index: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(index)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }, [])

  const handleSaveAsOutline = useCallback(async (content: string) => {
    if (!project) return
    setSaveStatus("保存中...")
    try {
      const pp = normalizePath(project.path)
      const outlinesDir = `${pp}/wiki/outlines`
      await createDirectory(outlinesDir)
      const title = await generateOutlineTitle(content)
      const outlinePath = await getUniqueOutlinePath(outlinesDir, title)
      const fileName = outlinePath.split("/").pop()?.replace(/\.md$/, "") ?? title
      const mdContent = `---\ntype: outline\ntitle: "${fileName}"\n---\n\n# ${fileName}\n\n${content}\n`
      await writeFile(outlinePath, mdContent)
      const tree = await listDirectory(pp)
      useWikiStore.getState().setFileTree(tree)
      useWikiStore.getState().bumpDataVersion()
      setSaveStatus(`已保存为大纲：${fileName}`)
    } catch (err) {
      setSaveStatus(`保存失败：${err instanceof Error ? err.message : String(err)}`)
    }
  }, [project])

  return (
    <div className="flex h-[350px] flex-col border-t border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium">AI 大纲助手</span>
        <div className="flex items-center gap-2">
          {saveStatus && <span className="text-xs text-muted-foreground">{saveStatus}</span>}
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && !streaming ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            输入关于大纲的问题或指令，AI 会基于当前大纲和章节内容进行回答和创作。
          </p>
        ) : null}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {/* 引用资料 */}
                  {lastSources.length > 0 && i === messages.length - 1 ? (
                    <details className="mt-2 border-t pt-2">
                      <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <FileText className="h-3 w-3" />
                        引用资料（{lastSources.length}）
                      </summary>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {lastSources.map((src, si) => (
                          <li key={si}>• {src}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                  {/* 操作按钮 */}
                  <div className="mt-2 flex gap-2 border-t pt-2">
                    <button
                      onClick={() => void handleSaveAsOutline(msg.content)}
                      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      <Save className="h-3 w-3" />
                      保存为大纲
                    </button>
                    <button
                      onClick={() => handleCopy(msg.content, i)}
                      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      <Copy className="h-3 w-3" />
                      {copied === i ? "已复制" : "复制"}
                    </button>
                    <button
                      onClick={() => void handleRegenerate(i)}
                      disabled={streaming}
                      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs hover:bg-accent disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      重新生成
                    </button>
                  </div>
                </>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        {streaming && streamContent ? (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{streamContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Input */}
      <div className="border-t px-3 py-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
            placeholder="输入关于大纲的问题..."
            disabled={streaming}
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring disabled:opacity-50"
          />
          <button
            onClick={() => void handleSend()}
            disabled={streaming || !input.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
