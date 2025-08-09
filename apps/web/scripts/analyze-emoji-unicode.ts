#!/usr/bin/env bun

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
const ranges: Map<string, { start: number; end: number; count: number }> = new Map();

// Common emoji ranges for reference
const emojiRanges = [
  { name: 'Emoticons', start: 0x1F600, end: 0x1F64F },
  { name: 'Dingbats', start: 0x2700, end: 0x27BF },
  { name: 'Transport and Map', start: 0x1F680, end: 0x1F6FF },
  { name: 'Miscellaneous Symbols', start: 0x2600, end: 0x26FF },
  { name: 'Supplemental Symbols', start: 0x1F900, end: 0x1F9FF },
  { name: 'Symbols and Pictographs Extended-A', start: 0x1FA70, end: 0x1FAFF },
  { name: 'Regional Indicator Symbols', start: 0x1F1E0, end: 0x1F1FF },
  { name: 'Miscellaneous Symbols and Pictographs', start: 0x1F300, end: 0x1F5FF },
  { name: 'Variation Selectors', start: 0xFE00, end: 0xFE0F },
  { name: 'Combining Marks', start: 0x200D, end: 0x200D }, // ZWJ
  { name: 'Basic Latin', start: 0x0020, end: 0x007E }, // For # * 0-9
  { name: 'Geometric Shapes', start: 0x25A0, end: 0x25FF },
  { name: 'Arrows', start: 0x2190, end: 0x21FF },
  { name: 'Mathematical Operators', start: 0x2200, end: 0x22FF },
  { name: 'Box Drawing', start: 0x2500, end: 0x257F },
  { name: 'Block Elements', start: 0x2580, end: 0x259F },
  { name: 'Miscellaneous Technical', start: 0x2300, end: 0x23FF },
  { name: 'Enclosed Alphanumerics', start: 0x2460, end: 0x24FF },
  { name: 'CJK Symbols', start: 0x3000, end: 0x303F },
  { name: 'Letterlike Symbols', start: 0x2100, end: 0x214F },
  { name: 'Symbols and Pictographs B', start: 0x1FB00, end: 0x1FBFF },
  { name: 'Symbols and Pictographs C', start: 0x1FC00, end: 0x1FCFF },
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
      if (codePoint > 0xFFFF) {
        i++; // Skip the low surrogate
      }
    }
  }
});

// Sort code points
const sortedCodePoints = Array.from(codePoints).sort((a, b) => a - b);

// Find which ranges are used
emojiRanges.forEach(range => {
  const usedInRange = sortedCodePoints.filter(
    cp => cp >= range.start && cp <= range.end
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
const unicodeRangeStrings = continuousRanges.map(range => {
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
  console.log(`  Range: U+${range.start.toString(16).toUpperCase()}-U+${range.end.toString(16).toUpperCase()}`);
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
const dizzyEmojis = allEmojis.filter(e => 
  e.name.includes('dizzy') || e.emoji === '😵‍💫' || e.emoji === '😵'
);

console.log('\n🌀 Dizzy Emoji Analysis:');
console.log('========================');
dizzyEmojis.forEach(emoji => {
  console.log(`${emoji.emoji} - ${emoji.name}`);
  const codePoints = [];
  for (let i = 0; i < emoji.emoji.length; i++) {
    const cp = emoji.emoji.codePointAt(i);
    if (cp) {
      codePoints.push(`U+${cp.toString(16).toUpperCase()}`);
      if (cp > 0xFFFF) i++; // Skip low surrogate
    }
  }
  console.log(`  Code points: ${codePoints.join(' ')}`);
});