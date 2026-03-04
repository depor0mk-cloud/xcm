/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { translator } from './utils/translator';
import { ArrowRightLeft, Trash2, Copy, Check, Terminal, Share2, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'toName' | 'toRussian'>('toName');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Subscribe to translator updates
  useEffect(() => {
    const unsubscribe = translator.subscribe(() => {
      // Force update if needed
    });
    return unsubscribe;
  }, []);

  // Helper functions for UTF-8 safe Base64
  const toBase64 = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  const fromBase64 = (str: string) => {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  };

  // Handle Deep Linking on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    
    if (data) {
      try {
        const jsonStr = fromBase64(data);
        const decoded = JSON.parse(jsonStr);
        
        if (decoded.text && decoded.dict) {
          translator.mergeDictionary(decoded.dict);
          setInput(decoded.text);
          setMode('toRussian'); // Auto-switch to decrypt mode
          // Auto-translate
          setTimeout(() => {
             const result = translator.toRussian(decoded.text);
             setOutput(result);
          }, 100);
          
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (e) {
        console.error("Failed to parse shared data", e);
      }
    }
  }, []);

  const handleTranslate = () => {
    if (!input.trim()) return;
    
    if (mode === 'toName') {
      const result = translator.toName(input);
      setOutput(result);
      setShareUrl(''); // Reset share URL when new translation happens
    } else {
      const result = translator.toRussian(input);
      setOutput(result);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setShareUrl('');
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!output && !input) return;
    
    // Determine what to share. 
    // If in 'toName' mode, we share the OUTPUT (encrypted) + Keys.
    // If in 'toRussian' mode, we share the INPUT (encrypted) + Keys.
    
    const textToShare = mode === 'toName' ? output : input;
    if (!textToShare) return;

    const dictSubset = translator.getDictionarySubset(textToShare);
    const payload = {
      text: textToShare,
      dict: dictSubset
    };
    
    try {
      const encoded = toBase64(JSON.stringify(payload));
      const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
      navigator.clipboard.writeText(url);
      setShareUrl(url);
      alert('Защищенная ссылка скопирована! Любой, у кого есть эта ссылка, сможет расшифровать сообщение.');
    } catch (e) {
      console.error(e);
      alert('Сообщение слишком большое для передачи через ссылку.');
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'toName' ? 'toRussian' : 'toName');
    if (output) {
      setInput(output);
      setOutput('');
      setShareUrl('');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] p-4 md:p-8 flex flex-col items-center justify-center font-sans selection:bg-[#F27D26] selection:text-black">
      
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#333] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F27D26] flex items-center justify-center rounded-sm">
              <Terminal className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Шифр: Имя</h1>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Защищенный Протокол Перевода</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button
               onClick={() => {
                 navigator.clipboard.writeText(window.location.href);
                 alert('Ссылка на приложение скопирована!');
               }}
               className="hidden md:flex items-center gap-2 text-xs font-mono text-[#F27D26] hover:text-[#ff9a57] transition-colors uppercase tracking-wider"
             >
               <span className="border border-[#F27D26] px-2 py-1 rounded-full">ПОДЕЛИТЬСЯ</span>
             </button>
             <div className="hidden md:block">
               <span className="text-[10px] font-mono text-[#F27D26] border border-[#F27D26] px-2 py-1 rounded-full animate-pulse">
                 СИСТЕМА АКТИВНА
               </span>
             </div>
          </div>
        </header>

        {/* Main Interface */}
        <main className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
          
          {/* Input Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider flex justify-between">
              <span>Ввод // {mode === 'toName' ? 'Русский' : 'Протокол Имя'}</span>
              <button onClick={handleClear} className="hover:text-[#F27D26] transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </label>
            <div className="relative group flex-grow">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'toName' ? "Введите текст..." : "Введите зашифрованный код..."}
                className="w-full h-64 md:h-96 bg-[#0a0a0a] border border-[#333] p-4 font-mono text-sm resize-none focus:outline-none focus:border-[#F27D26] focus:ring-1 focus:ring-[#F27D26] transition-all rounded-sm placeholder:text-gray-800"
                spellCheck={false}
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-gray-700 font-mono">
                {input.length} СИМВ
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-row md:flex-col items-center justify-center gap-4 py-4 md:py-0">
            <button 
              onClick={toggleMode}
              className="p-3 rounded-full border border-[#333] hover:border-[#F27D26] hover:text-[#F27D26] hover:bg-[#F27D26]/10 transition-all group"
              title="Переключить режим"
            >
              <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            
            <button
              onClick={handleTranslate}
              className="bg-[#F27D26] text-black font-bold font-mono text-sm px-6 py-3 rounded-sm hover:bg-[#ff9a57] active:scale-95 transition-all uppercase tracking-wider w-full md:w-auto shadow-[0_0_15px_rgba(242,125,38,0.3)] hover:shadow-[0_0_25px_rgba(242,125,38,0.5)]"
            >
              {mode === 'toName' ? 'Зашифровать' : 'Расшифровать'}
            </button>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider flex justify-between">
              <span>Вывод // {mode === 'toName' ? 'Протокол Имя' : 'Русский'}</span>
              <div className="flex items-center gap-3">
                <button onClick={handleShare} className="hover:text-[#F27D26] transition-colors flex items-center gap-1" title="Создать ссылку">
                  <Share2 className="w-3 h-3" />
                  <span className="text-[10px]">ССЫЛКА</span>
                </button>
                <button onClick={handleCopy} className="hover:text-[#F27D26] transition-colors flex items-center gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied && <span className="text-[10px]">СКОПИРОВАНО</span>}
                </button>
              </div>
            </label>
            <div className="relative flex-grow">
              <div className="w-full h-64 md:h-96 bg-[#111] border border-[#333] p-4 font-mono text-sm overflow-auto rounded-sm text-[#F27D26]/90 shadow-inner">
                {output ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={output} // Re-animate on change
                  >
                    {output}
                  </motion.div>
                ) : (
                  <span className="text-gray-800 italic opacity-50">Ожидание входного потока...</span>
                )}
              </div>
            </div>
          </div>

        </main>

        {/* Footer / Instructions */}
        <footer className="border-t border-[#333] pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500 font-mono">
          <div>
            <h3 className="text-[#e5e5e5] mb-2 uppercase tracking-wider">Правила Протокола</h3>
            <ul className="space-y-1 list-disc list-inside marker:text-[#F27D26]">
              <li>Слова заменяются случайными кодами (5-12 симв).</li>
              <li>Пунктуация сохраняется.</li>
              <li>Используйте кнопку <b>ССЫЛКА</b> для передачи ключей.</li>
              <li>Без ссылки сообщения невозможно расшифровать.</li>
            </ul>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p>ID СЕССИИ: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            <p>УРОВЕНЬ ШИФРОВАНИЯ: МАКС</p>
          </div>
        </footer>

      </div>
    </div>
  );
}

