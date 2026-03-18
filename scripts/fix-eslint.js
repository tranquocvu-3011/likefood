/**
 * Script to auto-fix ESLint unused import/variable warnings
 * Parses eslint compact output and removes unused imports,
 * prefixes unused variables with underscore
 */
const fs = require('fs');
const path = require('path');

const data = fs.readFileSync('d:/weblikefood/eslint-compact.txt', 'utf8');
const lines = data.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('\n'));

// Parse all issues
const issues = [];
for (const line of lines) {
  const m = line.match(/^(.+?): line (\d+), col (\d+), (Warning|Error) - (.+?) \((.+?)\)\s*$/);
  if (m) {
    issues.push({
      file: m[1],
      line: +m[2],
      col: +m[3],
      severity: m[4],
      message: m[5],
      rule: m[6]
    });
  }
}

// Group by file
const byFile = {};
issues.forEach(i => {
  if (!byFile[i.file]) byFile[i.file] = [];
  byFile[i.file].push(i);
});

let totalFixed = 0;

for (const [filePath, fileIssues] of Object.entries(byFile)) {
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Get unused import names
  const unusedImports = fileIssues
    .filter(i => i.rule === '@typescript-eslint/no-unused-vars')
    .map(i => {
      const m = i.message.match(/^'(.+?)' is defined but never used/);
      return m ? m[1] : null;
    })
    .filter(Boolean);
  
  // Get unused variables (assigned but never used)
  const unusedVars = fileIssues
    .filter(i => i.rule === '@typescript-eslint/no-unused-vars')
    .map(i => {
      const m = i.message.match(/^'(.+?)' is assigned a value but never used/);
      return m ? { name: m[1], line: i.line } : null;
    })
    .filter(Boolean);
  
  // Remove unused imports from import statements
  for (const name of unusedImports) {
    // Skip if variable starts with underscore (already suppressed)
    if (name.startsWith('_')) {
      // Prefix with _ in the actual code if not already
      continue;
    }
    
    // Try to remove from destructured import: import { X, Y, Z } from '...'
    // Pattern 1: Remove "Name, " from imports
    const regex1 = new RegExp(`(import\\s*\\{[^}]*?)\\b${escapeRegex(name)}\\b\\s*,\\s*`, 'g');
    const newContent1 = content.replace(regex1, '$1');
    if (newContent1 !== content) {
      content = newContent1;
      modified = true;
      totalFixed++;
      continue;
    }
    
    // Pattern 2: Remove ", Name" from imports (last item with comma before)
    const regex2 = new RegExp(`(import\\s*\\{[^}]*?),\\s*\\b${escapeRegex(name)}\\b(\\s*\\})`, 'g');
    const newContent2 = content.replace(regex2, '$1$2');
    if (newContent2 !== content) {
      content = newContent2;
      modified = true;
      totalFixed++;
      continue;
    }
    
    // Pattern 3: Remove "Name" as only import: import { Name } from '...'
    const regex3 = new RegExp(`^\\s*import\\s*\\{\\s*${escapeRegex(name)}\\s*\\}\\s*from\\s*['\"][^'\"]+['\"];?\\s*\\n`, 'gm');
    const newContent3 = content.replace(regex3, '');
    if (newContent3 !== content) {
      content = newContent3;
      modified = true;
      totalFixed++;
      continue;
    }
    
    // Pattern 4: Default import: import Name from '...'
    const regex4 = new RegExp(`^\\s*import\\s+${escapeRegex(name)}\\s+from\\s*['\"][^'\"]+['\"];?\\s*\\n`, 'gm');
    const newContent4 = content.replace(regex4, '');
    if (newContent4 !== content) {
      content = newContent4;
      modified = true;
      totalFixed++;
      continue;
    }
    
    // Pattern 5: Type import: import { type Name } or import type { Name }
    const regex5 = new RegExp(`(import\\s*\\{[^}]*?)\\btype\\s+${escapeRegex(name)}\\b\\s*,?\\s*`, 'g');
    const newContent5 = content.replace(regex5, '$1');
    if (newContent5 !== content) {
      content = newContent5;
      modified = true;
      totalFixed++;
      continue;
    }
  }
  
  // Handle unused variables starting with underscore prefix convention
  // For variables already named with _ prefix, no changes needed
  // For function params like (req, ...) or (error, ...) prefix with _
  for (const v of unusedVars) {
    if (v.name.startsWith('_')) continue;
    
    const fileLines = content.split('\n');
    const lineIdx = v.line - 1;
    if (lineIdx < 0 || lineIdx >= fileLines.length) continue;
    
    const lineStr = fileLines[lineIdx];
    
    // Only prefix params in arrow functions, catch blocks, and callback params
    // Check if it's a function parameter or catch parameter
    if (lineStr.includes('catch') || lineStr.match(/\(\s*\w+\s*[,)]/)) {
      // Prefix with underscore
      const newLine = lineStr.replace(new RegExp(`\\b${escapeRegex(v.name)}\\b`), `_${v.name}`);
      if (newLine !== lineStr) {
        fileLines[lineIdx] = newLine;
        content = fileLines.join('\n');
        modified = true;
        totalFixed++;
      }
    }
  }
  
  // Fix prefer-const
  const preferConstIssues = fileIssues.filter(i => i.rule === 'prefer-const');
  for (const issue of preferConstIssues) {
    const fileLines = content.split('\n');
    const lineIdx = issue.line - 1;
    if (lineIdx >= 0 && lineIdx < fileLines.length) {
      fileLines[lineIdx] = fileLines[lineIdx].replace(/\blet\b/, 'const');
      content = fileLines.join('\n');
      modified = true;
      totalFixed++;
    }
  }
  
  if (modified) {
    // Clean up empty import braces
    content = content.replace(/import\s*\{\s*\}\s*from\s*['"][^'"]+['"];?\s*\n/g, '');
    // Clean up trailing commas in imports
    content = content.replace(/import\s*\{([^}]*),\s*\}/g, (match, inner) => {
      return `import {${inner.trimEnd()} }`;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${path.basename(filePath)} (${fileIssues.length} issues)`);
  }
}

console.log(`\nTotal auto-fixed: ${totalFixed}`);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
