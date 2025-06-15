
"use client";

import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface LatexRendererProps {
  latexString: string;
  className?: string;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ latexString, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && latexString) {
      try {
        // KaTeX expects display mode math to be explicitly passed if using $$..$$
        // We can replace $$...$$ with \displaymath{...} or pass displayMode: true
        // For simplicity, we'll try to detect display mode or allow KaTeX to infer.
        // A more robust solution might pre-process the string to ensure KaTeX delimiters.
        
        // KaTeX's auto-render extension is not used here for more direct control.
        // We'll manually render. KaTeX by default renders based on delimiters like $ and $$.
        // If the string is purely a block equation like $$...$$, we can use displayMode.
        
        let html;
        // Basic check if the entire string is a display mode equation
        if (latexString.trim().startsWith('$$') && latexString.trim().endsWith('$$')) {
          html = katex.renderToString(latexString.trim().slice(2, -2), {
            throwOnError: false,
            displayMode: true,
            output: 'html',
            macros: {
              "\\L": "\\mathcal{L}" // Example custom macro if needed
            }
          });
        } else {
          // For mixed content or inline, KaTeX needs to find delimiters or process segments.
          // This simplified renderer assumes the string might be multiple equations or mixed text.
          // A more sophisticated approach would parse the string and render segments.
          // For now, let's attempt to render the whole string. If it fails, it shows raw.
          // A common practice is to use a library that handles auto-rendering of mixed content.
          // Since we're keeping it simple, this might not render mixed text and LaTeX perfectly.
          // The AI prompt currently favors Markdown with LaTeX blocks.
          
          // Let's try to render the string directly. If it's pure LaTeX, it works.
          // If it's Markdown with LaTeX, this won't process the Markdown part.
          // This component is best for strings that are *primarily* LaTeX.
          html = katex.renderToString(latexString, {
            throwOnError: false, // Don't crash on error, just show raw TeX
            displayMode: false, // Default to inline, use $$ for display.
            output: 'html',
            macros: {
              "\\L": "\\mathcal{L}"
            },
            delimiters: [ // Tell KaTeX what to look for
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ]
          });
        }
        containerRef.current.innerHTML = html;
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        // Fallback to displaying the raw string if KaTeX fails
        containerRef.current.textContent = latexString;
      }
    } else if (containerRef.current) {
      containerRef.current.textContent = latexString; // Handle empty or null string
    }
  }, [latexString]);

  return <div ref={containerRef} className={className} />;
};

export default LatexRenderer;
