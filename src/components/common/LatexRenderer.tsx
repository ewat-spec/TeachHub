
"use client";

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  latexString: string;
}

export function LatexRenderer({ latexString }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && containerRef.current && latexString) {
      try {
        katex.render(latexString, containerRef.current, {
          throwOnError: false, // Prevents KaTeX from throwing an error and stopping rendering for minor issues
          displayMode: false, // Auto-detect display mode based on delimiters
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          // Consider adding more trusted macros if needed, or if security is a concern
          // trust: (context) => ['\\htmlId', '\\href'].includes(context.command),
        });
      } catch (e) {
        console.error("KaTeX rendering error:", e);
        // Fallback: display the raw string if KaTeX fails catastrophically
        if (containerRef.current) {
            containerRef.current.textContent = latexString;
        }
      }
    } else if (containerRef.current && !latexString) {
        // Clear content if latexString is empty
        containerRef.current.innerHTML = '';
    }
  }, [latexString, isClient]);

  if (!isClient) {
    // Render the raw string server-side or during hydration mismatch to avoid errors
    // Or a placeholder
    return <div dangerouslySetInnerHTML={{ __html: latexString.replace(/\n/g, '<br />') }} />;
  }
  
  // The ref will be populated by KaTeX on the client side
  return <div ref={containerRef} />;
}
