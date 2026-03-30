"use client";

import { useState, useRef } from "react";
import { Upload, Database, CheckCircle2, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import type { IPFSUploadResult } from "@/types";

interface Props {
  onUploaded?: (result: IPFSUploadResult) => void;
  label?: string;
  accept?: string;
}

export default function IPFSUploader({
  onUploaded,
  label = "Upload to IPFS via Storacha",
  accept = "*",
}: Props) {
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<(IPFSUploadResult & { real?: boolean; message?: string }) | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setState("uploading");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ipfs", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResult(data);
      setState("done");
      onUploaded?.(data);
    } catch (e) {
      setError(String(e));
      setState("error");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="w-full">
      {state !== "done" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={state === "uploading"}
          className={`w-full border-2 border-dashed rounded-xl p-5 transition-all text-center cursor-pointer
            ${dragging ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"}
            ${state === "uploading" ? "opacity-60 cursor-not-allowed" : ""}
            ${state === "error" ? "border-red-300 bg-red-50" : ""}`}
        >
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onFileChange} />
          {state === "uploading" ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-emerald-600 font-medium">Pinning to IPFS via Storacha…</p>
              <p className="text-xs text-gray-400">Content-addressed storage on Protocol Labs infrastructure</p>
            </div>
          ) : state === "error" ? (
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="w-7 h-7 text-red-400" />
              <p className="text-sm text-red-500">{error}</p>
              <p className="text-xs text-gray-400">Click to retry</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Upload className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">Drag & drop or click · Stored on IPFS via Storacha</p>
              <div className="badge-ipfs mt-1">
                <Database className="w-3 h-3" /> Storacha · Protocol Labs
              </div>
            </div>
          )}
        </button>
      ) : result ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-700">
                {result.real ? "✅ Pinned to IPFS" : "🔵 Demo CID Generated"}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">{result.message ?? "Stored via Storacha"}</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">CID:</span>
                  <a href={result.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-emerald-600 hover:underline flex items-center gap-1 truncate">
                    {result.cid.slice(0, 28)}… <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
                <p className="text-xs text-gray-400">Space DID: {result.storachaDid.slice(0, 30)}…</p>
                <p className="text-xs text-gray-400">{(result.size / 1024).toFixed(1)} KB · {result.filename}</p>
              </div>
            </div>
          </div>
          <button onClick={() => { setState("idle"); setResult(null); }}
            className="mt-3 text-xs text-emerald-600 hover:underline">
            Upload another file
          </button>
        </div>
      ) : null}
    </div>
  );
}
