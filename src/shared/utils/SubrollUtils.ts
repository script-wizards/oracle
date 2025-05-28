import { SubrollData, RollResult } from '../types';

/**
 * Filters subrolls to get only clickable ones for interactive display
 */
export function getClickableSubrolls(rollResult: RollResult): SubrollData[] {
  if (!rollResult.subrolls || rollResult.subrolls.length === 0) {
    return [];
  }

  const rootSubroll = rollResult.subrolls.find(subroll => 
    subroll.startIndex === 0 && subroll.endIndex === rollResult.text.length
  );
  
  return rollResult.subrolls
    .filter(subroll => {
      // Exclude output subrolls (used for highlighting in table viewer)
      if (subroll.source === 'output') return false;
      
      // Exclude the root section subroll (the section we originally rolled from)
      if (rootSubroll && subroll === rootSubroll) return false;
      
      // Include all other subtable subrolls (both containers and leaf nodes)
      return subroll.type === 'subtable';
    })
    // Validate positions to prevent overflow highlighting
    .filter(subroll => {
      return subroll.startIndex >= 0 && 
             subroll.endIndex <= rollResult.text.length &&
             subroll.startIndex < subroll.endIndex;
    })
    // Handle nested subroll chains: [food] -> [fruit] -> [berry] -> "strawberry"
    // When multiple subrolls have identical positions, keep only the most specific one
    .filter((subroll, index, array) => {
      const overlappingSubrolls = array.filter(other => 
        other.startIndex === subroll.startIndex &&
        other.endIndex === subroll.endIndex
      );
      
      if (overlappingSubrolls.length <= 1) {
        return true; // No overlap, keep it
      }
      
      // Among overlapping subrolls, prefer the most specific (deepest in nesting chain)
      // Exclude root sections like 'output' and 'food' which are too broad
      const specificSubrolls = overlappingSubrolls.filter(s => 
        s.source !== 'output' && s.source !== 'food'
      );
      
      if (specificSubrolls.length > 0) {
        // Keep the most specific subroll (last in the resolution chain)
        return subroll === specificSubrolls[specificSubrolls.length - 1];
      }
      
      // Fallback: keep the first non-output subroll
      return subroll === overlappingSubrolls.find(s => s.source !== 'output');
    })
    // Remove exact duplicates
    .filter((subroll, index, array) => {
      const duplicateIndex = array.findIndex(other => 
        other.startIndex === subroll.startIndex &&
        other.endIndex === subroll.endIndex &&
        other.text === subroll.text &&
        other.source === subroll.source &&
        other.type === subroll.type
      );
      return duplicateIndex === index;
    })
    .sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Calculates the visual depth of a subroll for styling purposes
 */
export function getSubrollDepth(subroll: SubrollData, allClickableSubrolls: SubrollData[]): number {
  let depth = 0;
  for (const otherSubroll of allClickableSubrolls) {
    if (otherSubroll !== subroll &&
        otherSubroll.startIndex <= subroll.startIndex &&
        otherSubroll.endIndex >= subroll.endIndex) {
      depth++;
    }
  }
  return depth;
}

/**
 * Gets top-level subrolls (those not contained within other subrolls)
 */
export function getTopLevelSubrolls(allClickableSubrolls: SubrollData[]): SubrollData[] {
  return allClickableSubrolls.filter(subroll => {
    // A subroll is top-level if no other subroll completely contains it
    return !allClickableSubrolls.some(otherSubroll =>
      otherSubroll !== subroll &&
      otherSubroll.startIndex <= subroll.startIndex &&
      otherSubroll.endIndex >= subroll.endIndex
    );
  });
}

/**
 * Counts clickable subtables in a roll result
 */
export function countClickableSubtables(rollResult: RollResult): number {
  const rootSubrollForCount = rollResult.subrolls?.find(subroll => 
    subroll.startIndex === 0 && subroll.endIndex === rollResult.text.length
  );
  
  return rollResult.subrolls?.filter(subroll => {
    if (subroll.source === 'output') return false;
    if (rootSubrollForCount && subroll === rootSubrollForCount) return false;
    return subroll.type === 'subtable';
  }).length || 0;
}

/**
 * Finds the original index of a subroll in the full subrolls array
 */
export function findOriginalSubrollIndex(
  targetSubroll: SubrollData, 
  allSubrolls: SubrollData[]
): number {
  // First, try to find by source and type (most reliable for rerolls)
  if (targetSubroll.source) {
    const sourceMatches = allSubrolls
      .map((s, index) => ({ subroll: s, index }))
      .filter(({ subroll }) => 
        subroll.source === targetSubroll.source &&
        subroll.type === targetSubroll.type
      );
    
    if (sourceMatches.length === 1) {
      // Unique match by source - this is the most reliable
      return sourceMatches[0].index;
    }
    
    if (sourceMatches.length > 1) {
      // Multiple matches by source, try to narrow down by position
      const positionMatch = sourceMatches.find(({ subroll }) =>
        subroll.startIndex === targetSubroll.startIndex &&
        subroll.endIndex === targetSubroll.endIndex
      );
      
      if (positionMatch) {
        return positionMatch.index;
      }
      
      // If no exact position match, return the first source match
      // This handles cases where positions have shifted due to rerolls
      return sourceMatches[0].index;
    }
  }
  
  // Fallback: try to find by position and source (original logic)
  return allSubrolls.findIndex(
    (s) =>
      s.startIndex === targetSubroll.startIndex &&
      s.endIndex === targetSubroll.endIndex &&
      s.source === targetSubroll.source
  );
}
