import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bot, Check, ChevronRight, Circle, Clipboard, Code2, File, Folder, GitCompareArrows, KeyRound, Layers3, Loader2, MessageSquareText, MonitorPlay, Play, Rocket, Search, Send, Settings2, ShieldCheck, Sparkles, TerminalSquare, Zap } from 'lucide-react';
import { agents, codePreview, commandSuggestions, demoTree, diffPreview, modelOptions, navItems, skills, taskLogs, type NavSection, type TreeNode } from './data';

type Project = {
  name: string;
  path: string;
  tree: TreeNode[];
};

type Skill = typeof skills[number];

type FilePreview = {
  path: string;
  content: string;
  error?: string;
};

type SearchResult = {
  filePath: string;
  line: number;
  preview: string;
};

type AppSettings = {
  apiBaseUrl: string;
  apiKeySource: string;
  temperature: string;
  safeMode: boolean;
  copyBeforeRun: boolean;
  streamResponses: boolean;
};

type SettingChangeHandler = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;

const settingsStorageKey = 'crow6:settings';
const modelStorageKey = 'crow6:selected-model';

const defaultSettings: AppSettings = {
  apiBaseUrl: 'https://api.openai-compatible.local/v1',
  apiKeySource: 'Environment variable: OPENAI_API_KEY',
  temperature: '0.2',
  safeMode: true,
  copyBeforeRun: true,
  streamResponses: true,
};

