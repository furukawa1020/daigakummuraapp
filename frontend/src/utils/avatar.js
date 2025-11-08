/**
 * Avatar rendering utilities
 * Handles layering, color application, and preview generation
 */

// Layer order for rendering (bottom to top)
const LAYER_ORDER = [
  'skin_color',
  'clothing',
  'hair',
  'hair_color',
  'eyes',
  'mouth',
  'accessory',
];

/**
 * Generate avatar layers in correct order
 * @param {Object} avatarState - Selected parts { hair: 'partId', eyes: 'partId', ... }
 * @param {Object} partsData - All parts data organized by category
 * @returns {Array} Ordered array of layers to render
 */
export function generateAvatarLayers(avatarState, partsData) {
  if (!avatarState || !partsData) return [];
  
  const layers = [];
  
  for (const category of LAYER_ORDER) {
    const partId = avatarState[category];
    
    if (!partId || partId === 'none') continue;
    
    // Find part data
    const categoryParts = partsData[category] || [];
    const part = categoryParts.find(p => p.id === partId);
    
    if (part) {
      layers.push({
        category,
        partId: part.id,
        assetUrl: part.assetUrl,
        name: part.name,
        // For color categories, the assetUrl IS the color value
        isColor: category.includes('color'),
      });
    }
  }
  
  return layers;
}

/**
 * Apply color to SVG element (client-side only)
 * This is a placeholder - actual implementation depends on SVG structure
 */
export function applyColorToSvg(svgElement, color, targetClass = 'colorable') {
  if (!svgElement) return;
  
  const elements = svgElement.querySelectorAll(`.${targetClass}`);
  elements.forEach(el => {
    if (color === 'rainbow') {
      // Apply rainbow gradient
      el.style.fill = 'url(#rainbow-gradient)';
    } else {
      el.style.fill = color;
    }
  });
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity) {
  const colors = {
    common: '#9ca3af',      // gray
    rare: '#3b82f6',        // blue
    epic: '#a855f7',        // purple
    legendary: '#f59e0b',   // orange/gold
  };
  
  return colors[rarity] || colors.common;
}

/**
 * Get rarity badge emoji
 */
export function getRarityBadge(rarity) {
  const badges = {
    common: '⚪',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟡',
  };
  
  return badges[rarity] || badges.common;
}

/**
 * Format unlock rule for display
 */
export function formatUnlockRule(unlockRule) {
  if (typeof unlockRule === 'string') {
    try {
      unlockRule = JSON.parse(unlockRule);
    } catch {
      return 'アンロック条件不明';
    }
  }
  
  switch (unlockRule.type) {
    case 'default':
      return '初期アンロック';
      
    case 'points':
      return `活動ポイント ${unlockRule.required}pt`;
      
    case 'checkin_days':
      return `${unlockRule.required}日間訪問`;
      
    case 'consecutive_days':
      return `${unlockRule.required}日連続チェックイン`;
      
    case 'quest_complete':
      return `クエスト${unlockRule.required}回完了`;
      
    case 'ranking':
      return `ランキング${unlockRule.rank}位以内`;
      
    default:
      return 'アンロック条件不明';
  }
}

/**
 * Create default avatar state
 */
export function createDefaultAvatarState() {
  return {
    hair: null,
    eyes: null,
    mouth: null,
    clothing: null,
    accessory: 'none',
    skin_color: null,
    hair_color: null,
  };
}

/**
 * Validate avatar state
 */
export function validateAvatarState(avatarState) {
  if (!avatarState || typeof avatarState !== 'object') {
    return false;
  }
  
  const requiredCategories = ['hair', 'eyes', 'mouth', 'clothing', 'skin_color', 'hair_color'];
  
  for (const category of requiredCategories) {
    if (!avatarState[category]) {
      return false;
    }
  }
  
  return true;
}
