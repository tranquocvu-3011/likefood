/**
 * LIKEFOOD - HTML Sanitization Utility
 * Protects against XSS attacks when rendering user-generated HTML content
 */

import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create a DOMPurify instance for server-side rendering
const window = new JSDOM("").window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes dangerous scripts, event handlers, and other malicious content
 * 
 * @param dirty - Raw HTML string that needs sanitization
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  return DOMPurify.sanitize(dirty, {
    // Allow safe HTML tags
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "section", "article", "header", "footer",
      "strong", "b", "em", "i", "u", "s", "strike",
      "a", "img",
      "blockquote", "pre", "code",
    ],
    
    // Allow safe attributes
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id",
      "width", "height", "style", "target", "rel",
      "colspan", "rowspan", "align",
    ],
    
    // Allow data URLs for images (base64) and safe protocols
    ALLOW_DATA_ATTR: false,
    
    // Remove comments entirely
    KEEP_CONTENT: true,
    
    // Don't add namespace prefixes
    NAMESPACE: "http://www.w3.org/1999/xhtml",
    
    // Custom URL schemes allowed
    ADD_ATTR: ["target"], // Allow target attribute
    
    // Forbidden tags (will be completely removed)
    FORBID_TAGS: [
      "script", "style", "object", "embed", "form", "input",
      "button", "select", "textarea", "iframe",
    ],
    
    // Forbidden attributes (will be removed)
    FORBID_ATTR: [
      "onerror", "onload", "onclick", "onmouseover", "onfocus",
      "onblur", "onchange", "onsubmit", "onreset", "onkeydown",
      "onkeypress", "onkeyup", "onmousedown", "onmouseup",
      "onmousemove", "onmouseout", "onmouseenter", "onmouseleave",
      "oncontextmenu", "ondrag", "ondrop", "ondragstart", "ondragend",
      "onanimationstart", "onanimationend", "onanimationiteration",
      "ontransitionend", "data", "xmlns"
    ]
  });
}

/**
 * Strip all HTML tags and return plain text
 * Useful for generating excerpts or meta descriptions
 * 
 * @param html - HTML string to strip
 * @returns Plain text without any HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  
  // First sanitize to remove any malicious content
  const sanitized = sanitizeHtml(html);
  
  // Then strip all tags
  return sanitized
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Check if HTML contains potentially dangerous content
 * Useful for validating user input before saving
 * 
 * @param html - HTML string to check
 * @returns true if dangerous content detected
 */
export function containsDangerousHtml(html: string): boolean {
  if (!html) return false;
  
  const dangerous = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /data:\s*text\/html/i
  ];
  
  return dangerous.some(pattern => pattern.test(html));
}
