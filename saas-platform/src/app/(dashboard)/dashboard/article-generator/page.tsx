"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { 
  FileText, Sparkles, Copy, Loader2, RefreshCcw, Wand2, 
  ChevronDown, Eye, Code, Check, CheckCircle2
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// --- CUSTOM SELECT COMPONENT ---
interface CustomSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

const CustomSelect = ({ label, value, options, onChange }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || value;

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left bg-slate-900/50 border rounded-xl flex items-center justify-between transition-all group ${
          isOpen ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <span className="text-white text-sm truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-violet-400' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0B0F19] border border-slate-800 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  option.value === value 
                    ? 'bg-violet-600/10 text-violet-400' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {option.label}
                {option.value === value && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
interface FormData {
  topic: string;
  role: string;
  style: string;
  tone: string;
  audience: string;
  format: string;
  length: string;
}

export default function ArticleGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    topic: "",
    role: "Content Writer",
    style: "Descriptive",
    tone: "Professional",
    audience: "General Reader",
    format: "markdown",
    length: "~500 words",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setViewMode("preview"); 

    try {
      const response = await axios.post('/api/generate', formData);
      setResult(response.data.result);
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper để làm sạch code fence (```html) trước khi đưa vào iframe
  const getCleanHtml = (content: string) => {
     // Loại bỏ dòng ```html ở đầu và ``` ở cuối nếu có
     return content.replace(/^```html\s*/i, "").replace(/```\s*$/, "");
  };

  const inputClass = "w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder:text-slate-600 text-sm transition-all";
  const labelClass = "text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block";

  return (
    <div className="max-w-[1600px] mx-auto p-4 h-screen flex flex-col gap-4 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0 h-16 px-2">
        <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/10">
          <Wand2 className="w-6 h-6 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Article Generator</h1>
          <p className="text-slate-400 text-sm">Craft perfectly structured content with precise controls.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: INPUT */}
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
            <div className="p-6 h-full flex flex-col justify-center">
              <form onSubmit={handleGenerate} className="flex flex-col gap-5 h-full justify-center">
                
                {/* 1. Topic */}
                <div className="space-y-1">
                  <label className={labelClass}>Topic / Title</label>
                  <input 
                    name="topic"
                    required
                    value={formData.topic}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="e.g. The future of AI in Finance"
                  />
                </div>

                {/* Grid inputs */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  {/* ... Các field text khác giữ nguyên ... */}
                  <div className="space-y-1">
                    <label className={labelClass}>Role</label>
                    <input name="role" value={formData.role} onChange={handleInputChange} className={inputClass} placeholder="e.g. Expert"/>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Audience</label>
                    <input name="audience" value={formData.audience} onChange={handleInputChange} className={inputClass} placeholder="e.g. Beginners"/>
                  </div>

                  <CustomSelect 
                    label="Tone"
                    value={formData.tone}
                    onChange={(val) => handleSelectChange("tone", val)}
                    options={[
                      { label: "Professional", value: "Professional" },
                      { label: "Casual", value: "Casual" },
                      { label: "Enthusiastic", value: "Enthusiastic" },
                      { label: "Witty", value: "Witty" },
                      { label: "Serious", value: "Serious" },
                    ]}
                  />

                  <CustomSelect 
                    label="Style"
                    value={formData.style}
                    onChange={(val) => handleSelectChange("style", val)}
                    options={[
                      { label: "Descriptive", value: "Descriptive" },
                      { label: "Persuasive", value: "Persuasive" },
                      { label: "Narrative", value: "Narrative" },
                      { label: "Technical", value: "Technical" },
                    ]}
                  />

                   <CustomSelect 
                    label="Length"
                    value={formData.length}
                    onChange={(val) => handleSelectChange("length", val)}
                    options={[
                      { label: "Short", value: "~200 words" },
                      { label: "Medium", value: "~500 words" },
                      { label: "Long", value: "~1000 words" },
                    ]}
                  />

                  <CustomSelect 
                    label="Format"
                    value={formData.format}
                    onChange={(val) => handleSelectChange("format", val)}
                    options={[
                      { label: "Markdown", value: "markdown" },
                      { label: "HTML", value: "html" },
                      { label: "Plain Text", value: "plain text" },
                    ]}
                  />
                </div>

                <div className="pt-4 mt-auto">
                  <button 
                    disabled={isLoading}
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Generate Content
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
        </div>

        {/* RIGHT COLUMN: OUTPUT */}
        <div className="h-full rounded-3xl border border-slate-800 bg-slate-950/30 backdrop-blur-md relative overflow-hidden flex flex-col shadow-2xl group">
          
          {!result && !isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                <div className="p-6 rounded-full bg-slate-900/50 border border-slate-800 mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <FileText className="w-12 h-12 opacity-40" />
                </div>
                <p className="font-medium text-lg text-slate-500">Ready to create masterpieces</p>
             </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 backdrop-blur-sm z-20 transition-all">
              <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
                  <div className="absolute top-0 w-16 h-16 border-4 border-violet-500/50 border-t-violet-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-violet-400 animate-pulse font-medium tracking-wide">AI is thinking...</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0 backdrop-blur-md">
                <div className="flex bg-slate-950/50 p-1 rounded-lg border border-slate-800/50">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "preview" 
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "code" 
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> Raw Code
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                      onClick={() => setResult("")}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Clear">
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors text-xs font-medium border border-transparent hover:border-slate-700" title="Copy Raw">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Raw"}
                  </button>
                </div>
              </div>
              
              {/* Content Area */}
              <div className={`flex-1 ${formData.format !== "html" || viewMode === "code" ? "p-8 overflow-y-auto custom-scrollbar bg-slate-950/20" : "bg-white"}`}>
                {viewMode === "preview" ? (
                  <>
                    {/* TRƯỜNG HỢP 1: HTML FORMAT -> DÙNG IFRAME ĐỂ CÁCH LY STYLE */}
                    {formData.format === "html" ? (
                       <iframe
                         srcDoc={getCleanHtml(result)}
                         className="w-full h-full border-0 rounded-b-3xl"
                         title="HTML Preview"
                         sandbox="allow-scripts" // Cho phép script cơ bản (nếu AI gen JS) nhưng chặn tương tác cha
                       />
                    ) : formData.format === "markdown" ? (
                       // TRƯỜNG HỢP 2: MARKDOWN -> DÙNG REACT-MARKDOWN ĐỂ STYLE ĐẸP
                       <div className="prose prose-invert prose-violet max-w-none">
                         <ReactMarkdown
                           components={{
                             h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6 border-b border-slate-700 pb-2" {...props} />,
                             h2: ({node, ...props}) => <h2 className="text-xl font-bold text-violet-300 mb-3 mt-5" {...props} />,
                             h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-violet-200 mb-2 mt-4" {...props} />,
                             p: ({node, ...props}) => <p className="mb-4 leading-7 text-slate-300" {...props} />,
                             ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1 text-slate-300 ml-2" {...props} />,
                             ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-300 ml-2" {...props} />,
                             li: ({node, ...props}) => <li className="pl-1" {...props} />,
                             code: ({node, ...props}) => <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-200 font-mono text-sm" {...props} />,
                             blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-violet-500 pl-4 italic text-slate-400 my-4 bg-slate-900/30 p-2 rounded-r" {...props} />,
                             strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                           }}
                         >
                           {result}
                         </ReactMarkdown>
                       </div>
                    ) : (
                       // TRƯỜNG HỢP 3: PLAIN TEXT
                       <p className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">{result}</p>
                    )}
                  </>
                ) : (
                  // RAW CODE VIEW
                  <pre className="whitespace-pre-wrap font-mono text-sm text-slate-400 leading-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                    {result}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}