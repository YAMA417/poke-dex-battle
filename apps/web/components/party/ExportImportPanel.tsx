'use client';

import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';

interface ExportImportPanelProps {
    onExport: () => string;
    onImport: (json: string) => void;
    label?: string;
}

export function ExportImportPanel({ onExport, onImport, label = 'パーティ' }: ExportImportPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleExport() {
        const json = onExport();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poke-party-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = ev.target?.result as string;
                onImport(json);
            } catch (err) {
                alert(`インポートに失敗しました:\n${err instanceof Error ? err.message : String(err)}`);
            }
        };
        reader.readAsText(file, 'utf-8');
        // 同じファイルの再選択を許可
        e.target.value = '';
    }

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
                <Download size={14} />
                {label}をエクスポート
            </button>
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
                <Upload size={14} />
                インポート
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
