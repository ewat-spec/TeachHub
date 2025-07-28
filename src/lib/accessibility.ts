// Focus management utilities
export const focusElement = (selector: string, delay = 0) => {
  setTimeout(() => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, delay);
};

export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

// ARIA utilities
export const generateId = (prefix = 'id') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Keyboard navigation utilities
export const handleEnterKeyAsClick = (callback: () => void) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };
};

export const handleEscapeKey = (callback: () => void) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };
};

// Screen reader utilities
export const formatForScreenReader = (text: string): string => {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
    .replace(/([0-9]+)/g, ' $1 ') // Add spaces around numbers
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Color contrast utilities (simplified)
export const hasGoodContrast = (foreground: string, background: string): boolean => {
  // This is a simplified implementation
  // In production, you'd want a more robust contrast calculation
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);
  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
  return contrast >= 4.5; // WCAG AA standard
};

const getLuminance = (color: string): number => {
  // Simplified luminance calculation
  // This would need to be expanded for production use
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Skip link utilities
export const createSkipLink = (targetId: string, text: string) => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground';
  
  return skipLink;
};

// Form accessibility utilities
export const associateLabel = (inputId: string, labelId: string) => {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  
  if (input && label) {
    input.setAttribute('aria-labelledby', labelId);
    label.setAttribute('for', inputId);
  }
};

export const addFormValidationAria = (inputId: string, errorId: string, isValid: boolean) => {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  
  if (input) {
    input.setAttribute('aria-invalid', (!isValid).toString());
    if (!isValid && error) {
      input.setAttribute('aria-describedby', errorId);
    } else {
      input.removeAttribute('aria-describedby');
    }
  }
};