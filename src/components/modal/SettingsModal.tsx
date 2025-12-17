import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '@/stores';
import { ICON_MAP, ICON_OPTIONS, DEFAULT_PROJECT_COLORS, DEFAULT_TODO_COLORS, DEFAULT_TODO_STATUSES, STATUS_COLOR_OPTIONS } from '@/constants';
import { cn } from '@/utils';

type SettingsTab = 'projectColors' | 'todoColors' | 'todoStatuses' | 'general' | 'about';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [tab, setTab] = useState<SettingsTab>('projectColors');
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const projectColors = settings.projectColors?.length ? settings.projectColors : DEFAULT_PROJECT_COLORS;
  const todoColorsConfig = settings.todoColors?.length ? settings.todoColors : DEFAULT_TODO_COLORS;
  const todoStatuses = settings.todoStatuses?.length ? settings.todoStatuses : DEFAULT_TODO_STATUSES;

  // 同步开机自启动状态
  useEffect(() => {
    if (settings.launchAtStartup) {
      invoke('plugin:autostart|enable').catch(console.error);
    } else {
      invoke('plugin:autostart|disable').catch(console.error);
    }
  }, [settings.launchAtStartup]);

  // 同步关闭到托盘状态
  useEffect(() => {
    invoke('set_close_to_tray', { enabled: settings.closeToTray }).catch(console.error);
  }, [settings.closeToTray]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl w-[90vw] max-w-[600px] h-[80vh] max-h-[500px] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 侧边导航 */}
        <div className="w-36 bg-secondary/30 border-r border-border p-2">
          <h2 className="text-sm font-semibold px-3 py-2 text-muted-foreground">设置</h2>
          {(['projectColors', 'todoColors', 'todoStatuses', 'general', 'about'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                tab === t ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              )}
            >
              {{ projectColors: '项目颜色', todoColors: '子任务颜色', todoStatuses: '任务状态', general: '通用设置', about: '关于' }[t]}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {tab === 'projectColors' && (
            <div>
              <h3 className="text-sm font-medium mb-3">项目颜色</h3>
              <div className="space-y-2">
                {projectColors.map((color) => (
                  <div key={color.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    {editingColorId === color.id ? (
                      <>
                        <input type="color" value={color.bg} onChange={(e) => updateSettings({ projectColors: projectColors.map(c => c.id === color.id ? { ...c, bg: e.target.value } : c) })} className="w-8 h-8 rounded cursor-pointer" />
                        <input type="text" value={color.name} onChange={(e) => updateSettings({ projectColors: projectColors.map(c => c.id === color.id ? { ...c, name: e.target.value } : c) })} className="flex-1 px-2 py-1 text-sm bg-background rounded" />
                        <button onClick={() => setEditingColorId(null)} className="text-xs text-primary">完成</button>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded" style={{ backgroundColor: color.bg }} />
                        <span className="flex-1 text-sm">{color.name}</span>
                        <button onClick={() => setEditingColorId(color.id)} className="text-xs text-muted-foreground hover:text-foreground">编辑</button>
                        <button onClick={() => updateSettings({ projectColors: projectColors.filter(c => c.id !== color.id) })} className="text-xs text-destructive">删除</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => { const c = { id: `p-${Date.now()}`, name: '新颜色', bg: '#e0e0e0', border: '#c0c0c0' }; updateSettings({ projectColors: [...projectColors, c] }); setEditingColorId(c.id); }} className="mt-3 w-full py-2 text-sm text-primary border border-dashed border-primary/50 rounded-lg hover:bg-primary/5">+ 添加颜色</button>
            </div>
          )}

          {tab === 'todoColors' && (
            <div>
              <h3 className="text-sm font-medium mb-3">子任务颜色</h3>
              <div className="space-y-2">
                {todoColorsConfig.map((color) => (
                  <div key={color.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    {editingColorId === color.id ? (
                      <>
                        <input type="color" value={color.bg === 'transparent' ? '#ffffff' : color.bg} onChange={(e) => updateSettings({ todoColors: todoColorsConfig.map(c => c.id === color.id ? { ...c, bg: e.target.value } : c) })} className="w-8 h-8 rounded cursor-pointer" />
                        <input type="text" value={color.name} onChange={(e) => updateSettings({ todoColors: todoColorsConfig.map(c => c.id === color.id ? { ...c, name: e.target.value } : c) })} className="flex-1 px-2 py-1 text-sm bg-background rounded" />
                        <button onClick={() => setEditingColorId(null)} className="text-xs text-primary">完成</button>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded border" style={{ backgroundColor: color.bg === 'transparent' ? 'var(--secondary)' : color.bg }} />
                        <span className="flex-1 text-sm">{color.name}</span>
                        <button onClick={() => setEditingColorId(color.id)} className="text-xs text-muted-foreground hover:text-foreground">编辑</button>
                        {color.id !== 'none' && <button onClick={() => updateSettings({ todoColors: todoColorsConfig.filter(c => c.id !== color.id) })} className="text-xs text-destructive">删除</button>}
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => { const c = { id: `t-${Date.now()}`, name: '新颜色', bg: '#e0e0e0', border: '#c0c0c0' }; updateSettings({ todoColors: [...todoColorsConfig, c] }); setEditingColorId(c.id); }} className="mt-3 w-full py-2 text-sm text-primary border border-dashed border-primary/50 rounded-lg hover:bg-primary/5">+ 添加颜色</button>
            </div>
          )}

          {tab === 'todoStatuses' && (
            <div>
              <h3 className="text-sm font-medium mb-3">任务状态</h3>
              <div className="space-y-2">
                {todoStatuses.map((status) => {
                  const Icon = ICON_MAP[status.icon] || Circle;
                  return (
                    <div key={status.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                      {editingStatusId === status.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  document.getElementById(`icon-picker-${status.id}`)?.classList.toggle('hidden');
                                }}
                                className="p-2 rounded bg-background hover:bg-accent"
                              >
                                <Icon className={cn('w-5 h-5', status.color)} />
                              </button>
                              <div id={`icon-picker-${status.id}`} className="hidden absolute left-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-50">
                                <p className="text-xs text-muted-foreground mb-2">选择图标</p>
                                <div className="flex gap-1 flex-wrap">
                                  {ICON_OPTIONS.map((iconName) => {
                                    const IconComp = ICON_MAP[iconName];
                                    return (
                                      <button
                                        key={iconName}
                                        onClick={() => {
                                          updateSettings({ todoStatuses: todoStatuses.map(s => s.id === status.id ? { ...s, icon: iconName } : s) });
                                          document.getElementById(`icon-picker-${status.id}`)?.classList.add('hidden');
                                        }}
                                        className={cn('p-1.5 rounded', status.icon === iconName ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                                      >
                                        <IconComp className="w-4 h-4" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <input type="text" value={status.name} onChange={(e) => updateSettings({ todoStatuses: todoStatuses.map(s => s.id === status.id ? { ...s, name: e.target.value } : s) })} className="flex-1 px-2 py-1 text-sm bg-background rounded" />
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  document.getElementById(`color-picker-${status.id}`)?.classList.toggle('hidden');
                                }}
                                className={cn('w-6 h-6 rounded-full border-2 border-border', status.color.replace('text-', 'bg-'))}
                              />
                              <div id={`color-picker-${status.id}`} className="hidden absolute right-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50">
                                <p className="text-xs text-muted-foreground mb-2">选择颜色</p>
                                <div className="flex gap-1.5">
                                  {STATUS_COLOR_OPTIONS.map((c) => (
                                    <button
                                      key={c.value}
                                      onClick={() => {
                                        updateSettings({ todoStatuses: todoStatuses.map(s => s.id === status.id ? { ...s, color: c.value } : s) });
                                        document.getElementById(`color-picker-${status.id}`)?.classList.add('hidden');
                                      }}
                                      className={cn('w-6 h-6 rounded-full', c.bg, status.color === c.value ? 'ring-2 ring-offset-2 ring-primary' : '')}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => setEditingStatusId(null)} className="text-xs text-primary">完成</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Icon className={cn('w-5 h-5', status.color)} />
                          <span className="flex-1 text-sm">{status.name}</span>
                          <button onClick={() => setEditingStatusId(status.id)} className="text-xs text-muted-foreground hover:text-foreground">编辑</button>
                          {todoStatuses.length > 1 && <button onClick={() => updateSettings({ todoStatuses: todoStatuses.filter(s => s.id !== status.id) })} className="text-xs text-destructive">删除</button>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { const s = { id: `s-${Date.now()}`, name: '新状态', icon: 'Circle', color: 'text-muted-foreground' }; updateSettings({ todoStatuses: [...todoStatuses, s] }); setEditingStatusId(s.id); }} className="mt-3 w-full py-2 text-sm text-primary border border-dashed border-primary/50 rounded-lg hover:bg-primary/5">+ 添加状态</button>
            </div>
          )}

          {tab === 'general' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">外观</h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">主题</span>
                  <div className="flex gap-1 bg-background rounded-lg p-1">
                    {([['light', '浅色'], ['dark', '深色'], ['system', '跟随系统']] as const).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => updateSettings({ theme: value })}
                        className={cn('px-3 py-1.5 text-xs rounded-md transition-colors', settings.theme === value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">窗口行为</h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer">
                    <span className="text-sm">开机自启动</span>
                    <input type="checkbox" checked={settings.launchAtStartup} onChange={(e) => updateSettings({ launchAtStartup: e.target.checked })} className="w-4 h-4 accent-primary" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer">
                    <span className="text-sm">关闭时最小化到托盘</span>
                    <input type="checkbox" checked={settings.closeToTray} onChange={(e) => updateSettings({ closeToTray: e.target.checked })} className="w-4 h-4 accent-primary" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {tab === 'about' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="8" width="104" height="104" rx="22" fill="#22C55E" />
                    <path d="M36 50C36 44.477 40.477 40 46 40C47.126 40 48.21 40.168 49.228 40.48C51.486 35.584 56.382 32 62 32C69.18 32 75.078 37.328 75.876 44.26C76.246 44.178 76.618 44.134 77 44.134C81.418 44.134 85 47.716 85 52.134C85 56.552 81.418 60.134 77 60.134H46C40.477 60.134 36 55.657 36 50.134V50Z" fill="white" opacity="0.9" />
                    <rect x="38" y="56" width="44" height="38" rx="3" fill="white" opacity="0.95" />
                    <line x1="46" y1="68" x2="74" y2="68" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                    <line x1="46" y1="78" x2="68" y2="78" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
                    <line x1="46" y1="88" x2="62" y2="88" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">云笺</h3>
                <p className="text-xs text-muted-foreground mt-1">YunJian</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">当前版本</span>
                  <span className="text-sm font-medium">v0.1.0</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">更新状态</span>
                  <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">已是最新版本</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
                  更新日志
                </button>
                <button className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  检查更新
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
