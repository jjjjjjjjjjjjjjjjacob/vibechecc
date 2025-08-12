#!/usr/bin/env bun
/* eslint-disable no-console */

import { readFile } from 'fs/promises';
import path from 'path';

interface ConvertedEmoji {
  emoji: string;
  name: string;
  keywords: string[];
  category: string;
  subcategory: string;
  unicode: string;
  version: string;
}

async function analyzeFullUnicode() {
  // Load the converted OpenMoji data
  const dataPath = path.join(
    process.cwd(),
    'apps/web/scripts/openmoji-converted.json'
  );
  const data: ConvertedEmoji[] = JSON.parse(await readFile(dataPath, 'utf-8'));

  // Get all unique unicode code points
  const codePoints = new Set<number>();

  // Process each emoji
  data.forEach((emojiData) => {
    const emoji = emojiData.emoji;

    // Get all code points from the emoji
    for (let i = 0; i < emoji.length; i++) {
      const codePoint = emoji.codePointAt(i);
      if (codePoint) {
        codePoints.add(codePoint);

        // Skip low surrogate
        if (codePoint > 0xffff) {
          i++; // Skip the low surrogate
        }
      }
    }
  });

  // Sort code points
  const sortedCodePoints = Array.from(codePoints).sort((a, b) => a - b);

  // Find continuous ranges for optimization
  const continuousRanges: Array<{ start: number; end: number }> = [];
  let currentStart = sortedCodePoints[0];
  let currentEnd = sortedCodePoints[0];

  for (let i = 1; i < sortedCodePoints.length; i++) {
    // If gap is less than 256, consider it continuous
    if (sortedCodePoints[i] - currentEnd < 256) {
      currentEnd = sortedCodePoints[i];
    } else {
      continuousRanges.push({ start: currentStart, end: currentEnd });
      currentStart = sortedCodePoints[i];
      currentEnd = sortedCodePoints[i];
    }
  }
  continuousRanges.push({ start: currentStart, end: currentEnd });

  // Generate unicode-range string
  const unicodeRangeStrings = continuousRanges.map((range) => {
    if (range.start === range.end) {
      return `U+${range.start.toString(16).toUpperCase().padStart(4, '0')}`;
    }
    return `U+${range.start.toString(16).toUpperCase().padStart(4, '0')}-${range.end.toString(16).toUpperCase().padStart(4, '0')}`;
  });

  console.log('📊 Full OpenMoji Unicode Analysis');
  console.log('=================================\n');

  console.log(`Total emojis: ${data.length}`);
  console.log(`Unique code points: ${codePoints.size}`);
  console.log(`Continuous ranges: ${continuousRanges.length}\n`);

  console.log('🎯 Optimized unicode-range for @font-face:');
  console.log('=========================================');

  // Format for CSS with proper line breaks
  const chunks = [];
  for (let i = 0; i < unicodeRangeStrings.length; i += 8) {
    chunks.push(unicodeRangeStrings.slice(i, i + 8).join(', '));
  }

  console.log('unicode-range: ' + chunks.join(',\n    ') + ';');

  console.log(
    '\n📝 Update fonts.css with this unicode-range to support all OpenMoji emojis.'
  );
}

// Run the analysis
analyzeFullUnicode().catch(console.error);
