import React, { useEffect, useState, useRef } from "react";
import { globalPhoneSse } from "../api/sse-client";
import type { SseEventItem } from "../types";
import { Terminal, Trash2, Radio } from "lucide-react";

export const SseLogPanel: React.FC = () => {
  const [events, setEvents] = useState<SseEventItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 启动 SSE 连接并监听
    globalPhoneSse.connect();
    const unsubscribe = globalPhoneSse.subscribe((item) => {
      setEvents((prev) => [...prev.slice(-99), item]); // 保留最近 100 条
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const clearLogs = () => setEvents([]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* 头部标题与操作 */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-sky-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
            SSE 实时事件总线
          </span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            监听中
          </span>
        </div>
        <button
          onClick={clearLogs}
          title="清空日志"
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 终端日志滚动列表 */}
      <div
        ref={containerRef}
        className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]"
      >
        {events.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-zinc-400">
            等待手机端事件 (微信消息、通知、心跳)...
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-2.5 dark:border-zinc-800/80 dark:bg-zinc-950/50"
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span
                  className={`font-bold ${
                    evt.type === "GUARD_EVENT"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : evt.type === "HEARTBEAT"
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  [{evt.type}]
                </span>
                <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">
                {evt.title}
              </div>
              <div className="mt-0.5 text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {evt.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
