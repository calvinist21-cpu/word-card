/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Sparkles, 
  Type, 
  Palette, 
  Church, 
  User, 
  Quote,
  Loader2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import * as htmlToImage from 'html-to-image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type FontSize = 'small' | 'medium' | 'large';
type FontStyle = 'serif' | 'calligraphy';

interface Theme {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  previewColor: string;
}

const THEMES: Theme[] = [
  { 
    id: 'warm', 
    name: '따뜻한 페이지', 
    bgClass: 'bg-[#FDF6E3]', 
    textClass: 'text-[#5C4033]', 
    accentClass: 'border-[#D4A373]',
    previewColor: '#FDF6E3'
  },
  { 
    id: 'green', 
    name: '부드러운 초록', 
    bgClass: 'bg-[#E8F3E8]', 
    textClass: 'text-[#2D4F2D]', 
    accentClass: 'border-[#8DAA8D]',
    previewColor: '#E8F3E8'
  },
  { 
    id: 'rose', 
    name: '안개 낀 장미', 
    bgClass: 'bg-[#FFF0F5]', 
    textClass: 'text-[#8B4B62]', 
    accentClass: 'border-[#DDA0DD]',
    previewColor: '#FFF0F5'
  },
  { 
    id: 'blue', 
    name: '차분한 파랑', 
    bgClass: 'bg-[#F0F8FF]', 
    textClass: 'text-[#2F4F4F]', 
    accentClass: 'border-[#B0C4DE]',
    previewColor: '#F0F8FF'
  },
  { 
    id: 'hanji', 
    name: '한지 느낌', 
    bgClass: 'bg-[#F4F1EA] bg-[url("https://www.transparenttextures.com/patterns/paper-fibers.png")]', 
    textClass: 'text-[#3E3E3E]', 
    accentClass: 'border-[#A69F88]',
    previewColor: '#F4F1EA'
  },
];

const FONT_SIZES: Record<FontSize, string> = {
  small: 'text-xl md:text-2xl',
  medium: 'text-2xl md:text-4xl',
  large: 'text-3xl md:text-5xl',
};

const FONT_STYLES: Record<FontStyle, string> = {
  serif: 'font-serif',
  calligraphy: 'font-calligraphy',
};

