import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Loader2, Download, BrainCircuit, Activity } from 'lucide-react';

interface LogAnalyzerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogAnalyzerModal({ isOpen, onClose }: LogAnalyzerModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
            setError('Please upload a .csv or .txt file');
            return;
        }
        setFile(f);
        setError('');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        setAnalysis('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const resp = await fetch('/api/simulation/analyze-log', {
                method: 'POST',
                body: formData,
            });
            if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
            const data = await resp.json();
            setAnalysis(data.analysis);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze log');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadLog = async () => {
        try {
            const resp = await fetch('/api/simulation/download-log');
            if (!resp.ok) throw new Error('No log file available yet');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'narrations_log.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-2xl max-h-[85vh] mx-4 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-[#0D1117] to-[#161B22] shadow-2xl shadow-violet-500/10 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner">
                            <BrainCircuit className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">AI Analysis Engine</h2>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Synthesizing macro-economic trends from simulation state</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                    {/* Download current log button */}
                    <button
                        onClick={handleDownloadLog}
                        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/20 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Download Current Narration Log
                    </button>

                    {/* Upload Zone */}
                    {!analysis && (
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragOver
                                ? 'border-violet-400 bg-violet-500/10'
                                : file
                                    ? 'border-emerald-500/40 bg-emerald-500/5'
                                    : 'border-white/10 hover:border-violet-500/30 hover:bg-white/5'
                                }`}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".csv,.txt"
                                className="hidden"
                                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileText className="w-10 h-10 text-emerald-400" />
                                    <span className="text-sm text-emerald-300 font-mono font-bold">{file.name}</span>
                                    <span className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · Click to change</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-10 h-10 text-slate-500" />
                                    <span className="text-sm text-slate-300">Drop <strong>narrations_log.csv</strong> here</span>
                                    <span className="text-[10px] text-slate-500">or click to browse</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                            {error}
                        </div>
                    )}

                    {/* Analyze Button */}
                    {file && !analysis && (
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-sm tracking-wide hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    Synthesizing data stream...
                                </>
                            ) : (
                                <>
                                    <Activity className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                    Generate Executive Summary
                                </>
                            )}
                        </button>
                    )}

                    {/* Analysis Result */}
                    {analysis && (
                        <div className="mt-2 space-y-4">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-[11px] font-bold text-indigo-300 font-mono uppercase tracking-widest">Synthesis Complete</h3>
                                <span className="ml-auto text-[9px] font-mono text-slate-500 bg-black/40 border border-white/5 px-2 py-0.5 rounded-full">Model: llama-3.3-70b</span>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none px-2">
                                {analysis.split('\n').map((line, i) => {
                                    if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-indigo-300 font-mono tracking-wide uppercase mt-6 mb-3 border-l-2 border-indigo-500 pl-3">{line.replace('## ', '')}</h2>;
                                    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-slate-200 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                                    if (line.startsWith('- **')) return <p key={i} className="text-sm text-slate-300 ml-3 mb-1" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />;
                                    if (line.startsWith('- ')) return <p key={i} className="text-sm text-slate-300 ml-3 mb-1">• {line.replace('- ', '')}</p>;
                                    if (line.trim() === '') return <br key={i} />;
                                    return <p key={i} className="text-[13px] text-slate-300 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-medium">$1</strong>') }} />;
                                })}
                            </div>
                            <button
                                onClick={() => { setAnalysis(''); setFile(null); }}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-mono hover:bg-white/10 transition-all"
                            >
                                Analyze Another Log
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
