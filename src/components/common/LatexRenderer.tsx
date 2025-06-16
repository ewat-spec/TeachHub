
"use client";

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  latexString: string;
  className?: string;
}

export function LatexRenderer({ latexString, className }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && containerRef.current && latexString) {
      try {
        // Replace newline characters with <br /> for KaTeX displayMode: false
        // For displayMode: true (e.g. $$...$$), newlines are often handled better or ignored.
        // This regex specifically targets newlines that are NOT within KaTeX math delimiters
        // to avoid breaking multi-line equations in display mode.
        // However, a simpler approach for mixed content is to let KaTeX handle math
        // and wrap the whole thing in a way that respects text newlines.
        // For now, we render the string and let HTML handle text flow around KaTeX blocks.
        
        // Split the string by KaTeX delimiters to render math and text separately
        const parts = latexString.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\(.*?\))/g);
        
        containerRef.current.innerHTML = ''; // Clear previous content

        parts.forEach(part => {
          if (part.match(/^(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\(.*?\))$/)) {
            // This is a math part
            const mathElement = document.createElement('span');
            try {
                 katex.render(part, mathElement, {
                    throwOnError: false,
                    displayMode: part.startsWith('$$') || part.startsWith('\\['),
                 });
            } catch (e) {
                console.error("KaTeX rendering error for math part:", e);
                mathElement.textContent = part; // Fallback to raw math string
            }
            containerRef.current?.appendChild(mathElement);
          } else {
            // This is a text part, replace newlines with <br> and append
            const textElement = document.createElement('span');
            textElement.innerHTML = part.replace(/\n/g, '<br />');
            containerRef.current?.appendChild(textElement);
          }
        });

      } catch (e) {
        console.error("KaTeX processing error:", e);
        if (containerRef.current) {
            // Fallback for general errors: display the raw string with newlines as <br>
            containerRef.current.innerHTML = latexString.replace(/\n/g, '<br />');
        }
      }
    } else if (containerRef.current && !latexString) {
        containerRef.current.innerHTML = '';
    }
  }, [latexString, isClient]);

  if (!isClient) {
    // SSR fallback: simple rendering of newlines, math will be raw
    return <div className={className} dangerouslySetInnerHTML={{ __html: latexString.replace(/\n/g, '<br />') }} />;
  }
  
  return <div ref={containerRef} className={cn("prose prose-sm max-w-none leading-relaxed", className)} />;
}