export function App() {
  const [project, setProject] = useState<Project>({
    name: 'Crow6 Demo Workspace',
    path: 'C:/demo/crow6-admin',
    tree: demoTree,
  });
  const [activeFile, setActiveFile] = useState('src/pages/Login.tsx');
  const [activeTab, setActiveTab] = useState<'chat' | 'agent'>('agent');
  const [activeSection, setActiveSection] = useState<NavSection>('workspace');
  const [isOpening, setIsOpening] = useState(false);
  const [selectedModel, setSelectedModel] = useState(loadSelectedModel);
  const [selectedSkill, setSelectedSkill] = useState(skills[1]);
  const [prompt, setPrompt] = useState('把登录页面改成现代 SaaS 风格，并增加 loading 状态。');
  const [applied, setApplied] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [settingsSavedAt, setSettingsSavedAt] = useState('saved locally');
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('login');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const changedLines = useMemo(() => diffPreview.filter((line) => line.type !== 'same').length, []);

  useEffect(() => {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    setSettingsSavedAt(new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(modelStorageKey, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    let isCancelled = false;

    async function loadFilePreview() {
      if (!window.crow6 || !isAbsolutePath(activeFile)) {
        setFilePreview(null);
        return;
      }

      setIsReadingFile(true);
      try {
        const preview = await window.crow6.readFile(activeFile);
        if (!isCancelled) {
          setFilePreview(preview);
        }
      } finally {
        if (!isCancelled) {
          setIsReadingFile(false);
        }
      }
    }

    void loadFilePreview();

    return () => {
      isCancelled = true;
    };
  }, [activeFile]);

  async function handleOpenProject() {
    if (!window.crow6) {
      return;
    }

    setIsOpening(true);
    try {
      const nextProject = await window.crow6.openProject();
      if (nextProject) {
        setProject(nextProject);
        setApplied(false);
        const firstFile = findFirstFile(nextProject.tree);
        if (firstFile) {
          setActiveFile(firstFile.path);
        }
      }
    } finally {
      setIsOpening(false);
    }
  }

  function handleSkillSelect(skill: typeof skills[number]) {
    setSelectedSkill(skill);
    setPrompt(skill.prompt);
    setActiveSection('skills');
    setActiveTab('chat');
  }

  function handleCopyCommand(command: string) {
    setCopiedCommand(command);
    void navigator.clipboard?.writeText(command);
  }

  function handleSettingChange<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  function handleResetSettings() {
    setSelectedModel(modelOptions[0]);
    setSettings(defaultSettings);
  }

  async function handleProjectSearch() {
    if (!window.crow6 || !isAbsolutePath(project.path)) {
      setSearchResults([
        {
          filePath: 'src/pages/Login.tsx',
          line: 1,
          preview: 'function LoginPage() {',
        },
      ]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await window.crow6.searchFiles(project.path, searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-surface text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_32%)]" />
      <div className="relative flex min-h-screen">
        <SideNav activeSection={activeSection} onSelect={setActiveSection} />

        <main className="flex min-w-0 flex-1 flex-col">
          <TopBar project={project} isOpening={isOpening} selectedModel={selectedModel} onModelChange={setSelectedModel} onOpenProject={handleOpenProject} onOpenSettings={() => setActiveSection('settings')} />

          <section className="grid min-h-0 flex-1 grid-cols-[300px_minmax(420px,1fr)_390px] gap-4 p-4">
            <FileExplorer project={project} activeFile={activeFile} searchQuery={searchQuery} searchResults={searchResults} isSearching={isSearching} onSelectFile={setActiveFile} onSearchQueryChange={setSearchQuery} onSearch={handleProjectSearch} />
            <EditorPanel activeFile={activeFile} activeSection={activeSection} changedLines={changedLines} applied={applied} selectedModel={selectedModel} selectedSkill={selectedSkill} copiedCommand={copiedCommand} settings={settings} settingsSavedAt={settingsSavedAt} filePreview={filePreview} isReadingFile={isReadingFile} onApply={() => setApplied(true)} onSkillSelect={handleSkillSelect} onCopyCommand={handleCopyCommand} onModelChange={setSelectedModel} onSettingChange={handleSettingChange} onResetSettings={handleResetSettings} />
            <AiPanel activeTab={activeTab} prompt={prompt} selectedSkill={selectedSkill} onPromptChange={setPrompt} onTabChange={setActiveTab} onSkillSelect={handleSkillSelect} />
          </section>

          <BottomTimeline copiedCommand={copiedCommand} onCopyCommand={handleCopyCommand} />
        </main>
      </div>
    </div>
  );
}

function SideNav({ activeSection, onSelect }: { activeSection: NavSection; onSelect: (section: NavSection) => void }) {
  return (
    <aside className="flex w-20 flex-col items-center border-r border-borderSoft bg-black/20 py-5 backdrop-blur-xl">
      <button onClick={() => onSelect('workspace')} className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400 text-slate-950 shadow-glow">
        <Rocket size={22} />
      </button>
      <div className="flex flex-1 flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button key={item.label} onClick={() => onSelect(item.id)} className={`group flex h-11 w-11 items-center justify-center rounded-2xl border transition ${isActive ? 'border-sky-300/60 bg-sky-300/15 text-sky-200' : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-200'}`} title={item.label}>
              <Icon size={19} />
            </button>
          );
        })}
      </div>
      <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
    </aside>
  );
}

function TopBar({ project, isOpening, selectedModel, onModelChange, onOpenProject, onOpenSettings }: { project: Project; isOpening: boolean; selectedModel: string; onModelChange: (model: string) => void; onOpenProject: () => void; onOpenSettings: () => void }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-borderSoft bg-panel/70 px-5 backdrop-blur-xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Crow6 Developer Preview</h1>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">Local Alpha</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{project.path}</p>
      </div>
      <div className="flex items-center gap-3">
        <select value={selectedModel} onChange={(event) => onModelChange(event.target.value)} className="rounded-xl border border-borderSoft bg-white/5 px-3 py-2 text-sm text-slate-300 outline-none">
          {modelOptions.map((model) => (
            <option key={model} value={model} className="bg-slate-950">
              OpenAI-compatible / {model}
            </option>
          ))}
        </select>
        <button onClick={onOpenSettings} className="inline-flex items-center gap-2 rounded-xl border border-borderSoft bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
          <Settings2 size={16} />
          Settings
        </button>
        <button onClick={onOpenProject} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-sky-300">
          {isOpening ? <Loader2 className="animate-spin" size={16} /> : <Folder size={16} />}
          Open Project
        </button>
      </div>
    </header>
  );
}

