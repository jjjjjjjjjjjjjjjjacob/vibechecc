#!/usr/bin/env bun
/* eslint-disable no-console */

import { smileyEmojis } from '../../convex/convex/seed/emojis/smileys';
import { peopleEmojis } from '../../convex/convex/seed/emojis/people';
import { animalEmojis } from '../../convex/convex/seed/emojis/animals';
import { foodEmojis } from '../../convex/convex/seed/emojis/food';
import { activityEmojis } from '../../convex/convex/seed/emojis/activities';
import { travelEmojis } from '../../convex/convex/seed/emojis/travel';
import { objectEmojis } from '../../convex/convex/seed/emojis/objects';
import { symbolEmojis } from '../../convex/convex/seed/emojis/symbols';
import { flagEmojis } from '../../convex/convex/seed/emojis/flags';

// Combine all emojis
const allEmojis = [
  ...smileyEmojis,
  ...peopleEmojis,
  ...animalEmojis,
  ...foodEmojis,
  ...activityEmojis,
  ...travelEmojis,
  ...objectEmojis,
  ...symbolEmojis,
  ...flagEmojis,
];

// Get all unique unicode code points
const codePoints = new Set<number>();
const ranges: Map<string, { start: number; end: number; count: number }> =
  new Map();

// Common emoji ranges for reference
const emojiRanges = [
  { name: 'Emoticons', start: 0x1f600, end: 0x1f64f },
  { name: 'Dingbats', start: 0x2700, end: 0x27bf },
  { name: 'Transport and Map', start: 0x1f680, end: 0x1f6ff },
  { name: 'Miscellaneous Symbols', start: 0x2600, end: 0x26ff },
  { name: 'Supplemental Symbols', start: 0x1f900, end: 0x1f9ff },
  { name: 'Symbols and Pictographs Extended-A', start: 0x1fa70, end: 0x1faff },
  { name: 'Regional Indicator Symbols', start: 0x1f1e0, end: 0x1f1ff },
  {
    name: 'Miscellaneous Symbols and Pictographs',
    start: 0x1f300,
    end: 0x1f5ff,
  },
  { name: 'Variation Selectors', start: 0xfe00, end: 0xfe0f },
  { name: 'Combining Marks', start: 0x200d, end: 0x200d }, // ZWJ
  { name: 'Basic Latin', start: 0x0020, end: 0x007e }, // For # * 0-9
  { name: 'Geometric Shapes', start: 0x25a0, end: 0x25ff },
  { name: 'Arrows', start: 0x2190, end: 0x21ff },
  { name: 'Mathematical Operators', start: 0x2200, end: 0x22ff },
  { name: 'Box Drawing', start: 0x2500, end: 0x257f },
  { name: 'Block Elements', start: 0x2580, end: 0x259f },
  { name: 'Miscellaneous Technical', start: 0x2300, end: 0x23ff },
  { name: 'Enclosed Alphanumerics', start: 0x2460, end: 0x24ff },
  { name: 'CJK Symbols', start: 0x3000, end: 0x303f },
  { name: 'Letterlike Symbols', start: 0x2100, end: 0x214f },
  { name: 'Symbols and Pictographs B', start: 0x1fb00, end: 0x1fbff },
  { name: 'Symbols and Pictographs C', start: 0x1fc00, end: 0x1fcff },
];

// Process each emoji
allEmojis.forEach((emojiData) => {
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

// Find which ranges are used
emojiRanges.forEach((range) => {
  const usedInRange = sortedCodePoints.filter(
    (cp) => cp >= range.start && cp <= range.end
  );
  if (usedInRange.length > 0) {
    ranges.set(range.name, {
      start: range.start,
      end: range.end,
      count: usedInRange.length,
    });
  }
});

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

console.log('📊 Emoji Unicode Analysis');
console.log('========================\n');

console.log(`Total emojis: ${allEmojis.length}`);
console.log(`Unique code points: ${codePoints.size}`);
console.log(`Continuous ranges: ${continuousRanges.length}\n`);

console.log('Used Unicode Ranges:');
console.log('-------------------');
ranges.forEach((range, name) => {
  console.log(`${name}: ${range.count} code points`);
  console.log(
    `  Range: U+${range.start.toString(16).toUpperCase()}-U+${range.end.toString(16).toUpperCase()}`
  );
});

console.log('\n🎯 Optimized unicode-range for @font-face:');
console.log('=========================================');
console.log('unicode-range: ' + unicodeRangeStrings.join(', ') + ';');

console.log('\n📝 Formatted for CSS (max 10 ranges per line):');
console.log('==============================================');
const chunks = [];
for (let i = 0; i < unicodeRangeStrings.length; i += 10) {
  chunks.push(unicodeRangeStrings.slice(i, i + 10).join(', '));
}
console.log('unicode-range: ' + chunks.join(',\n  ') + ';');

// Check for dizzy emoji specifically
const dizzyEmojis = allEmojis.filter(
  (e) => e.name.includes('dizzy') || e.emoji === '😵‍💫' || e.emoji === '😵'
);

console.log('\n🌀 Dizzy Emoji Analysis:');
console.log('========================');
dizzyEmojis.forEach((emoji) => {
  console.log(`${emoji.emoji} - ${emoji.name}`);
  const codePoints = [];
  for (let i = 0; i < emoji.emoji.length; i++) {
    const cp = emoji.emoji.codePointAt(i);
    if (cp) {
      codePoints.push(`U+${cp.toString(16).toUpperCase()}`);
      if (cp > 0xffff) i++; // Skip low surrogate
    }
  }
  console.log(`  Code points: ${codePoints.join(' ')}`);
});
