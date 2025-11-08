import { query } from '../db/index.js';

/**
 * Calculate activity points for a user
 * Points are earned from:
 * - Check-ins: 10 points each
 * - Quest completions: 50 points each
 * - Diary posts: 5 points each
 * - Consecutive days: bonus points
 */
export async function calculateActivityPoints(userId) {
  try {
    // Count check-ins
    const checkinsResult = await query(
      'SELECT COUNT(*) as count FROM checkins WHERE user_id = $1 AND checkout_time IS NOT NULL',
      [userId]
    );
    const checkinPoints = parseInt(checkinsResult.rows[0].count) * 10;
    
    // Count quest completions
    const questsResult = await query(
      "SELECT COUNT(*) as count FROM quest_participants WHERE user_id = $1 AND status = 'completed'",
      [userId]
    );
    const questPoints = parseInt(questsResult.rows[0].count) * 50;
    
    // Count diary posts
    const diaryResult = await query(
      'SELECT COUNT(*) as count FROM diary_posts WHERE author_id = $1',
      [userId]
    );
    const diaryPoints = parseInt(diaryResult.rows[0].count) * 5;
    
    // Calculate consecutive days bonus
    const consecutiveDays = await getConsecutiveCheckinDays(userId);
    const consecutiveBonus = Math.floor(consecutiveDays / 7) * 20; // 20 points per week
    
    // Total unique visit days
    const visitDaysResult = await query(
      'SELECT COUNT(DISTINCT DATE(checkin_time)) as count FROM checkins WHERE user_id = $1',
      [userId]
    );
    const visitDaysPoints = parseInt(visitDaysResult.rows[0].count) * 2;
    
    const totalPoints = checkinPoints + questPoints + diaryPoints + consecutiveBonus + visitDaysPoints;
    
    return {
      totalPoints,
      breakdown: {
        checkins: checkinPoints,
        quests: questPoints,
        diary: diaryPoints,
        consecutive: consecutiveBonus,
        visitDays: visitDaysPoints,
      },
    };
  } catch (error) {
    console.error('Error calculating activity points:', error);
    throw error;
  }
}

/**
 * Get consecutive check-in days
 */
async function getConsecutiveCheckinDays(userId) {
  try {
    const result = await query(
      `SELECT DATE(checkin_time) as checkin_date
       FROM checkins
       WHERE user_id = $1
       GROUP BY DATE(checkin_time)
       ORDER BY DATE(checkin_time) DESC`,
      [userId]
    );
    
    if (result.rows.length === 0) return 0;
    
    let consecutive = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const row of result.rows) {
      const checkinDate = new Date(row.checkin_date);
      checkinDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - checkinDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === consecutive || diffDays === consecutive + 1) {
        consecutive = diffDays + 1;
        currentDate = checkinDate;
      } else {
        break;
      }
    }
    
    return consecutive;
  } catch (error) {
    console.error('Error calculating consecutive days:', error);
    return 0;
  }
}

/**
 * Check if user meets unlock requirements
 */
export async function checkUnlockRequirement(userId, unlockRule) {
  try {
    const rule = typeof unlockRule === 'string' ? JSON.parse(unlockRule) : unlockRule;
    
    switch (rule.type) {
      case 'default':
        return true;
        
      case 'points': {
        const { totalPoints } = await calculateActivityPoints(userId);
        return totalPoints >= rule.required;
      }
      
      case 'checkin_days': {
        const result = await query(
          'SELECT COUNT(DISTINCT DATE(checkin_time)) as count FROM checkins WHERE user_id = $1',
          [userId]
        );
        const days = parseInt(result.rows[0].count);
        return days >= rule.required;
      }
      
      case 'consecutive_days': {
        const consecutive = await getConsecutiveCheckinDays(userId);
        return consecutive >= rule.required;
      }
      
      case 'quest_complete': {
        const result = await query(
          "SELECT COUNT(*) as count FROM quest_participants WHERE user_id = $1 AND status = 'completed'",
          [userId]
        );
        const count = parseInt(result.rows[0].count);
        return count >= rule.required;
      }
      
      case 'ranking': {
        // Check if user is in top N of a ranking category
        const rankingResult = await query(
          `SELECT user_id, ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank
           FROM checkins
           GROUP BY user_id`,
          []
        );
        
        const userRank = rankingResult.rows.find(r => r.user_id === userId);
        return userRank && parseInt(userRank.rank) <= rule.rank;
      }
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking unlock requirement:', error);
    return false;
  }
}
