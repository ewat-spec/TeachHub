
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
    if (containerRef.current && typeof latexString === 'string') { // Check if latexString is a string
      try {
        const html = katex.renderToString(latexString, {
          throwOnError: false, // Don't crash on error, KaTeX will display raw TeX for the problematic part
          output: 'html',    // Ensure output is HTML
          macros: {
            "\\L": "\\mathcal{L}" // Custom macro for \L if needed elsewhere
          },
          delimiters: [
              {left: "$$", right: "$$", display: true},    // For display math e.g. $$...$$
              {left: "$", right: "$", display: false},     // For inline math e.g. $...$
              {left: "\\(", right: "\\)", display: false}, // For inline math e.g. \(...\)
              {left: "\\[", right: "\\]", display: true}     // For display math e.g. \[...\]
          ]
        });
        containerRef.current.innerHTML = html;
      } catch (error) {
        // This catch block is mainly for unexpected errors if throwOnError was true.
        // With throwOnError: false, KaTeX internal errors are handled by rendering raw TeX.
        console.error('KaTeX rendering error (should be rare with throwOnError:false):', error);
        // Fallback to displaying the raw string if a catastrophic error somehow bypasses KaTeX's internal handling
        containerRef.current.textContent = latexString;
      }
    } else if (containerRef.current) {
      // Handle cases where latexString is null, undefined, or not a string
      containerRef.current.textContent = ""; // Clear content or show placeholder
    }
  }, [latexString]);

  return <div ref={containerRef} className={className} />;
};

export default LatexRenderer;