function FileExplorer({
  project,
  activeFile,
  searchQuery,
  searchResults,
  isSearching,
  onSelectFile,
  onSearchQueryChange,
  onSearch,
}: {
  project: Project;
  activeFile: string;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSelectFile: (path: string) => void;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
}) {
  return (
    <section className="min-h-0 rounded-3xl border border-borderSoft bg-panel/80 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{project.name}</h2>
          <p className="text-xs text-slate-500">Project Explorer</p>
        </div>
        <Search size={17} className="text-slate-500" />
      </div>
      <div className="mb-4 rounded-2xl border border-borderSoft bg-black/20 p-3 text-xs text-slate-400">
        <div className="mb-1 flex items-center gap-2 text-sky-200">
          <ShieldCheck size={14} />
          Safe scan enabled
        </div>
        ignoring node_modules, .git, dist, build, .env
      </div>
      <div className="mb-4 rounded-2xl border border-borderSoft bg-black/20 p-2">
        <div className="flex items-center gap-2">
          <input value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onSearch()} className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-600" placeholder="Search files..." />
          <button onClick={onSearch} className="rounded-xl bg-sky-400 px-3 py-1.5 text-xs font-semibold text-slate-950">
            {isSearching ? '...' : 'Go'}
          </button>
        </div>
        {searchResults.length > 0 ? (
          <div className="mt-2 space-y-1 border-t border-borderSoft pt-2">
            {searchResults.slice(0, 4).map((result) => (
              <button key={`${result.filePath}-${result.line}`} onClick={() => onSelectFile(result.filePath)} className="block w-full truncate rounded-lg px-2 py-1 text-left text-xs text-slate-400 hover:bg-white/5">
                <span className="text-sky-200">{result.filePath}</span>:{result.line}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="custom-scroll max-h-[calc(100vh-350px)] overflow-auto pr-1">
        {project.tree.map((node) => (
          <TreeItem key={node.path} node={node} activeFile={activeFile} onSelectFile={onSelectFile} />
        ))}
      </div>
    </section>
  );
}

function TreeItem({ node, activeFile, onSelectFile, depth = 0 }: { node: TreeNode; activeFile: string; onSelectFile: (path: string) => void; depth?: number }) {
  const isFile = node.type === 'file';
  const isActive = activeFile === node.path;

  return (
    <div>
      <button onClick={() => isFile && onSelectFile(node.path)} className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition ${isActive ? 'bg-sky-400/15 text-sky-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`} style={{ paddingLeft: 8 + depth * 16 }}>
        {isFile ? <File size={15} /> : <Folder size={15} className="text-sky-300" />}
        <span className="truncate">{node.name}</span>
      </button>
      {node.children?.map((child) => <TreeItem key={child.path} node={child} activeFile={activeFile} onSelectFile={onSelectFile} depth={depth + 1} />)}
    </div>
  );
}

function EditorPanel({
  activeFile,
  activeSection,
  changedLines,
  applied,
  selectedModel,
  selectedSkill,
  copiedCommand,
  settings,
  settingsSavedAt,
  filePreview,
  isReadingFile,
  onApply,
  onSkillSelect,
  onCopyCommand,
  onModelChange,
  onSettingChange,
  onResetSettings,
}: {
  activeFile: string;
  activeSection: NavSection;
  changedLines: number;
  applied: boolean;
  selectedModel: string;
  selectedSkill: Skill;
  copiedCommand: string | null;
  settings: AppSettings;
  settingsSavedAt: string;
  filePreview: FilePreview | null;
  isReadingFile: boolean;
  onApply: () => void;
  onSkillSelect: (skill: Skill) => void;
  onCopyCommand: (command: string) => void;
  onModelChange: (model: string) => void;
  onSettingChange: SettingChangeHandler;
  onResetSettings: () => void;
}) {
  return (
    <section className="grid min-h-0 grid-rows-[auto_1fr] rounded-3xl border border-borderSoft bg-panel/80 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-borderSoft px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-400/15 text-indigo-200">
            <Code2 size={20} />
          </div>
          <div>
            <h2 className="font-semibold">{activeFile}</h2>
            <p className="text-xs text-slate-500">Preview / Diff Review</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          <GitCompareArrows size={15} />
          {changedLines} changed lines
        </div>
      </div>
      {activeSection === 'skills' ? (
        <SkillsView selectedSkill={selectedSkill} onSkillSelect={onSkillSelect} />
      ) : activeSection === 'commands' ? (
        <CommandsView copiedCommand={copiedCommand} onCopyCommand={onCopyCommand} />
      ) : activeSection === 'settings' ? (
        <SettingsView selectedModel={selectedModel} settings={settings} savedAt={settingsSavedAt} onModelChange={onModelChange} onSettingChange={onSettingChange} onReset={onResetSettings} />
      ) : activeSection === 'agents' ? (
        <AgentOverview />
      ) : (
        <DiffWorkspace activeSection={activeSection} applied={applied} filePreview={filePreview} isReadingFile={isReadingFile} onApply={onApply} onCopyCommand={onCopyCommand} />
      )}
    </section>
  );
}

function DiffWorkspace({ activeSection, applied, filePreview, isReadingFile, onApply, onCopyCommand }: { activeSection: NavSection; applied: boolean; filePreview: FilePreview | null; isReadingFile: boolean; onApply: () => void; onCopyCommand: (command: string) => void }) {
  const title = activeSection === 'diff' ? 'Diff Review' : 'Workspace Preview';
  const previewContent = filePreview?.content || codePreview;

  return (
    <div className="grid min-h-0 grid-cols-2 gap-0">
      <div className="min-w-0 border-r border-borderSoft p-5">
        <PanelTitle title="Current File" subtitle={isReadingFile ? 'loading local file...' : filePreview?.error || 'read-only preview'} />
        <pre className="custom-scroll mt-4 max-h-[calc(100vh-290px)] overflow-auto rounded-2xl border border-borderSoft bg-black/35 p-4 text-sm leading-6 text-slate-300"><code>{previewContent}</code></pre>
      </div>
      <div className="min-w-0 p-5">
        <div className="flex items-start justify-between gap-3">
          <PanelTitle title={title} subtitle="local patch first" />
          {applied ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
              <Check size={13} />
              Applied
            </span>
          ) : null}
        </div>
        <div className="custom-scroll mt-4 max-h-[calc(100vh-330px)] overflow-auto rounded-2xl border border-borderSoft bg-black/35 p-4 font-mono text-sm leading-6">
          {diffPreview.map((line, index) => (
            <div key={`${line.text}-${index}`} className={line.type === 'add' ? 'text-emerald-300' : line.type === 'del' ? 'text-rose-300' : 'text-slate-500'}>
              <span className="mr-3 inline-block w-4 text-slate-600">{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
              {line.text || ' '}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => onCopyCommand('git diff -- src/pages/Login.tsx')} className="flex-1 rounded-xl border border-borderSoft bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
            Copy Patch
          </button>
          <button onClick={onApply} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${applied ? 'bg-emerald-400/20 text-emerald-100' : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'}`}>
            {applied ? 'Applied Locally' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillsView({ selectedSkill, onSkillSelect }: { selectedSkill: Skill; onSkillSelect: (skill: Skill) => void }) {
  return (
    <div className="custom-scroll min-h-0 overflow-auto p-5">
      <div className="mb-5 grid grid-cols-3 gap-3">
        {skills.map((skill) => {
          const Icon = skill.icon;
          const isActive = selectedSkill.name === skill.name;
          return (
            <button key={skill.name} onClick={() => onSkillSelect(skill)} className={`rounded-2xl border p-4 text-left transition ${isActive ? 'border-sky-300/50 bg-sky-400/10' : 'border-borderSoft bg-white/[0.03] hover:bg-white/[0.06]'}`}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-sky-200">
                <Icon size={19} />
              </div>
              <div className="font-medium text-slate-100">{skill.name}</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{skill.text}</p>
            </button>
          );
        })}
      </div>
      <div className="rounded-3xl border border-borderSoft bg-black/25 p-5">
        <PanelTitle title={`${selectedSkill.name} Prompt`} subtitle="clickable built-in skill template" />
        <p className="mt-4 rounded-2xl bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">{selectedSkill.prompt}</p>
      </div>
    </div>
  );
}

function CommandsView({ copiedCommand, onCopyCommand }: { copiedCommand: string | null; onCopyCommand: (command: string) => void }) {
  return (
    <div className="custom-scroll min-h-0 overflow-auto p-5">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatusCard icon={<TerminalSquare size={17} />} title="Mode" value="Copy command first" />
        <StatusCard icon={<ShieldCheck size={17} />} title="Safety" value="No auto execution" />
        <StatusCard icon={<Play size={17} />} title="Demo" value="Ready for preview" />
      </div>
      <div className="space-y-3">
        {commandSuggestions.map((item) => (
          <div key={item.command} className="flex items-center justify-between gap-4 rounded-2xl border border-borderSoft bg-white/[0.03] p-4">
            <div>
              <div className="font-mono text-sm text-sky-100">{item.command}</div>
              <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
            </div>
            <button onClick={() => onCopyCommand(item.command)} className="inline-flex items-center gap-2 rounded-xl border border-borderSoft bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
              <Clipboard size={15} />
              {copiedCommand === item.command ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({
  selectedModel,
  settings,
  savedAt,
  onModelChange,
  onSettingChange,
  onReset,
}: {
  selectedModel: string;
  settings: AppSettings;
  savedAt: string;
  onModelChange: (model: string) => void;
  onSettingChange: SettingChangeHandler;
  onReset: () => void;
}) {
  return (
    <div className="custom-scroll min-h-0 overflow-auto p-5">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatusCard icon={<KeyRound size={17} />} title="Provider" value="OpenAI-compatible" />
        <StatusCard icon={<Zap size={17} />} title="Model" value={selectedModel} />
        <StatusCard icon={<MonitorPlay size={17} />} title="Saved" value={savedAt} />
      </div>
      <div className="rounded-3xl border border-borderSoft bg-black/25 p-5">
        <div className="flex items-start justify-between gap-4">
          <PanelTitle title="Model Settings" subtitle="persisted in localStorage for desktop demo" />
          <button onClick={onReset} className="rounded-xl border border-borderSoft bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
            Reset
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Field label="API Base URL" value={settings.apiBaseUrl} onChange={(value) => onSettingChange('apiBaseUrl', value)} />
          <Field label="API Key Source" value={settings.apiKeySource} onChange={(value) => onSettingChange('apiKeySource', value)} />
          <label className="block">
            <span className="mb-2 block text-xs text-slate-500">Model Name</span>
            <select value={selectedModel} onChange={(event) => onModelChange(event.target.value)} className="w-full rounded-2xl border border-borderSoft bg-white/[0.04] px-4 py-3 text-sm text-slate-300 outline-none">
              {modelOptions.map((model) => (
                <option key={model} value={model} className="bg-slate-950">
                  {model}
                </option>
              ))}
            </select>
          </label>
          <Field label="Temperature" value={settings.temperature} onChange={(value) => onSettingChange('temperature', value)} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <ToggleCard label="Safe Mode" enabled={settings.safeMode} onToggle={() => onSettingChange('safeMode', !settings.safeMode)} />
          <ToggleCard label="Copy Before Run" enabled={settings.copyBeforeRun} onToggle={() => onSettingChange('copyBeforeRun', !settings.copyBeforeRun)} />
          <ToggleCard label="Streaming Output" enabled={settings.streamResponses} onToggle={() => onSettingChange('streamResponses', !settings.streamResponses)} />
        </div>
      </div>
    </div>
  );
}

function AgentOverview() {
  return (
    <div className="custom-scroll min-h-0 overflow-auto p-5">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatusCard icon={<Bot size={17} />} title="State Machine" value="5 visible stages" />
        <StatusCard icon={<Layers3 size={17} />} title="References" value="3 file paths" />
        <StatusCard icon={<GitCompareArrows size={17} />} title="Patch Scope" value="single file" />
      </div>
      <AgentRun expanded />
    </div>
  );
}

function AiPanel({
  activeTab,
  prompt,
  selectedSkill,
  onPromptChange,
  onTabChange,
  onSkillSelect,
}: {
  activeTab: 'chat' | 'agent';
  prompt: string;
  selectedSkill: Skill;
  onPromptChange: (prompt: string) => void;
  onTabChange: (tab: 'chat' | 'agent') => void;
  onSkillSelect: (skill: Skill) => void;
}) {
  return (
    <section className="grid min-h-0 grid-rows-[auto_1fr_auto] rounded-3xl border border-borderSoft bg-panel/80 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-borderSoft p-4">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => onTabChange('chat')} className={`flex-1 rounded-xl px-3 py-2 text-sm ${activeTab === 'chat' ? 'bg-sky-400 text-slate-950' : 'bg-white/5 text-slate-400'}`}>Chat</button>
          <button onClick={() => onTabChange('agent')} className={`flex-1 rounded-xl px-3 py-2 text-sm ${activeTab === 'agent' ? 'bg-sky-400 text-slate-950' : 'bg-white/5 text-slate-400'}`}>Agent</button>
        </div>
        <div className="rounded-2xl border border-borderSoft bg-black/20 p-3 text-xs text-slate-400">
          Task: {prompt}
        </div>
      </div>

      <div className="custom-scroll min-h-0 overflow-auto p-4">
        {activeTab === 'agent' ? <AgentRun /> : <ChatRun selectedSkill={selectedSkill} onSkillSelect={onSkillSelect} />}
      </div>

      <div className="border-t border-borderSoft p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-borderSoft bg-black/25 px-3 py-2">
          <MessageSquareText size={17} className="text-slate-500" />
          <input value={prompt} onChange={(event) => onPromptChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="Ask Crow6 to build, explain, or modify..." />
          <button className="rounded-xl bg-sky-400 p-2 text-slate-950">
            <Send size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

function AgentRun({ expanded = false }: { expanded?: boolean }) {
  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div key={agent.name} className="rounded-2xl border border-borderSoft bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              {agent.state === 'running' ? <Loader2 className="animate-spin text-sky-300" size={16} /> : <Circle size={12} className={agent.state === 'done' ? 'fill-emerald-400 text-emerald-400' : 'text-slate-600'} />}
              {agent.name} Agent
            </div>
            <span className={`rounded-full px-2 py-1 text-[11px] ${agent.state === 'done' ? 'bg-emerald-400/10 text-emerald-200' : agent.state === 'running' ? 'bg-sky-400/10 text-sky-200' : 'bg-slate-500/10 text-slate-500'}`}>{agent.state}</span>
          </div>
          <p className="text-sm leading-6 text-slate-400">{agent.summary}</p>
          {expanded ? <p className="mt-3 rounded-xl bg-black/25 p-3 font-mono text-xs leading-5 text-slate-500">{agent.output}</p> : null}
        </div>
      ))}
    </div>
  );
}

function ChatRun({ selectedSkill, onSkillSelect }: { selectedSkill: Skill; onSkillSelect: (skill: Skill) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-sky-400/10 p-4 text-sm text-sky-100">帮我分析这个项目结构，并告诉我登录页面在哪里。</div>
      <div className="rounded-2xl border border-borderSoft bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
        我找到了登录页面：<span className="text-sky-200">src/pages/Login.tsx</span>。项目采用 React + Vite + Tailwind，页面入口集中在 src/pages，通用组件在 src/components。
      </div>
      <div className="rounded-2xl border border-sky-300/20 bg-sky-400/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-100">
          <Sparkles size={16} />
          Active Skill: {selectedSkill.name}
        </div>
        <p className="text-xs leading-5 text-slate-400">{selectedSkill.prompt}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {skills.slice(0, 4).map((skill) => (
          <button key={skill.name} onClick={() => onSkillSelect(skill)} className="rounded-xl border border-borderSoft bg-white/[0.03] px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/[0.06]">
            {skill.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function BottomTimeline({ copiedCommand, onCopyCommand }: { copiedCommand: string | null; onCopyCommand: (command: string) => void }) {
  const command = copiedCommand ?? commandSuggestions[0].command;

  return (
    <footer className="grid h-24 grid-cols-[1.2fr_1fr_1fr] gap-4 border-t border-borderSoft bg-panel/70 px-4 py-3 backdrop-blur-xl">
      <StatusCard icon={<Bot size={17} />} title="Task Timeline" value={taskLogs.map((log) => log.title).join(' → ')} />
      <StatusCard icon={<Sparkles size={17} />} title="Skills" value="Code Review, UI Polish, Generate Tests" />
      <button onClick={() => onCopyCommand(command)} className="rounded-2xl border border-borderSoft bg-black/20 px-4 py-3 text-left hover:bg-white/[0.04]">
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
          <ChevronRight size={17} />
          Command Suggestion
        </div>
        <div className="truncate text-sm text-slate-300">{command} · {copiedCommand ? 'copied' : 'copy command only'}</div>
      </button>
    </footer>
  );
}

function StatusCard({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-borderSoft bg-black/20 px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">{icon}{title}</div>
      <div className="truncate text-sm text-slate-300">{value}</div>
    </div>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function ToggleCard({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`rounded-2xl border p-4 text-left transition ${enabled ? 'border-emerald-300/30 bg-emerald-400/10' : 'border-borderSoft bg-white/[0.03]'}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className={`h-3 w-3 rounded-full ${enabled ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]' : 'bg-slate-600'}`} />
      </div>
      <p className="text-xs text-slate-500">{enabled ? 'Enabled' : 'Disabled'}</p>
    </button>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-slate-500">{label}</span>
      <input value={value} readOnly={!onChange} onChange={(event) => onChange?.(event.target.value)} className="w-full rounded-2xl border border-borderSoft bg-white/[0.04] px-4 py-3 text-sm text-slate-300 outline-none" />
    </label>
  );
}

function loadSelectedModel() {
  const storedModel = window.localStorage.getItem(modelStorageKey);
  return storedModel && modelOptions.includes(storedModel) ? storedModel : modelOptions[0];
}

function loadSettings(): AppSettings {
  try {
    const storedSettings = window.localStorage.getItem(settingsStorageKey);
    if (!storedSettings) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(storedSettings),
    };
  } catch {
    return defaultSettings;
  }
}

function isAbsolutePath(filePath: string) {
  return /^[A-Za-z]:[\\/]/.test(filePath) || filePath.startsWith('/');
}

function findFirstFile(nodes: TreeNode[]): TreeNode | null {
  for (const node of nodes) {
    if (node.type === 'file') {
      return node;
    }

    if (node.children) {
      const child = findFirstFile(node.children);
      if (child) {
        return child;
      }
    }
  }

  return null;
}
