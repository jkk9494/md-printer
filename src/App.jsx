import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Printer, FileText, Sun, Moon, Loader2, Type, Maximize, 
  Sparkles, Menu, ChevronLeft, LayoutPanelLeft, AlignJustify, 
  Info, Settings2, Table2, Edit3, Eye, AlertCircle, CheckCircle2, Lightbulb
} from 'lucide-react';

const App = () => {
  const [markdown, setMarkdown] = useState(`# MD 프린터 사용 설명서

본 문서는 MD 프린터의 주요 기능과 사용 방법을 안내하기 위해 작성되었습니다.

### 1. 서비스 개요
MD 프린터는 마크다운 문서를 PDF로 변환하거나 출력할 때 최적의 가독성을 제공하는 토스 스타일의 문서 변환 도구입니다.

### 2. 다양한 콜아웃 활용
문서의 가독성을 높이기 위해 다음과 같은 콜아웃 스타일을 지원합니다.

> **안내**
> 일반적인 정보를 전달할 때 사용합니다. 부드러운 푸른색 배경이 적용됩니다.

> **주의**
> 사용자에게 주의가 필요한 사항을 전달할 때 사용합니다. 노란색 테두리와 배경이 적용됩니다.

> **경고**
> 치명적인 오류나 금지 사항을 안내할 때 사용합니다. 붉은색 스타일이 적용됩니다.

> **팁**
> 유용한 추가 정보를 제공할 때 사용합니다. 녹색 스타일이 적용됩니다.

### 3. 데이터 명세서 예시
| 항목 | 기능 | 지원 여부 | 비고 |
| :--- | :--- | :--- | :--- |
| 실시간 편집 | WYSIWYG 편집 지원 | 지원 | 왼쪽 편집 창 활용 |
| 표 레이아웃 | 고정형/유연하게 선택 | 지원 | 넘침 방지 가능 |
| 다크 모드 | 전체 테마 연동 | 지원 | 콘텐츠 포함 |

\`\`\`javascript
// 인쇄 및 PDF 저장 시 배경 그래픽을 반드시 포함하십시오.
window.print();
\`\`\``);

  const [html, setHtml] = useState("");
  const [padding, setPadding] = useState(25); 
  const [fontSize, setFontSize] = useState(16);
  const [tableFontSize, setTableFontSize] = useState(14);
  const [tableLayout, setTableLayout] = useState("fixed");
  const [firstColNowrap, setFirstColNowrap] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [status, setStatus] = useState("loading");
  const fileInputRef = useRef(null);

  // marked 라이브러리 로드
  useEffect(() => {
    const loadLibrary = () => {
      if (window.marked) {
        setStatus("ready");
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js';
      script.async = true;
      script.onload = () => {
        if (window.marked) setStatus("ready");
        else setStatus("error");
      };
      script.onerror = () => setStatus("error");
      document.head.appendChild(script);
    };
    loadLibrary();
  }, []);

  // 마크다운 변환 시 콜아웃 클래스 주입 로직
  useEffect(() => {
    if (status === "ready" && window.marked) {
      try {
        let content = window.marked.parse(markdown);
        
        // 특정 키워드에 따른 콜아웃 클래스 변환 (간이 구현)
        content = content.replace(/<blockquote>\s*<p><strong>안내<\/strong>/g, '<blockquote class="callout-info"><p><strong>안내</strong>');
        content = content.replace(/<blockquote>\s*<p><strong>주의<\/strong>/g, '<blockquote class="callout-warning"><p><strong>주의</strong>');
        content = content.replace(/<blockquote>\s*<p><strong>경고<\/strong>/g, '<blockquote class="callout-danger"><p><strong>경고</strong>');
        content = content.replace(/<blockquote>\s*<p><strong>팁<\/strong>/g, '<blockquote class="callout-success"><p><strong>팁</strong>');
        
        setHtml(content);
      } catch (err) {
        console.error("Parsing error:", err);
      }
    }
  }, [markdown, status]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setMarkdown(event.target.result);
    reader.readAsText(file);
  };

  const handlePrint = () => {
    // Canvas 환경에서는 직접 호출이 제한될 수 있으므로 사용자 가이드 제공
    try {
      window.print();
    } catch (e) {
      console.error("Print feature is restricted in this environment.");
    }
  };

  const getPaperStyle = () => {
    return {
      width: '210mm',
      minHeight: '297mm',
      padding: `${padding}mm`,
      fontSize: `${fontSize}px`,
      backgroundColor: isDarkMode ? '#191f28' : '#ffffff',
      color: isDarkMode ? '#e5e8eb' : '#333d4b'
    };
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f2f4f6]'}`}>
      
      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-6 left-6 z-50 p-3 rounded-2xl shadow-xl transition-all print:hidden ${
          isSidebarOpen 
            ? 'bg-transparent text-slate-400 hover:text-slate-600' 
            : 'bg-[#3182f6] text-white hover:bg-[#1b64da]'
        }`}
      >
        {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`w-80 border-r p-8 fixed h-full z-40 flex flex-col shadow-2xl transition-transform duration-500 ease-in-out ${
          isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}
      >
        <div className="flex items-center gap-3 mb-8 pl-10">
          <div className="bg-[#3182f6] p-2 rounded-xl">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#191f28]'}`}>MD 프린터</h1>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* File Upload Section */}
          <section>
            <button onClick={() => fileInputRef.current.click()} className={`w-full py-5 border-2 border-dashed rounded-[24px] transition-all flex flex-col items-center gap-2 group ${isDarkMode ? 'border-slate-600 hover:border-blue-400 hover:bg-slate-800' : 'border-slate-200 hover:border-[#3182f6] hover:bg-[#f2f4f6]'}`}>
              <Upload className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>파일 불러오기</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".md" className="hidden" />
          </section>

          {/* Group 1: 비율 설정 */}
          <section className={`p-5 rounded-[24px] space-y-5 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <label className="text-[10px] font-bold text-[#3182f6] uppercase tracking-widest flex items-center gap-2 mb-2">
              <Settings2 className="w-3 h-3" /> 비율 설정
            </label>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">페이지 여백</label>
                <span className="text-[#3182f6] font-bold text-[10px]">{padding}mm</span>
              </div>
              <input type="range" min="5" max="60" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#3182f6]" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">전체 글자 크기</label>
                <span className="text-[#3182f6] font-bold text-[10px]">{fontSize}px</span>
              </div>
              <input type="range" min="12" max="24" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#3182f6]" />
            </div>
          </section>

          {/* Group 2: 표 설정 */}
          <section className={`p-5 rounded-[24px] space-y-5 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <label className="text-[10px] font-bold text-[#3182f6] uppercase tracking-widest flex items-center gap-2 mb-2">
              <Table2 className="w-3 h-3" /> 표 설정
            </label>

            <div className="relative group/tooltip">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  표 레이아웃 <Info className="w-3 h-3 text-slate-300 cursor-help" />
                </label>
                <div className="hidden group-hover/tooltip:block absolute bottom-full left-0 mb-2 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl w-64 z-50 leading-relaxed">
                  <p><strong>고정형:</strong> 모든 열을 동일 비율로 나누고 넘치는 글자는 줄바꿈합니다. (가장 안전한 설정)</p>
                  <p className="mt-2"><strong>유연하게:</strong> 내용의 길이에 따라 열 너비가 자동으로 조절됩니다.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-[#e5e8eb] dark:bg-slate-700 p-1 rounded-xl">
                <button onClick={() => setTableLayout('fixed')} className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${tableLayout === 'fixed' ? 'bg-white shadow-sm text-[#3182f6]' : 'text-slate-500'}`}>고정형</button>
                <button onClick={() => setTableLayout('auto')} className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${tableLayout === 'auto' ? 'bg-white shadow-sm text-[#3182f6]' : 'text-slate-500'}`}>유연하게</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">표 내부 글자</label>
                <span className="text-[#3182f6] font-bold text-[10px]">{tableFontSize}px</span>
              </div>
              <input type="range" min="10" max="20" value={tableFontSize} onChange={(e) => setTableFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#3182f6]" />
            </div>

            <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-slate-700' : 'bg-white border border-slate-200'}`}>
              <span className="text-[11px] font-bold text-slate-500">첫 열 줄바꿈 방지</span>
              <button onClick={() => setFirstColNowrap(!firstColNowrap)} className={`w-10 h-5 rounded-full transition-all relative ${firstColNowrap ? 'bg-[#3182f6]' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${firstColNowrap ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </section>
        </div>

        {/* Action Bottom */}
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setIsEditMode(!isEditMode)} className={`py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${isEditMode ? 'bg-[#3182f6] text-white' : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {isEditMode ? <Eye className="w-4 h-4"/> : <Edit3 className="w-4 h-4"/>}
              {isEditMode ? '미리보기' : '편집 모드'}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'bg-slate-700 text-yellow-400' : 'bg-[#f2f4f6] text-[#4e5968]'}`}>
              {isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
              테마
            </button>
          </div>
          <button onClick={handlePrint} disabled={status !== "ready"} className="w-full py-4 bg-[#3182f6] text-white rounded-[20px] font-bold shadow-xl shadow-blue-500/10 hover:bg-[#1b64da] transition-all flex items-center justify-center gap-2 active:scale-95">
            {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            인쇄 및 PDF 저장
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className={`flex-1 flex flex-col lg:flex-row transition-all duration-500 ease-in-out ${isSidebarOpen ? 'ml-80' : 'ml-0'} print:m-0 print:p-0 print:block`}>
        
        {/* Editor Area */}
        {isEditMode && (
          <div className="flex-1 h-screen p-8 bg-white dark:bg-[#191f28] border-r border-slate-100 dark:border-slate-800 flex flex-col print:hidden">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <Edit3 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">문서 편집기</span>
            </div>
            <textarea 
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className={`flex-1 w-full p-8 rounded-3xl resize-none outline-none font-mono text-sm leading-relaxed transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-700 border-transparent focus:bg-white focus:border-blue-100 border-2'}`}
              placeholder="마크다운 내용을 입력하십시오..."
            />
          </div>
        )}

        {/* Preview Area */}
        <div className={`flex-1 p-12 overflow-auto flex justify-center bg-transparent print:m-0 print:p-0 print:block ${isEditMode ? 'max-h-screen' : ''}`}>
          <style>
            {`
              @media print {
                @page { size: A4 portrait; margin: 0; }
                body { background: white !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .paper-preview { 
                  box-shadow: none !important; 
                  margin: 0 !important; 
                  border: none !important; 
                  width: 210mm !important; 
                  min-height: 297mm !important;
                  background-color: white !important;
                  color: #191f28 !important;
                  transform: none !important;
                }
                aside, button, textarea, .print-hidden { display: none !important; }
                main { margin: 0 !important; padding: 0 !important; display: block !important; width: 100% !important; }
                .prose { color: #191f28 !important; }
                .prose h1, .prose h2, .prose h3, .prose p, .prose th, .prose td { color: #191f28 !important; }
                .prose blockquote { background-color: #f2f4f6 !important; border: none !important; }
                .prose .callout-warning { background-color: #fff9db !important; }
                .prose .callout-danger { background-color: #fff5f5 !important; }
                .prose .callout-success { background-color: #f4fce3 !important; }
                .prose code { background-color: #f2f4f6 !important; }
                .prose pre { background-color: #191f28 !important; color: white !important; }
              }
              
              .prose { max-width: 100% !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; transition: color 0.3s ease; }
              .prose h1 { font-size: 2.5em; font-weight: 800; margin-bottom: 0.8em; border-bottom: 2px solid ${isDarkMode ? '#334155' : '#f2f4f6'}; padding-bottom: 0.4em; color: ${isDarkMode ? '#ffffff' : '#191f28'}; }
              .prose h2 { font-size: 1.8em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.6em; color: ${isDarkMode ? '#f8fafc' : '#191f28'}; }
              .prose h3 { font-size: 1.4em; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.4em; color: ${isDarkMode ? '#f1f5f9' : '#333d4b'}; }
              .prose p { margin-bottom: 1.2em; line-height: 1.7; color: ${isDarkMode ? '#94a3b8' : '#4e5968'}; }

              .prose table { 
                width: 100% !important;
                table-layout: ${tableLayout} !important;
                border-collapse: separate;
                border-spacing: 0;
                margin: 2em 0;
                border-radius: 16px;
                overflow: hidden;
                border: 1px solid ${isDarkMode ? '#334155' : '#f2f4f6'};
                font-size: ${tableFontSize}px !important;
              }
              .prose th, .prose td { 
                padding: 14px 18px; 
                text-align: left; 
                border-bottom: 1px solid ${isDarkMode ? '#334155' : '#f2f4f6'};
                word-break: break-all;
              }
              .prose th { background: ${isDarkMode ? '#1e293b' : '#fafafa'}; font-weight: 700; color: ${isDarkMode ? '#cbd5e1' : '#4e5968'}; border-bottom: 2px solid ${isDarkMode ? '#334155' : '#f2f4f6'}; }
              .prose tr td:first-child {
                font-weight: 700;
                color: ${isDarkMode ? '#f8fafc' : '#191f28'};
                background-color: ${isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#fcfdfe'};
                white-space: ${firstColNowrap ? 'nowrap' : 'normal'};
                width: ${tableLayout === 'fixed' ? '25%' : 'auto'};
              }

              /* 기본 콜아웃 (안내) */
              .prose blockquote { 
                margin: 1.5em 0;
                padding: 24px 30px;
                background-color: ${isDarkMode ? '#1e293b' : '#f2f4f6'};
                border-radius: 20px;
                border: none;
              }
              
              /* 특수 콜아웃 스타일 */
              .prose .callout-warning { background-color: ${isDarkMode ? '#453008' : '#fff9db'}; border-left: 6px solid #fab005; border-radius: 12px 20px 20px 12px; }
              .prose .callout-danger { background-color: ${isDarkMode ? '#4c1d1d' : '#fff5f5'}; border-left: 6px solid #fa5252; border-radius: 12px 20px 20px 12px; }
              .prose .callout-success { background-color: ${isDarkMode ? '#1e3a1e' : '#f4fce3'}; border-left: 6px solid #82c91e; border-radius: 12px 20px 20px 12px; }
              
              .prose blockquote p { margin: 0; color: ${isDarkMode ? '#cbd5e1' : '#333d4b'}; font-weight: 500; font-size: 0.95em; }
              .prose blockquote strong { color: #3182f6; display: block; margin-bottom: 6px; font-size: 1.1em; }
              .prose .callout-warning strong { color: #fab005; }
              .prose .callout-danger strong { color: #fa5252; }
              .prose .callout-success strong { color: #82c91e; }

              .prose code { background: ${isDarkMode ? '#1e293b' : '#f2f4f6'}; padding: 3px 8px; border-radius: 8px; font-family: monospace; font-size: 0.85em; color: #3182f6; font-weight: 600; }
              .prose pre { background: #191f28; color: #f9fafb; padding: 24px; border-radius: 24px; margin: 1.5em 0; overflow-x: auto; border: 1px solid #334155; }
            `}
          </style>

          <div 
            className="paper-preview transition-all duration-500 origin-top mb-20 border shadow-2xl" 
            style={{
              ...getPaperStyle(),
              borderColor: isDarkMode ? '#334155' : '#f2f4f6'
            }}
          >
            <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
