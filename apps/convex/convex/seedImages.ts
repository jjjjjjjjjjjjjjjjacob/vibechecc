import { action, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { nanoid } from 'nanoid';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

// Public domain images from Pexels (free to use)
const publicDomainImages = [
  // Coffee & Cafe vibes
  'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
  'https://images.pexels.com/photos/1813466/pexels-photo-1813466.jpeg',
  'https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg',
  
  // Work & Productivity
  'https://images.pexels.com/photos/7376/startup-photos.jpg',
  'https://images.pexels.com/photos/7375/startup-photos.jpg',
  'https://images.pexels.com/photos/7374/startup-photos.jpg',
  
  // Nature & Outdoors
  'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg',
  'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg',
  'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg',
  
  // Food & Cooking
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
  'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
  
  // Urban & City Life
  'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg',
  'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg',
  'https://images.pexels.com/photos/1227511/pexels-photo-1227511.jpeg',
  
  // Technology & Digital
  'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
  'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
  'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg',
  
  // Home & Domestic
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
  'https://images.pexels.com/photos/667838/pexels-photo-667838.jpeg',
  'https://images.pexels.com/photos/1470171/pexels-photo-1470171.jpeg',
];

// Helper function to get a contextually appropriate image
function getImageForVibe(vibeTitle: string, vibeDescription: string): string {
  const content = `${vibeTitle} ${vibeDescription}`.toLowerCase();
  
  // Coffee/cafe related
  if (content.includes('coffee') || content.includes('cafe') || content.includes('espresso')) {
    return publicDomainImages[Math.floor(Math.random() * 3)];
  }
  
  // Work/productivity
  if (content.includes('work') || content.includes('job') || content.includes('productivity')) {
    return publicDomainImages[3 + Math.floor(Math.random() * 3)];
  }
  
  // Nature/outdoors
  if (content.includes('rain') || content.includes('nature') || content.includes('outdoor')) {
    return publicDomainImages[6 + Math.floor(Math.random() * 3)];
  }
  
  // Food/cooking
  if (content.includes('food') || content.includes('cooking') || content.includes('dinner')) {
    return publicDomainImages[9 + Math.floor(Math.random() * 3)];
  }
  
  // City/urban
  if (content.includes('city') || content.includes('apartment') || content.includes('urban')) {
    return publicDomainImages[12 + Math.floor(Math.random() * 3)];
  }
  
  // Technology
  if (content.includes('phone') || content.includes('technology') || content.includes('wifi')) {
    return publicDomainImages[15 + Math.floor(Math.random() * 3)];
  }
  
  // Home/domestic
  if (content.includes('clean') || content.includes('laundry') || content.includes('plant')) {
    return publicDomainImages[18 + Math.floor(Math.random() * 3)];
  }
  
  // Default to a random image
  return publicDomainImages[Math.floor(Math.random() * publicDomainImages.length)];
}

// Action to download an image from URL and store it in Convex
export const downloadAndStoreImage = action({
  args: { url: v.string() },
  handler: async (ctx, { url }): Promise<Id<'_storage'> | null> => {
    try {
      // Download the image
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to download image from ${url}`);
        return null;
      }
      
      // Get the image as a blob
      const blob = await response.blob();
      
      // Store the image in Convex storage
      const storageId = await ctx.storage.store(blob);
      
      return storageId;
    } catch (error) {
      console.error(`Error downloading/storing image from ${url}:`, error);
      return null;
    }
  },
});

// Internal mutation to update a vibe with an image storage ID
export const updateVibeWithImage = internalMutation({
  args: { 
    vibeId: v.string(),
    imageStorageId: v.id('_storage')
  },
  handler: async (ctx, { vibeId, imageStorageId }) => {
    const vibe = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('id'), vibeId))
      .first();
      
    if (!vibe) {
      throw new Error(`Vibe with id ${vibeId} not found`);
    }
    
    await ctx.db.patch(vibe._id, { imageStorageId });
  },
});

// Action to seed vibes with images
export const seedVibesWithImages = action({
  handler: async (ctx) => {
    // Get all vibes without images
    const vibes = await ctx.runQuery(internal.seedImages.getVibesWithoutImages);
    
    if (vibes.length === 0) {
      return { message: 'No vibes without images found', updated: 0 };
    }
    
    let updated = 0;
    const maxToUpdate = Math.min(vibes.length, 20); // Limit to 20 to avoid timeouts
    
    for (let i = 0; i < maxToUpdate; i++) {
      const vibe = vibes[i];
      const imageUrl = getImageForVibe(vibe.title, vibe.description || '');
      
      // Download and store the image
      const storageId = await ctx.runAction(internal.seedImages.downloadAndStoreImage, { url: imageUrl });
      
      if (storageId) {
        // Update the vibe with the storage ID
        await ctx.runMutation(internal.seedImages.updateVibeWithImage, {
          vibeId: vibe.id,
          imageStorageId: storageId
        });
        
        updated++;
        console.log(`Added image to vibe: ${vibe.title}`);
      }
    }
    
    return {
      message: `Successfully added images to ${updated} vibes`,
      updated,
      remaining: vibes.length - maxToUpdate
    };
  },
});

// Internal query to get vibes without images
export const getVibesWithoutImages = internalQuery({
  handler: async (ctx) => {
    const vibes = await ctx.db
      .query('vibes')
      .filter((q) => 
        q.and(
          q.eq(q.field('imageStorageId'), undefined),
          q.eq(q.field('image'), undefined)
        )
      )
      .take(100);
      
    return vibes;
  },
});

