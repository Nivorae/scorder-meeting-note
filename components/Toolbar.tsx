"use client";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DemoNoteSchema, type DemoNote } from "@/lib/schema";
import { defaultDemoNote } from "@/lib/defaults";
import { clearDraft, saveDraft } from "@/lib/storage";
import { buildExportFilename, todayIsoDate } from "@/lib/filename";

interface ToolbarProps {
  lastSavedAt: string | null;
}

export function Toolbar({ lastSavedAt }: ToolbarProps) {
  const { getValues, reset } = useFormContext<DemoNote>();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importPending, setImportPending] = React.useState<DemoNote | null>(null);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const handleExportJson = () => {
    const note = { ...getValues(), meta: { ...getValues().meta, updatedAt: new Date().toISOString() } };
    const blob = new Blob([JSON.stringify(note, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildExportFilename(note.basicInfo.restaurantName, todayIsoDate());
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    saveDraft(getValues());
    // ?auto=1 tells the print route to auto-trigger window.print().
    // Direct/bookmark visits to /print render the preview without prompting.
    window.open("/print?auto=1", "_blank");
  };

  const handlePickFile = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json?.meta?.version !== 1) {
        setImportError(`不支援的檔案版本：${json?.meta?.version ?? "未知"}（目前只支援 v1）`);
        return;
      }
      const result = DemoNoteSchema.safeParse(json);
      if (!result.success) {
        setImportError(`檔案格式有誤：${result.error.issues[0]?.path.join(".")}：${result.error.issues[0]?.message}`);
        return;
      }
      setImportPending(result.data);
    } catch (err) {
      setImportError(`無法讀取檔案：${(err as Error).message}`);
    }
  };

  const confirmImport = () => {
    if (importPending) {
      reset(importPending);
      saveDraft(importPending);
    }
    setImportPending(null);
  };

  const confirmClear = () => {
    reset(defaultDemoNote());
    clearDraft();
    setShowClearConfirm(false);
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold">Scorder Demo 紀錄</h1>
        <span className="text-xs text-neutral-500">
          {lastSavedAt ? `已儲存 ${lastSavedAt}` : "未儲存"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFileChange} />
        <Button type="button" variant="outline" onClick={handlePickFile}>匯入 JSON</Button>
        <Button type="button" variant="outline" onClick={handleExportJson}>匯出 JSON</Button>
        <Button type="button" onClick={handleExportPdf}>匯出 PDF</Button>
        <Button type="button" variant="ghost" onClick={() => setShowClearConfirm(true)}>清空表單</Button>
      </div>

      {/* Import error dialog */}
      <Dialog open={importError !== null} onOpenChange={() => setImportError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>匯入失敗</DialogTitle>
            <DialogDescription>{importError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setImportError(null)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import confirm dialog */}
      <Dialog open={importPending !== null} onOpenChange={(o) => !o && setImportPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認匯入</DialogTitle>
            <DialogDescription>匯入後會覆蓋目前表單內容，確定要繼續嗎？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportPending(null)}>取消</Button>
            <Button onClick={confirmImport}>確定匯入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear confirm dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>清空表單？</DialogTitle>
            <DialogDescription>這會清除目前所有內容並重設為空白表單，無法復原。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>取消</Button>
            <Button onClick={confirmClear}>確定清空</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
