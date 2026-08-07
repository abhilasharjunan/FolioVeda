"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CsvUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<{ row: number; field: string; message: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPreview(text.split('\n').slice(0, 5));
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setErrors([]);

    const text = await file.text();

    try {
      const res = await fetch('/api/portfolio/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors?.length > 0) {
          setErrors(data.errors);
        }
        setResult({ type: 'error', message: data.error || data.details || 'Import failed' });
        return;
      }

      setResult({ type: 'success', message: `Successfully imported ${data.imported} holding(s)!` });
      toast.success(`Imported ${data.imported} holding(s)`);
      setFile(null);
      setPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (e) {
      setResult({ type: 'error', message: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="surface-card border-none shadow-sm max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-heading">CSV Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 hover:border-blue-300 transition-colors">
          {!file ? (
            <>
              <Upload className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-sm text-slate-600 mb-1">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-slate-400">File must include: schemeName, schemeCode, units, investedAmount, date</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-input"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={14} className="mr-2" />
                Choose CSV File
              </Button>
            </>
          ) : (
            <div className="text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setPreview([]); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-500 max-h-24 overflow-y-auto">
                {preview.map((line, i) => <div key={i}>{line}</div>)}
              </div>
              {preview.length > 0 && <p className="text-xs text-slate-400">Showing first {preview.length} lines</p>}
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading ? <><Loader2 size={14} className="mr-2 animate-spin" /> Importing...</> : 'Upload & Import'}
              </Button>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-2">
            <p className="text-xs font-bold text-red-700 flex items-center gap-1">
              <AlertTriangle size={12} /> Validation Errors
            </p>
            {errors.slice(0, 5).map((e, i) => (
              <p key={i} className="text-[11px] text-red-600">
                Row {e.row}: {e.field} — {e.message}
              </p>
            ))}
            {errors.length > 5 && <p className="text-[11px] text-red-400">...and {errors.length - 5} more errors</p>}
          </div>
        )}

        {result && (
          <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {result.message}
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs font-bold text-slate-600 mb-2">Required CSV Format</p>
          <div className="bg-white rounded border border-slate-200 p-3 font-mono text-[11px] text-slate-500 leading-relaxed">
            schemeName,schemeCode,units,investedAmount,date<br />
            "HDFC Index Fund",118531,100.0000,15000.00,2024-01-15<br />
            "SBI Bluechip Fund",118839,50.0000,10000.00,2024-02-01
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
