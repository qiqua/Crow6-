import { Bot, Braces, CheckCircle2, FileCode2, GitCompareArrows, LayoutDashboard, PlayCircle, Search, Settings, Sparkles, Store, TerminalSquare } from 'lucide-react';

export type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
};

export type AgentState = 'done' | 'running' | 'waiting';

export type NavSection = 'workspace' | 'agents' | 'diff' | 'skills' | 'commands' | 'settings';

export const demoTree: TreeNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'directory',
    children: [
      {
        name: 'pages',
        path: 'src/pages',
        type: 'directory',
        children: [
          { name: 'Login.tsx', path: 'src/pages/Login.tsx', type: 'file' },
          { name: 'Dashboard.tsx', path: 'src/pages/Dashboard.tsx', type: 'file' },
          { name: 'Users.tsx', path: 'src/pages/Users.tsx', type: 'file' },
        ],
      },
      {
        name: 'components',
        path: 'src/components',
        type: 'directory',
        children: [
          { name: 'Sidebar.tsx', path: 'src/components/Sidebar.tsx', type: 'file' },
          { name: 'MetricCard.tsx', path: 'src/components/MetricCard.tsx', type: 'file' },
        ],
      },
      { name: 'App.tsx', path: 'src/App.tsx', type: 'file' },
      { name: 'main.tsx', path: 'src/main.tsx', type: 'file' },
    ],
  },
  { name: 'package.json', path: 'package.json', type: 'file' },
  { name: 'tailwind.config.ts', path: 'tailwind.config.ts', type: 'file' },
  { name: 'vite.config.ts', path: 'vite.config.ts', type: 'file' },
];

export const agents: { name: string; state: AgentState; summary: string; output: string }[] = [
  {
    name: 'Planner',
    state: 'done',
    summary: '拆解登录页现代化任务，锁定 UI、loading、视觉层级。',
    output: 'Plan: update hero background, card style, submit state, and avoid full-file rewrite.',
  },
  {
    name: 'Codebase',
    state: 'done',
    summary: '命中 src/pages/Login.tsx 与 src/components/MetricCard.tsx。',
    output: 'References: src/pages/Login.tsx, src/components/MetricCard.tsx, tailwind.config.ts.',
  },
  {
    name: 'Engineer',
    state: 'running',
    summary: '正在生成局部 patch，避免整文件重写。',
    output: 'Patch scope: 6 changed lines, one component only, no dependency change.',
  },
  {
    name: 'Reviewer',
    state: 'waiting',
    summary: '等待检查样式冲突、状态命名和可回滚性。',
    output: 'Pending: verify disabled button state and Tailwind classes.',
  },
  {
    name: 'Tester',
    state: 'waiting',
    summary: 'Alpha 阶段生成测试建议，不执行真实测试。',
    output: 'Pending: suggest manual login loading-state checklist.',
  },
];

export const skills = [
  { name: 'Code Review', icon: CheckCircle2, text: '审查当前 Diff 并输出风险。', prompt: 'Review the current patch and list UI, logic, and rollback risks.' },
  { name: 'UI Polish', icon: Sparkles, text: '美化当前页面的视觉层级。', prompt: 'Polish this page into a premium SaaS interface while keeping the same behavior.' },
  { name: 'Generate Tests', icon: PlayCircle, text: '为当前文件生成测试建议。', prompt: 'Generate focused manual and unit test suggestions for the selected file.' },
  { name: 'Explain Codebase', icon: Search, text: '总结项目结构和关键入口。', prompt: 'Explain this project structure with file path references.' },
  { name: 'API Docs', icon: Braces, text: '根据接口代码生成文档。', prompt: 'Create concise API docs from the selected files.' },
  { name: 'Build Feature', icon: LayoutDashboard, text: '把需求拆解为可应用 patch。', prompt: 'Break this feature into a safe implementation plan and a local patch.' },
];

export const navItems: { id: NavSection; label: string; icon: typeof FileCode2 }[] = [
  { id: 'workspace', label: 'Workspace', icon: FileCode2 },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'diff', label: 'Diff', icon: GitCompareArrows },
  { id: 'skills', label: 'Skills', icon: Store },
  { id: 'commands', label: 'Commands', icon: TerminalSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const codePreview = `function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1>Welcome back</h1>
        <button onClick={() => setLoading(true)}>Sign in</button>
      </section>
    </main>
  );
}`;

export const diffPreview = [
  { type: 'same', text: 'function LoginPage() {' },
  { type: 'same', text: '  const [loading, setLoading] = useState(false);' },
  { type: 'add', text: '  const buttonLabel = loading ? "Signing in..." : "Sign in";' },
  { type: 'same', text: '' },
  { type: 'same', text: '  return (' },
  { type: 'del', text: '    <main className="min-h-screen bg-slate-950">' },
  { type: 'add', text: '    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950">' },
  { type: 'del', text: '      <section className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">' },
  { type: 'add', text: '      <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">' },
  { type: 'same', text: '        <h1>Welcome back</h1>' },
  { type: 'del', text: '        <button onClick={() => setLoading(true)}>Sign in</button>' },
  { type: 'add', text: '        <button disabled={loading} onClick={() => setLoading(true)}>{buttonLabel}</button>' },
  { type: 'same', text: '      </section>' },
  { type: 'same', text: '    </main>' },
  { type: 'same', text: '  );' },
  { type: 'same', text: '}' },
];

export const taskLogs = [
  { time: '00:01', title: 'Project opened', detail: 'Loaded demo tree and indexed visible files.' },
  { time: '00:06', title: 'Search completed', detail: 'Found login entry in src/pages/Login.tsx.' },
  { time: '00:11', title: 'Patch generated', detail: 'Prepared focused patch with 6 changed lines.' },
  { time: '00:14', title: 'Review queued', detail: 'Waiting for user confirmation before apply.' },
];

export const commandSuggestions = [
  { command: 'npm run dev', reason: 'Start the local preview for the selected project.' },
  { command: 'npm run build', reason: 'Run a production build check before demo.' },
  { command: 'git diff -- src/pages/Login.tsx', reason: 'Inspect the generated local patch.' },
];

export const modelOptions = ['deepseek-chat', 'gpt-4o-mini', 'qwen-plus', 'local-ollama'];
