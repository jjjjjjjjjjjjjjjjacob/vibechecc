import { action } from './_generated/server';
import { api } from './_generated/api';

// Basic emojis to import for testing
const BASIC_EMOJIS = [
  { emoji: '😀', name: 'grinning face', keywords: ['face', 'grin', 'happy'], category: 'smileys' },
  { emoji: '😃', name: 'grinning face with big eyes', keywords: ['face', 'mouth', 'open', 'smile'], category: 'smileys' },
  { emoji: '😄', name: 'grinning face with smiling eyes', keywords: ['eye', 'face', 'mouth', 'open', 'smile'], category: 'smileys' },
  { emoji: '😁', name: 'beaming face with smiling eyes', keywords: ['eye', 'face', 'grin', 'smile'], category: 'smileys' },
  { emoji: '😂', name: 'face with tears of joy', keywords: ['face', 'joy', 'laugh', 'tear'], category: 'smileys' },
  { emoji: '😊', name: 'smiling face with smiling eyes', keywords: ['blush', 'eye', 'face', 'smile'], category: 'smileys' },
  { emoji: '😍', name: 'smiling face with heart-eyes', keywords: ['eye', 'face', 'love', 'smile'], category: 'smileys' },
  { emoji: '🥰', name: 'smiling face with hearts', keywords: ['adore', 'crush', 'hearts', 'in love'], category: 'smileys' },
  { emoji: '😎', name: 'smiling face with sunglasses', keywords: ['bright', 'cool', 'face', 'sun', 'sunglasses'], category: 'smileys' },
  { emoji: '🤩', name: 'star-struck', keywords: ['eyes', 'face', 'grinning', 'star'], category: 'smileys' },
  { emoji: '😭', name: 'loudly crying face', keywords: ['cry', 'face', 'sad', 'sob', 'tear'], category: 'smileys' },
  { emoji: '😱', name: 'face screaming in fear', keywords: ['face', 'fear', 'fearful', 'munch', 'scared', 'scream'], category: 'smileys' },
  { emoji: '😳', name: 'flushed face', keywords: ['dazed', 'face', 'flushed'], category: 'smileys' },
  { emoji: '🤔', name: 'thinking face', keywords: ['face', 'thinking'], category: 'smileys' },
  { emoji: '😴', name: 'sleeping face', keywords: ['face', 'sleep', 'zzz'], category: 'smileys' },
  { emoji: '💩', name: 'pile of poo', keywords: ['dung', 'face', 'monster', 'poo', 'poop'], category: 'smileys' },
  { emoji: '🔥', name: 'fire', keywords: ['fire', 'flame', 'hot'], category: 'nature' },
  { emoji: '💯', name: 'hundred points', keywords: ['100', 'full', 'hundred', 'score'], category: 'symbols' },
  { emoji: '👀', name: 'eyes', keywords: ['eye', 'face'], category: 'people' },
  { emoji: '💰', name: 'money bag', keywords: ['bag', 'dollar', 'money', 'moneybag'], category: 'objects' },
  { emoji: '🤑', name: 'money-mouth face', keywords: ['face', 'money', 'mouth'], category: 'smileys' },
  { emoji: '🎉', name: 'party popper', keywords: ['celebration', 'party', 'popper', 'tada'], category: 'objects' },
  { emoji: '😬', name: 'grimacing face', keywords: ['face', 'grimace'], category: 'smileys' },
  { emoji: '🙈', name: 'see-no-evil monkey', keywords: ['evil', 'face', 'forbidden', 'monkey', 'see'], category: 'animals' },
  { emoji: '⏱️', name: 'stopwatch', keywords: ['clock'], category: 'objects' },
  { emoji: '🚽', name: 'toilet', keywords: ['toilet'], category: 'objects' },
  { emoji: '🔦', name: 'flashlight', keywords: ['electric', 'light', 'tool', 'torch'], category: 'objects' },
  { emoji: '💸', name: 'money with wings', keywords: ['bank', 'bill', 'dollar', 'fly', 'money', 'wings'], category: 'objects' },
  { emoji: '👖', name: 'jeans', keywords: ['clothing', 'pants', 'trousers'], category: 'objects' },
  { emoji: '🏃', name: 'person running', keywords: ['marathon', 'running'], category: 'people' },
  { emoji: '😨', name: 'fearful face', keywords: ['face', 'fear', 'fearful', 'scared'], category: 'smileys' },
  { emoji: '😕', name: 'confused face', keywords: ['confused', 'face'], category: 'smileys' },
  { emoji: '😒', name: 'unamused face', keywords: ['face', 'unamused', 'unhappy'], category: 'smileys' },
  { emoji: '🥺', name: 'pleading face', keywords: ['begging', 'mercy', 'puppy eyes'], category: 'smileys' },
  { emoji: '💀', name: 'skull', keywords: ['death', 'face', 'fairy tale', 'monster'], category: 'smileys' },
  { emoji: '✨', name: 'sparkles', keywords: ['*', 'sparkle', 'star'], category: 'nature' },
  { emoji: '❤️', name: 'red heart', keywords: ['heart'], category: 'symbols' },
  { emoji: '👍', name: 'thumbs up', keywords: ['+1', 'hand', 'thumb', 'up'], category: 'people' },
  { emoji: '👎', name: 'thumbs down', keywords: ['-1', 'down', 'hand', 'thumb'], category: 'people' },
  { emoji: '👏', name: 'clapping hands', keywords: ['clap', 'hand'], category: 'people' },
  { emoji: '🙏', name: 'folded hands', keywords: ['ask', 'hand', 'please', 'pray', 'thanks'], category: 'people' },
  { emoji: '💪', name: 'flexed biceps', keywords: ['biceps', 'comic', 'flex', 'muscle'], category: 'people' },
  { emoji: '🤝', name: 'handshake', keywords: ['agreement', 'hand', 'meeting', 'shake'], category: 'people' },
  { emoji: '✅', name: 'check mark button', keywords: ['✓', 'button', 'check', 'mark'], category: 'symbols' },
  { emoji: '❌', name: 'cross mark', keywords: ['×', 'cancel', 'cross', 'mark', 'multiplication', 'multiply', 'x'], category: 'symbols' },
  { emoji: '⚡', name: 'high voltage', keywords: ['danger', 'electric', 'lightning', 'voltage', 'zap'], category: 'nature' },
  { emoji: '🌟', name: 'glowing star', keywords: ['glittery', 'glow', 'shining', 'sparkle', 'star'], category: 'nature' },
  { emoji: '🎯', name: 'bullseye', keywords: ['dart', 'direct hit', 'game', 'hit', 'target'], category: 'activities' },
  { emoji: '🚀', name: 'rocket', keywords: ['rocket', 'space'], category: 'travel' },
];

export const importBasicEmojis = action({
  handler: async (ctx) => {
    console.log(`Importing ${BASIC_EMOJIS.length} basic emojis...`);
    
    try {
      const result = await ctx.runMutation(api.emojis.importBatch, {
        emojis: BASIC_EMOJIS,
      });

      console.log(`Import complete! Imported ${result.count} new emojis`);
      return {
        success: true,
        imported: result.count,
        message: `Successfully imported ${result.count} emojis`,
      };
    } catch (error) {
      console.error('Error importing emojis:', error);
      return {
        success: false,
        imported: 0,
        message: `Error importing emojis: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});