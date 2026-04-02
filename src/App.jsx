import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Printer, FileText, Sun, Moon, Loader2, Type, Maximize, 
  Sparkles, Menu, ChevronLeft, LayoutPanelLeft, AlignJustify, 
  Info, Settings2, Table2, Edit3, Eye, AlertCircle, CheckCircle2, Lightbulb, ArrowUp,
  HelpCircle, X, Plus, Minus, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import Prism from 'prismjs';

// PrismJS 테마 및 언어 지원
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-typescript';



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

  const [htmlPages, setHtmlPages] = useState([""]);
  const [padding, setPadding] = useState(11); 
  const [fontSize, setFontSize] = useState(13);
  const [tableFontSize, setTableFontSize] = useState(13);
  const [tableLayout, setTableLayout] = useState("auto");
  const [zoom, setZoom] = useState(100);
  const [markdownStyle, setMarkdownStyle] = useState('github'); // 'github' | 'obsidian'
  const [firstColNowrap, setFirstColNowrap] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isPageMode = markdown.includes('[[페이지 나누기]]'); 


  const [isEditMode, setIsEditMode] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [status, setStatus] = useState("ready"); // npm으로 설치된 라이브러리 사용하므로 기본값을 ready로 설정
  const fileInputRef = useRef(null);


  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  const insertPageBreak = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const currentScrollTop = editorRef.current.scrollTop;
      
      const injection = '\n\n[[페이지 나누기]]\n\n';
      const newMarkdown = markdown.substring(0, start) + injection + markdown.substring(end);
      setMarkdown(newMarkdown);
      
      // 상태 업데이트 후 커서 및 스크롤 위치 복원
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + injection.length;
          editorRef.current.scrollTop = currentScrollTop;
        }
      }, 0);
    } else {
      setMarkdown(prev => prev + '\n\n[[페이지 나누기]]\n\n');
    }
  };

  const handleEditorScroll = (e) => {
    if (!isEditMode || !previewRef.current) return;
    if (isSyncingLeft.current) {
      isSyncingLeft.current = false;
      return;
    }
    const source = e.target;
    const target = previewRef.current;
    const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
    if (!isNaN(percentage)) {
      isSyncingRight.current = true;
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
    }
  };

  const handlePreviewScroll = (e) => {
    if (!isEditMode || !editorRef.current) return;
    if (isSyncingRight.current) {
      isSyncingRight.current = false;
      return;
    }
    const source = e.target;
    const target = editorRef.current;
    const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
    if (!isNaN(percentage)) {
      isSyncingLeft.current = true;
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
    }
  };

  const scrollToTop = () => {
    if (previewRef.current) {
      previewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (isEditMode && editorRef.current) {
      editorRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // PrismJS 및 marked 확장 설정
  useEffect(() => {
    marked.use(markedHighlight({
      langPrefix: 'language-',
      highlight(code, lang) {
        if (Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
      }
    }), {
      breaks: true,
      gfm: true
    });
  }, []);




  // 마크다운 변환 시 콜아웃 클래스 주입 로직
  useEffect(() => {
    if (status === "ready") {
      try {
        let content = marked.parse(markdown);

        
        // [!TYPE] 문법 파싱 로직 (GitHub/Obsidian 공용 지원)
        content = content.replace(/<blockquote>\s*<p>\[!(\w+)\]/gi, (match, type) => {
          const lowerType = type.toLowerCase();
          return `<blockquote class="callout-${lowerType}">`;
        });
        
        // 기존 한국어 스타일 호환성 유지
        content = content.replace(/<blockquote>\s*<p><strong>안내<\/strong>/g, '<blockquote class="callout-info"><p><strong>안내</strong>');
        content = content.replace(/<blockquote>\s*<p><strong>주의<\/strong>/g, '<blockquote class="callout-warning"><p><strong>주의</strong>');
        content = content.replace(/<blockquote>\s*<p><strong>경고<\/strong>/g, '<blockquote class="callout-danger"><p><strong>경고</strong>');
        content = content.replace(/<blockquote>\s*<p><strong>팁<\/strong>/g, '<blockquote class="callout-success"><p><strong>팁</strong>');
        
        if (isPageMode) {
          // 페이지별 모드: 페이지 나누기 텍스트를 기준으로 HTML을 배열로 나눔
          const pages = content.split(/<p>\s*\[\[페이지 나누기\]\]\s*<\/p>\n?/g);
          setHtmlPages(pages);
        } else {
          // 연속형 모드: [[페이지 나누기]] 텍스트를 제거하고 하나의 페이지로 처리
          const singleContent = content.replace(/<p>\s*\[\[페이지 나누기\]\]\s*<\/p>\n?/g, '');
          setHtmlPages([singleContent]);
        }

      } catch (err) {
        console.error("Parsing error:", err);
      }
    }
  }, [markdown, status, isPageMode]);


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setMarkdown(event.target.result);
    reader.readAsText(file);
  };

  // 한 페이지짜리 긴 PDF로 내보내기 (html2canvas + jsPDF)
  const handleExportSinglePagePDF = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress(10);

    try {
      const element = document.getElementById('capture-area');
      if (!element) throw new Error("Capture area not found");

      // 1. 캡처를 위해 잠시 스타일 조정 (그림자 제거, 테두리 조정 등)
      // html2canvas 옵션 설정
      const canvas = await html2canvas(element, {
        scale: 2, // 고해상도
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('capture-area');
          if (clonedElement) {
            // 캡처용 클론 엘리먼트 스타일 보정
            clonedElement.style.zoom = '1';
            clonedElement.style.transform = 'none';
            // 모든 페이지의 그림자와 마진 제거하여 하나로 잇기
            const pages = clonedElement.querySelectorAll('.paper-preview');
            pages.forEach((page, i) => {
              page.style.boxShadow = 'none';
              page.style.margin = '0';
              page.style.border = 'none';
              if (i < pages.length - 1) {
                page.style.borderBottom = 'none';
              }
            });
          }
        }
      });

      setExportProgress(60);

      const imgData = canvas.toDataURL('image/png');
      
      // PDF 생성
      const imgWidth = 210; // A4 가로 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 이미지 높이에 맞춘 커스텀 사이즈 PDF 생성
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      
      setExportProgress(90);
      pdf.save(`MD_Printer_${new Date().getTime()}.pdf`);
      
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // 지능형 PDF 저장 함수
  const handlePDFSave = () => {
    if (isPageMode) {
      // 페이지 나누기가 설정되어 있으면 표준 인쇄 다이얼로그 호출 (나누기 적용)
      handlePrint();
    } else {
      // 페이지 나누기가 없으면 고해상도 롱 PDF로 저장
      handleExportSinglePagePDF();
    }
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
      minHeight: isPageMode ? '297mm' : 'auto',
      padding: `${padding}mm`,
      fontSize: `${fontSize}px`,
      backgroundColor: isDarkMode ? '#191f28' : '#ffffff',
      color: isDarkMode ? '#e5e8eb' : '#333d4b',
      boxShadow: isPageMode ? '' : 'none',
      marginBottom: isPageMode ? '' : '0'
    };
  };


  return (
    <div className={`min-h-screen flex transition-colors duration-500 print:bg-white print:block print:min-h-0 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f2f4f6]'}`}>
      
      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-6 right-8 z-[100] p-3 rounded-2xl shadow-xl transition-all print:hidden ${
          isSidebarOpen 
            ? 'bg-white border border-slate-200 text-slate-500 hover:text-[#3182f6] hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' 
            : 'bg-[#3182f6] text-white hover:bg-[#1b64da] shadow-blue-500/20'
        }`}
      >
        <LayoutPanelLeft className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside 
        className={`w-80 border-r p-6 fixed h-full z-40 flex flex-col shadow-2xl transition-transform duration-500 ease-in-out ${
          isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}
      >
        <div className="flex items-center gap-3 mb-6 pl-2">
          <div className="bg-[#3182f6] p-2 rounded-xl">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#191f28]'}`}>MD 프린터</h1>
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className={`ml-auto p-2 rounded-xl flex items-center justify-center transition-colors group relative ${isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-400 hover:text-[#3182f6]'}`}
            title="사용방법"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* File Upload Section */}
          <section>
            <button onClick={() => fileInputRef.current.click()} className={`w-full py-4 border-2 border-dashed rounded-[20px] transition-all flex flex-col items-center gap-2 group ${isDarkMode ? 'border-slate-600 hover:border-blue-400 hover:bg-slate-800' : 'border-slate-200 hover:border-[#3182f6] hover:bg-[#f2f4f6]'}`}>
              <Upload className={`w-5 h-5 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>파일 불러오기</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".md" className="hidden" />
          </section>

          {/* Group 1: 비율 설정 */}
          <section className={`p-4 rounded-[20px] space-y-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <label className="text-xs font-bold text-[#3182f6] uppercase tracking-widest flex items-center gap-2 mb-1">
              <Settings2 className="w-4 h-4" /> 비율 설정
            </label>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">페이지 여백</label>
                <span className="text-[#3182f6] font-bold text-xs">{padding}mm</span>
              </div>
              <input type="range" min="5" max="60" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#3182f6]" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">전체 글자 크기</label>
                <span className="text-[#3182f6] font-bold text-xs">{fontSize}px</span>
              </div>
              <input type="range" min="10" max="24" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#3182f6]" />
            </div>
          </section>

           {/* Group 2: 마크다운 스타일 */}
          <section className={`p-4 rounded-[20px] space-y-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <label className="text-xs font-bold text-[#3182f6] uppercase tracking-widest flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4" /> 문서 스타일
            </label>
            <div className="grid grid-cols-2 gap-1 bg-[#e5e8eb] dark:bg-slate-700 p-1 rounded-xl">
              <button 
                onClick={() => setMarkdownStyle('github')} 
                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${markdownStyle === 'github' ? 'bg-white shadow-sm text-[#3182f6]' : 'text-slate-500'}`}
              >
                GitHub
              </button>
              <button 
                onClick={() => setMarkdownStyle('obsidian')} 
                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${markdownStyle === 'obsidian' ? 'bg-white shadow-sm text-[#3182f6]' : 'text-slate-500'}`}
              >
                Obsidian
              </button>
            </div>
          </section>

          {/* Group 3: 표 설정 */}
          <section className={`p-4 rounded-[20px] space-y-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <label className="text-xs font-bold text-[#3182f6] uppercase tracking-widest flex items-center gap-2 mb-1">
              <Table2 className="w-4 h-4" /> 표 설정
            </label>

            <div className="relative group/tooltip">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  표 레이아웃 <Info className="w-3 h-3 text-slate-400 cursor-help" />
                </label>
                <div className="hidden group-hover/tooltip:block absolute bottom-full left-0 mb-2 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl w-60 z-50 leading-relaxed">
                  <p><strong>고정형:</strong> 모든 열을 동일 비율로 나누고 넘치는 글자는 줄바꿈합니다. (안전함)</p>
                  <p className="mt-2"><strong>유연하게:</strong> 내용 길이에 따라 열 너비가 자동 조절됩니다.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-[#e5e8eb] dark:bg-slate-700 p-1 rounded-xl">
                <button onClick={() => setTableLayout('auto')} className={`py-1.5 rounded-lg text-xs font-bold transition-all ${tableLayout === 'auto' ? 'bg-white shadow-sm text-[#3182f6]' : 'text-slate-500'}`}>유연하게</button>
                <button onClick={() => setTableLayout('fixed')} className={`py-1.5 rounded-lg text-xs font-bold transition-all ${tableLayout === 'fixed' ? 'bg-white shadow-sm text-[#3182f6]' : 'text-slate-500'}`}>고정형</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">표 내부 글자</label>
                <span className="text-[#3182f6] font-bold text-xs">{tableFontSize}px</span>
              </div>
              <input type="range" min="10" max="20" value={tableFontSize} onChange={(e) => setTableFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#3182f6]" />
            </div>

            <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-slate-700' : 'bg-white border border-slate-200'}`}>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">첫 열 줄바꿈 방지</span>
              <button onClick={() => setFirstColNowrap(!firstColNowrap)} className={`w-10 h-5 rounded-full transition-all relative ${firstColNowrap ? 'bg-[#3182f6]' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${firstColNowrap ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </section>
        </div>

        {/* Action Bottom */}
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setIsEditMode(!isEditMode)} className={`py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isEditMode ? 'bg-[#3182f6] text-white' : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {isEditMode ? <Eye className="w-4 h-4"/> : <Edit3 className="w-4 h-4"/>}
              {isEditMode ? '미리보기' : '편집 모드'}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'bg-slate-700 text-yellow-400' : 'bg-[#f2f4f6] text-[#4e5968]'}`}>
              {isDarkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
              테마
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            <button 
              onClick={handlePDFSave} 
              disabled={isExporting}
              className={`w-full py-4 rounded-[20px] text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${isExporting ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-[#3182f6] text-white hover:bg-[#1b64da] shadow-blue-500/10'}`}
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              PDF 저장
            </button>
            <button 
              onClick={handlePrint} 
              disabled={status !== "ready" || isExporting} 
              className={`w-full py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50`}
            >
              <Printer className="w-4 h-4" />
              인쇄
            </button>
          </div>
        </div>
      </aside>




      {/* Main Container */}
      <main className={`flex-1 flex flex-col lg:flex-row transition-all duration-500 ease-in-out ${isSidebarOpen ? 'ml-80' : 'ml-0'} print:m-0 print:p-0 print:block`}>
        
        {/* Editor Area */}
        {isEditMode && (
          <div className="flex-1 h-screen p-8 bg-white dark:bg-[#191f28] border-r border-slate-100 dark:border-slate-800 flex flex-col print:hidden">
            <div className="flex items-center justify-between mb-4 text-slate-400">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">문서 편집기</span>
              </div>
              <button 
                onClick={insertPageBreak}
                className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-[#f2f4f6] hover:bg-[#e5e8eb] text-slate-600'}`}
              >
                ✂️ 페이지 나누기 삽입
              </button>
            </div>
            <textarea 
              ref={editorRef}
              value={markdown}
              onScroll={handleEditorScroll}
              onChange={(e) => setMarkdown(e.target.value)}
              className={`flex-1 w-full p-8 rounded-3xl resize-none outline-none font-mono text-sm leading-relaxed transition-colors custom-scrollbar ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-700 border-transparent focus:bg-white focus:border-blue-100 border-2'}`}
              placeholder="마크다운 내용을 입력하십시오..."
            />
          </div>
        )}

        {/* Preview Area */}
        <div 
          ref={previewRef}
          onScroll={handlePreviewScroll}
          className={`flex-1 p-12 overflow-y-auto flex flex-col items-center bg-transparent print:m-0 print:p-0 print:block h-screen print:h-auto print:overflow-visible custom-scrollbar`}
        >
          <style>
            {`
              @media print {
                @page { 
                  size: ${isPageMode ? 'A4 portrait' : 'auto'}; 
                  margin: ${isPageMode ? padding + 'mm' : '0'}; 
                }

                html, body, #root { background: white !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .paper-preview { 
                  box-shadow: none !important; 
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important; 
                  width: 100% !important; 
                  min-height: auto !important;
                  background-color: white !important;
                  color: #191f28 !important;
                  transform: none !important;
                  break-after: ${isPageMode ? 'page' : 'auto'};
                  page-break-after: ${isPageMode ? 'always' : 'auto'};
                  margin-bottom: ${isPageMode ? '' : '0 !important'};
                  /* 연속형 모드에서는 페이지 간 이음새가 없도록 패딩과 마진을 인위적으로 조정 */
                  padding-top: ${isPageMode ? '' : padding + 'mm !important'};
                  padding-bottom: ${isPageMode ? '' : padding + 'mm !important'};
                  padding-left: ${isPageMode ? '' : padding + 'mm !important'};
                  padding-right: ${isPageMode ? '' : padding + 'mm !important'};
                }

                .paper-preview:last-child {
                  break-after: auto;
                  page-break-after: auto;
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
                
                .prose { 
                  page-break-inside: auto;
                  break-inside: auto;
                }
                /* 페이지별 모드에서는 덩어리가 잘리는 것을 방지, 연속형에서는 흐름 중시 */
                .prose blockquote, .prose table, .prose pre {
                  page-break-inside: ${isPageMode ? 'avoid' : 'auto'};
                  break-inside: ${isPageMode ? 'avoid' : 'auto'};
                }
              }




              
              .prose { max-width: 100% !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; transition: color 0.3s ease; }

              .prose h1 { font-size: 2.5em; font-weight: 800; margin-bottom: 0.8em; border-bottom: 2px solid ${isDarkMode ? '#334155' : '#f2f4f6'}; padding-bottom: 0.4em; color: ${isDarkMode ? '#ffffff' : '#191f28'}; }
              .prose h2 { font-size: 1.8em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.6em; color: ${isDarkMode ? '#f8fafc' : '#191f28'}; }
              .prose h3 { font-size: 1.4em; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.4em; color: ${isDarkMode ? '#f1f5f9' : '#333d4b'}; }
              .prose p { margin-bottom: 1.2em; line-height: 1.7; color: ${isDarkMode ? '#94a3b8' : '#4e5968'}; }

              /* 리스트(목록) 스타일 및 체크박스 정렬 */
              .prose ul, .prose ol { margin-top: 0.5em; margin-bottom: 1.5em; padding-left: 1.5em; }
              .prose li { margin-bottom: 0.8em; line-height: 1.7; color: ${isDarkMode ? '#94a3b8' : '#4e5968'}; }
              .prose ul { list-style-type: disc; }
              .prose ol { list-style-type: decimal; }
              .prose li > ul, .prose li > ol { margin-top: 0.5em; margin-bottom: 0; }
              .prose input[type="checkbox"] { width: 1.2em; height: 1.2em; margin-right: 0.5em; margin-left: -1.5em; vertical-align: -2px; accent-color: #3182f6; }
              .prose li:has(input[type="checkbox"]) { list-style-type: none; }

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

              /* 기본 콜아웃 공통 테두리 및 둥글기 */
              .prose blockquote { 
                margin: 1.5em 0;
                padding: ${markdownStyle === 'github' ? '12px 20px' : '20px 24px'};
                background-color: ${isDarkMode ? '#1e293b' : (markdownStyle === 'github' ? 'transparent' : '#f2f4f6')};
                border-radius: ${markdownStyle === 'github' ? '0px' : '16px'};
                border-left: 4px solid #3182f6;
                transition: all 0.3s;
              }
              
              /* [!TYPE] 내부 문구 및 강조 */
              .prose blockquote p:first-child {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 800;
                font-size: ${markdownStyle === 'github' ? '0.9em' : '1em'};
                margin-bottom: 8px;
                text-transform: uppercase;
              }

              /* GitHub 스타일: 테두리만 강조하고 배경은 없거나 옅게 */
              ${markdownStyle === 'github' ? `
                .prose blockquote { border: 1px solid ${isDarkMode ? '#334155' : '#e5e8eb'}; border-left-width: 4px; background: transparent; }
                .prose .callout-note { border-left-color: #3182f6; }
                .prose .callout-tip { border-left-color: #238636; }
                .prose .callout-important { border-left-color: #8957e5; }
                .prose .callout-warning { border-left-color: #d29922; }
                .prose .callout-caution { border-left-color: #da3633; }
                .prose .callout-danger { border-left-color: #da3633; }
                .prose .callout-success { border-left-color: #238636; }
                
                .prose .callout-note p:first-child { color: #3182f6; }
                .prose .callout-tip p:first-child { color: #238636; }
                .prose .callout-important p:first-child { color: #8957e5; }
                .prose .callout-warning p:first-child { color: #d29922; }
                .prose .callout-caution p:first-child { color: #da3633; }
                .prose .callout-danger p:first-child { color: #da3633; }
              ` : `
                /* Obsidian 스타일: 배경색을 충분히 사용 */
                .prose .callout-note { background-color: ${isDarkMode ? 'rgba(49, 130, 246, 0.15)' : 'rgba(49, 130, 246, 0.05)'}; border-left-color: #3182f6; }
                .prose .callout-tip { background-color: ${isDarkMode ? 'rgba(35, 134, 54, 0.15)' : 'rgba(35, 134, 54, 0.05)'}; border-left-color: #238636; }
                .prose .callout-important { background-color: ${isDarkMode ? 'rgba(137, 87, 229, 0.15)' : 'rgba(137, 87, 229, 0.05)'}; border-left-color: #8957e5; }
                .prose .callout-warning { background-color: ${isDarkMode ? 'rgba(210, 153, 34, 0.15)' : 'rgba(210, 153, 34, 0.05)'}; border-left-color: #d29922; }
                .prose .callout-caution, .prose .callout-danger { background-color: ${isDarkMode ? 'rgba(218, 54, 51, 0.15)' : 'rgba(218, 54, 51, 0.05)'}; border-left-color: #da3633; }
                
                .prose blockquote p:first-child { opacity: 0.9; }
              `}
              
              .prose blockquote p { margin-bottom: 0; color: ${isDarkMode ? '#cbd5e1' : '#333d4b'}; font-weight: 400; font-size: 0.95em; }
              .prose blockquote strong { color: inherit; display: inline; margin-bottom: 0; }

              .prose :not(pre) > code { 
                background: ${isDarkMode ? '#1e293b' : '#f2f4f6'}; 
                padding: 3px 6px; 
                border-radius: 6px; 
                font-family: monospace; 
                font-size: 0.85em; 
                color: #3182f6; 
                font-weight: 600; 
              }
              .prose pre { 
                background: #191f28 !important; 
                color: #e2e8f0 !important; 
                padding: 20px 24px; 
                border-radius: 16px; 
                margin: 1.5em 0; 
                overflow-x: auto; 
                border: 1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}; 
              }
              .prose pre code { 
                background: transparent !important; 
                color: inherit !important; 
                padding: 0 !important; 
                font-weight: 400 !important; 
                font-size: 0.9em;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
                line-height: 1.6;
              }
            `}
          </style>

          <div 
            id="capture-area"
            className={`w-full flex flex-col items-center print:gap-0 print:block print:w-full print:bg-white ${isPageMode ? 'gap-12' : 'gap-0'}`} 
            style={{ zoom: `${zoom}%` }}
          >
            {htmlPages.map((pageHtml, index) => (
              <div 
                key={index}
                className={`paper-preview transition-all duration-500 origin-top border relative ${isPageMode ? 'shadow-2xl' : 'shadow-none'}`} 
                style={{
                  ...getPaperStyle(),
                  borderColor: isDarkMode ? '#334155' : '#f2f4f6',
                  borderBottomWidth: isPageMode ? '1px' : (index === htmlPages.length - 1 ? '1px' : '0')
                }}
              >

                {htmlPages.length > 1 && (
                  <div className="absolute -left-12 top-6 w-8 text-center text-xs font-bold text-slate-400 print:hidden">
                    {index + 1}
                  </div>
                )}
                <div className="prose" dangerouslySetInnerHTML={{ __html: pageHtml }} />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-center gap-4 print:hidden">
        {/* Zoom Controls */}
        {!isEditMode && (
          <>
            <div className={`flex flex-col items-center p-1.5 rounded-full shadow-xl backdrop-blur-md ${isDarkMode ? 'bg-slate-800/90 border border-slate-700' : 'bg-white/90 border border-slate-200'}`}>
              <button onClick={() => setZoom(p => Math.min(p + 10, 200))} className={`p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-[#3182f6]'}`} title="확대">
                <Plus className="w-5 h-5" />
              </button>
              <button onClick={() => setZoom(100)} className={`py-1 text-[11px] font-bold w-full text-center transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-[#3182f6]'}`} title="기본 크기로">
                {zoom}%
              </button>
              <button onClick={() => setZoom(p => Math.max(p - 10, 30))} className={`p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-[#3182f6]'}`} title="축소">
                <Minus className="w-5 h-5" />
              </button>
            </div>

            {/* PDF & Print Actions */}
            <div className={`flex flex-col items-center p-1.5 rounded-full shadow-xl backdrop-blur-md ${isDarkMode ? 'bg-slate-800/90 border border-slate-700' : 'bg-white/90 border border-slate-200'}`}>
              <button onClick={handlePDFSave} className={`p-3 rounded-full transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-[#3182f6]'}`} title="PDF 저장">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => handlePrint()} className={`p-3 rounded-full transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-[#3182f6]'}`} title="인쇄">
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </>
        )}



        {/* Scroll to Top FAB */}
        <button
          onClick={scrollToTop}
          className={`w-14 h-14 rounded-full shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all flex items-center justify-center print:hidden ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-[#3182f6] text-white hover:bg-[#1b64da] shadow-blue-500/30'}`}
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden" onClick={() => setIsHelpModalOpen(false)}>
          <div className={`w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col transform transition-all ${isDarkMode ? 'bg-[#1e293b] border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#191f28]'}`}>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-[#3182f6]" />
                </div>
                사용 방법 안내
              </h2>
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-[#191f28]'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`p-6 overflow-y-auto max-h-[70vh] space-y-6 flex-1 custom-scrollbar ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              
              <section className="space-y-3">
                <h3 className={`font-bold text-base flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  <span className="bg-[#3182f6] text-white w-5 h-5 rounded-full inline-flex justify-center items-center text-xs">1</span>
                  페이지 나누기 사용법
                </h3>
                <div className={`p-4 rounded-[16px] leading-relaxed text-sm ${isDarkMode ? 'bg-slate-800/80 border border-slate-700' : 'bg-[#f2f4f6]'}`}>
                  <p>편집기 우측 상단의 <strong className="text-[#3182f6] px-1 bg-white dark:bg-slate-700 rounded shadow-sm">✂️ 페이지 나누기 삽입</strong> 버튼을 누르면 커서 위치에 <code className="bg-slate-200 dark:bg-[#0f172a] px-1.5 py-0.5 rounded text-sm text-[#3182f6] dark:text-blue-400 font-mono">[[페이지 나누기]]</code> 텍스트가 들어갑니다.</p>
                  <p className="mt-3 text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-700">이 텍스트를 기준으로 인쇄 및 PDF 저장 시 <strong>새로운 페이지</strong>로 나뉘어 깔끔하게 출력됩니다.</p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className={`font-bold text-base flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  <span className="bg-[#3182f6] text-white w-5 h-5 rounded-full inline-flex justify-center items-center text-xs">2</span>
                  출력 인쇄 오류 해결 방법 <span className="text-[10px] ml-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">중요</span>
                </h3>
                <div className={`p-4 rounded-[16px] leading-relaxed text-sm border-l-4 border-yellow-400 ${isDarkMode ? 'bg-yellow-950/20' : 'bg-yellow-50/80'}`}>
                  <p className="flex items-start gap-2">
                    <span className="text-xl">⚠️</span> 
                    <strong className="text-yellow-700 dark:text-yellow-500 font-bold">인쇄 버튼을 눌렀을 때 페이지가 잘리거나 여백이 이상한가요?</strong>
                  </p>
                  <ul className="mt-4 space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex gap-2">
                      <span className="text-[#3182f6]">•</span>
                      <span>좌측 메뉴의 <strong>'비율 설정'</strong>에서 <strong>'페이지 여백'</strong>을 적절히 조절해보세요.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#3182f6]">•</span>
                      <span>크롬(Chrome) 등 브라우저 인쇄 설정에서 <strong>'배경 그래픽'</strong> 속성이 꼭 켜져 있어야 색상이 정상 출력됩니다.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#3182f6]">•</span>
                      <span>브라우저 인쇄 설정의 용지 크기가 <strong>A4</strong>로 설정되어 있는지 확인하세요.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#3182f6]">•</span>
                      <span>표가 너무 넓어 짤린다면 왼쪽 표 설정에서 <strong>'고정형'</strong> 레이아웃을 선택하세요.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className={`font-bold text-base flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  <span className="bg-[#3182f6] text-white w-5 h-5 rounded-full inline-flex justify-center items-center text-xs">3</span>
                  양방향 스크롤 동기화
                </h3>
                <div className={`p-4 rounded-[16px] leading-relaxed text-sm ${isDarkMode ? 'bg-slate-800/80 border border-slate-700' : 'bg-[#f2f4f6]'}`}>
                  <p>편집 모드에서 좌측 마크다운 에디터를 스크롤하면 우측 미리보기 화면도 자동으로 같은 위치를 보여줍니다. 스크롤 위치를 서로 동기화하여 긴 문서도 쉽게 파악할 수 있습니다.</p>
                </div>
              </section>

            </div>
            <div className={`px-6 py-4 border-t flex justify-end ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="px-6 py-2.5 bg-[#3182f6] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-[#1b64da] transition-all active:scale-95"
              >
                확인했어요
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Export Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[200] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-[#3182f6] transition-all duration-300 ease-out"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse">
            고화질 PDF 생성 중... ({exportProgress}%)
          </p>
          <p className="text-xs text-slate-400 mt-2">잠시만 기다려 주세요.</p>
        </div>
      )}
    </div>
  );
};


export default App;
