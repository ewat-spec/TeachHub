
"use client";

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils'; // Ensure cn is imported

interface LatexRendererProps {
  latexString: string;
  className?: string;
  textColor?: string; // New prop for text color
}

export function LatexRenderer({ latexString, className, textColor }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && containerRef.current && latexString) {
      try {
        const parts = latexString.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\(.*?\))/g);
        
        containerRef.current.innerHTML = ''; // Clear previous content

        parts.forEach(part => {
          if (part.match(/^(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\(.*?\))$/)) {
            const mathElement = document.createElement('span');
            try {
                 katex.render(part, mathElement, {
                    throwOnError: false,
                    displayMode: part.startsWith('$$') || part.startsWith('\\['),
                 });
            } catch (e) {
                console.error("KaTeX rendering error for math part:", e);
                mathElement.textContent = part; 
            }
            containerRef.current?.appendChild(mathElement);
          } else {
            const textElement = document.createElement('span');
            textElement.innerHTML = part.replace(/\n/g, '<br />');
            containerRef.current?.appendChild(textElement);
          }
        });

      } catch (e) {
        console.error("KaTeX processing error:", e);
        if (containerRef.current) {
            containerRef.current.innerHTML = latexString.replace(/\n/g, '<br />');
        }
      }
    } else if (containerRef.current && !latexString) {
        containerRef.current.innerHTML = '';
    }
  }, [latexString, isClient]);

  const dynamicStyle = textColor ? { color: textColor } : {};

  if (!isClient) {
    return (
        <div 
            className={cn("prose prose-sm max-w-none leading-relaxed", className)} 
            style={dynamicStyle}
            dangerouslySetInnerHTML={{ __html: latexString.replace(/\n/g, '<br />') }} 
        />
    );
  }
  
  return (
    <div 
        ref={containerRef} 
        className={cn("prose prose-sm max-w-none leading-relaxed", className)}
        style={dynamicStyle} 
    />
  );
}
