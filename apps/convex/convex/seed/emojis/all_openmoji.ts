// Full OpenMoji dataset - all categories combined
import { smileysEmojisAll } from './smileys_full';
import { peopleEmojisAll } from './people_full';
import { extrasEmojisAll } from './extras_openmoji_full';
import { animalsEmojisAll } from './animals_full';
import { foodEmojisAll } from './food_full';
import { travelEmojisAll } from './travel_full';
import { activitiesEmojisAll } from './activities_full';
import { objectsEmojisAll } from './objects_full';
import { symbolsEmojisAll } from './symbols_full';
import { flagsEmojisAll } from './flags_full';

export const allOpenMojiEmojis = [
  ...smileysEmojisAll,
  ...peopleEmojisAll,
  ...extrasEmojisAll,
  ...animalsEmojisAll,
  ...foodEmojisAll,
  ...travelEmojisAll,
  ...activitiesEmojisAll,
  ...objectsEmojisAll,
  ...symbolsEmojisAll,
  ...flagsEmojisAll,
];

export const emojiCount = allOpenMojiEmojis.length;
// eslint-disable-next-line no-console
console.log(`OpenMoji dataset loaded: ${emojiCount} emojis`);
