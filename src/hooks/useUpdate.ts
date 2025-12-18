import { useState, useEffect, useRef, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
}

export interface UpdateState {
  checking: boolean;
  hasUpdate: boolean;
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  progress: number;
  error: string | null;
}

const IGNORED_VERSIONS_KEY = 'yunjian-ignored-versions';

export function useUpdate() {
  const [state, setState] = useState<UpdateState>({
    checking: false,
    hasUpdate: false,
    updateInfo: null,
    downloading: false,
    progress: 0,
    error: null,
  });

  const updateRef = useRef<Update | null>(null);
  const isCheckingRef = useRef(false);

  const getIgnoredVersions = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(IGNORED_VERSIONS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const ignoreVersion = (version: string) => {
    const ignored = getIgnoredVersions();
    if (!ignored.includes(version)) {
      localStorage.setItem(IGNORED_VERSIONS_KEY, JSON.stringify([...ignored, version]));
    }
  };

  const checkUpdate = useCallback(async (silent = false) => {
    console.log('[Update] 开始检查更新, silent:', silent);
    if (isCheckingRef.current) {
      console.log('[Update] 已在检查中，跳过');
      return;
    }
    isCheckingRef.current = true;

    if (!silent) {
      setState(s => ({ ...s, checking: true, error: null }));
    }

    try {
      console.log('[Update] 调用 check() API...');
      const update = await check({ timeout: 30000 });
      console.log('[Update] check() 返回:', update);

      if (update) {
        console.log('[Update] 发现新版本:', update.version);
        const ignored = getIgnoredVersions();
        console.log('[Update] 已忽略的版本:', ignored);
        if (ignored.includes(update.version)) {
          console.log('[Update] 该版本已被忽略');
          setState(s => ({ ...s, checking: false, hasUpdate: false }));
        } else {
          console.log('[Update] 有可用更新:', update.version);
          updateRef.current = update;
          setState(s => ({
            ...s,
            checking: false,
            hasUpdate: true,
            updateInfo: {
              version: update.version,
              body: update.body || undefined,
              date: update.date || undefined,
            },
          }));
        }
      } else {
        console.log('[Update] 已是最新版本');
        setState(s => ({ ...s, checking: false, hasUpdate: false }));
      }
    } catch (err) {
      console.error('[Update] 检查更新出错:', err);
      setState(s => ({
        ...s,
        checking: false,
        error: silent ? null : (err as Error).message,
      }));
    } finally {
      isCheckingRef.current = false;
      console.log('[Update] 检查完成');
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    console.log('[Update] 开始下载安装');
    if (!updateRef.current) {
      console.log('[Update] 没有可用的更新对象');
      return;
    }

    setState(s => ({ ...s, downloading: true, progress: 0, error: null }));

    try {
      let downloaded = 0;
      let contentLength = 0;
      console.log('[Update] 调用 downloadAndInstall()...');
      await updateRef.current.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength || 0;
          console.log('[Update] 下载开始, 总大小:', contentLength);
          setState(s => ({ ...s, progress: 0 }));
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          const percent = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
          console.log('[Update] 下载进度:', percent.toFixed(1) + '%');
          setState(s => ({ ...s, progress: Math.min(percent, 99) }));
        } else if (event.event === 'Finished') {
          console.log('[Update] 下载完成');
          setState(s => ({ ...s, progress: 100 }));
        }
      });

      console.log('[Update] 准备重启应用...');
      await relaunch();
    } catch (err) {
      console.error('[Update] 下载安装出错:', err);
      setState(s => ({
        ...s,
        downloading: false,
        error: (err as Error).message,
      }));
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setState(s => ({ ...s, hasUpdate: false }));
  }, []);

  const ignoreCurrentVersion = useCallback(() => {
    if (state.updateInfo?.version) {
      ignoreVersion(state.updateInfo.version);
      setState(s => ({ ...s, hasUpdate: false }));
    }
  }, [state.updateInfo?.version]);

  // 启动时自动检查（延迟1秒）
  useEffect(() => {
    const timer = setTimeout(() => checkUpdate(true), 1000);
    return () => clearTimeout(timer);
  }, [checkUpdate]);

  return {
    ...state,
    checkUpdate,
    downloadAndInstall,
    dismissUpdate,
    ignoreCurrentVersion,
  };
}