export default function App() {
  const [churchName, setChurchName] = useState('');
  const [reference, setReference] = useState('');
  const [verse, setVerse] = useState('');
  const [sender, setSender] = useState('');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [fontStyle, setFontStyle] = useState<FontStyle>('serif');
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingVerse, setIsFetchingVerse] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchVerseText = async () => {
    if (!reference) return;
    setIsFetchingVerse(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the Bible verse for the reference: "${reference}". Return ONLY the verse text in Korean. If multiple verses, join them. No extra text.`,
      });
      setVerse(response.text.trim());
    } catch (error) {
      console.error('Verse fetch failed:', error);
    } finally {
      setIsFetchingVerse(false);
    }
  };

  const handleAiGenerateImage = async () => {
    if (!verse) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A high-quality, emotional, and artistic background for a Bible verse card. Theme: "${verse}". Style: Abstract, soft lighting, minimal, aesthetic, high resolution, no text in image.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });
      
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setAiImage(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
    } catch (error) {
      console.error('AI Image Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    
    try {
      // Wait for fonts to be fully loaded
      if (document.fonts) {
        await document.fonts.ready;
      }
      
      // Small delay to ensure any pending animations or transitions are settled
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2, // High resolution
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `bible-verse-card-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('이미지 저장 중 오류가 발생했습니다. 다시 시도해주세요. (브라우저의 팝업 차단 설정을 확인해주세요)');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white">
            <Quote size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">말씀 카드 제작소</h1>
            <p className="text-sm text-stone-500">Bible Verse Card Maker</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={!verse || isExporting}
          className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          <span className="font-medium">이미지로 저장</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-16">
        {/* Left: Controls */}
        <section className="space-y-12">
          <div className="space-y-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-stone-200"></span>
              카드 정보 입력
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                  <Church size={12} /> 교회 이름
                </label>
                <input
                  type="text"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value.slice(0, 50))}
                  placeholder="예: 은혜교회"
                  className="w-full bg-white border-b border-stone-200 py-3 focus:border-stone-900 outline-none transition-all placeholder:text-stone-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                  <Quote size={12} /> 성경 구절 찾기
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchVerseText()}
                    placeholder="예: 시편 23:1"
                    className="flex-1 bg-white border-b border-stone-200 py-3 focus:border-stone-900 outline-none transition-all placeholder:text-stone-300"
                  />
                  <button
                    onClick={fetchVerseText}
                    disabled={!reference || isFetchingVerse}
                    className="px-4 py-2 text-xs font-bold bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
                  >
                    {isFetchingVerse ? <Loader2 size={14} className="animate-spin" /> : '본문 가져오기'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                  <Quote size={12} /> 카드 본문
                </label>
                <textarea
                  value={verse}
                  onChange={(e) => setVerse(e.target.value.slice(0, 200))}
                  placeholder="본문이 여기에 표시됩니다."
                  rows={4}
                  className="w-full bg-white border border-stone-100 rounded-xl p-4 focus:ring-1 focus:ring-stone-200 outline-none transition-all resize-none text-stone-700 leading-relaxed"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-300 font-mono">{verse.length}/200</span>
                  <button
                    onClick={handleAiGenerateImage}
                    disabled={!verse || isGenerating}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    나노바나나 AI 배경 생성
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                  <User size={12} /> 발신자
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value.slice(0, 30))}
                  placeholder="예: 김철수 드림"
                  className="w-full bg-white border-b border-stone-200 py-3 focus:border-stone-900 outline-none transition-all placeholder:text-stone-300"
                />
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-stone-200"></span>
              디자인 커스텀
            </h2>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">기본 테마</label>
                <div className="flex flex-wrap gap-4">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setSelectedTheme(theme);
                        setAiImage(null);
                      }}
                      className={cn(
                        "w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center relative",
                        selectedTheme.id === theme.id && !aiImage ? "border-stone-900 scale-110" : "border-transparent hover:border-stone-200"
                      )}
                    >
                      <div 
                        className="w-full h-full rounded-full shadow-sm" 
                        style={{ backgroundColor: theme.previewColor }}
                      />
                      {selectedTheme.id === theme.id && !aiImage && (
                        <div className="absolute inset-0 flex items-center justify-center text-stone-900">
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">글씨 크기</label>
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all",
                          fontSize === size 
                            ? "bg-white text-stone-900 shadow-sm" 
                            : "text-stone-400 hover:text-stone-600"
                        )}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">글씨 스타일</label>
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    {(['serif', 'calligraphy'] as FontStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => setFontStyle(style)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all",
                          fontStyle === style 
                            ? "bg-white text-stone-900 shadow-sm" 
                            : "text-stone-400 hover:text-stone-600"
                        )}
                      >
                        {style.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Preview */}
        <section className="lg:sticky lg:top-12 h-fit">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">PREVIEW</h2>
              <span className="text-[10px] font-mono text-stone-300">1080 x 1080 PX</span>
            </div>
            
            <div className="relative group">
              {/* Shadow Wrapper (Not captured) */}
              <div className="w-full max-w-[540px] mx-auto rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
                {/* Card Container (Captured) */}
                <div 
                  ref={cardRef}
                  className={cn(
                    "aspect-square w-full flex flex-col p-16 relative overflow-hidden",
                    !aiImage && selectedTheme.bgClass
                  )}
                >
                  {/* AI Background Image */}
                  {aiImage && (
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={aiImage} 
                        alt="AI Background" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                  )}

                  {/* Content Layer */}
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Church Name (Top) */}
                    <div className={cn(
                      "text-[10px] font-bold tracking-[0.3em] uppercase opacity-40",
                      aiImage ? "text-white" : selectedTheme.textClass
                    )}>
                      {churchName || " "}
                    </div>

                    {/* Verse (Center) */}
                    <div className="flex-1 flex items-center justify-center text-center py-12">
                      <motion.p 
                        key={`${verse}-${fontSize}-${fontStyle}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "leading-[1.6] whitespace-pre-wrap drop-shadow-sm",
                          FONT_SIZES[fontSize],
                          FONT_STYLES[fontStyle],
                          aiImage ? "text-white" : selectedTheme.textClass,
                          fontStyle === 'serif' && "italic font-medium"
                        )}
                      >
                        {verse || "성경 구절을 입력하거나\n본문을 가져와주세요."}
                      </motion.p>
                    </div>

                    {/* Sender (Bottom) */}
                    <div className={cn(
                      "text-right text-xs font-medium opacity-50 tracking-wide",
                      aiImage ? "text-white" : selectedTheme.textClass
                    )}>
                      {sender}
                    </div>
                  </div>

                  {/* Decorative Frame */}
                  <div className={cn(
                    "absolute inset-10 border pointer-events-none opacity-10 rounded-2xl",
                    aiImage ? "border-white" : selectedTheme.accentClass
                  )} />
                </div>
              </div>

              {/* AI Badge */}
              <AnimatePresence>
                {aiImage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-xl flex items-center gap-2"
                  >
                    <Sparkles size={10} /> NANO BANANA AI GENERATED
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-200 text-center">
        <p className="text-sm text-stone-400">
          © {new Date().getFullYear()} 말씀 카드 제작소. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
