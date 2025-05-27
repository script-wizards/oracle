import React from "react";
import {RollResult, Table} from "../../shared/types";
import {useTranslations} from "../i18n";

interface InteractiveRollResultProps {
  rollResult: RollResult;
  onReroll: () => void;
  onSubtableReroll: (subrollIndex: number) => void;
  lastRolledTable: Table | null;
  isHistoryItem?: boolean;
}

const InteractiveRollResult: React.FC<InteractiveRollResultProps> = ({
  rollResult,
  onReroll,
  onSubtableReroll,
  lastRolledTable,
  isHistoryItem = false
}) => {
  const t = useTranslations();



  // Parse the text to identify subtable results and make them clickable
  const renderInteractiveText = () => {
    if (!rollResult.subrolls || rollResult.subrolls.length === 0) {
      // No subrolls, just show the text as clickable for full reroll
      return (
        <span
          className="full-result-text clickable-text"
          onClick={onReroll}
          title={t.rollResults.clickToRerollEntire}
        >
          {rollResult.text}
        </span>
      );
    }

    // Create a hierarchical structure of clickable subrolls
    // We'll render all subtable subrolls (except output and root) with nested visual indicators
    const rootSubroll = rollResult.subrolls.find(subroll => 
      subroll.startIndex === 0 && subroll.endIndex === rollResult.text.length
    );
    
    const allClickableSubrolls = rollResult.subrolls
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
      // When multiple subrolls have identical positions and text, keep only the most specific one
      .filter((subroll, index, array) => {
        const overlappingSubrolls = array.filter(other => 
          other.startIndex === subroll.startIndex &&
          other.endIndex === subroll.endIndex &&
          other.text === subroll.text
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





    // Group subrolls by their nesting level for visual styling
    const getSubrollDepth = (subroll: any) => {
      let depth = 0;
      for (const otherSubroll of allClickableSubrolls) {
        if (otherSubroll !== subroll &&
            otherSubroll.startIndex <= subroll.startIndex &&
            otherSubroll.endIndex >= subroll.endIndex) {
          depth++;
        }
      }
      return depth;
    };

    // Nested approach with proper recursion bounds and termination conditions
    const renderNestedClickable = () => {
      // Helper function with proper bounds checking and termination
      const renderTextSegment = (
        text: string,
        startOffset: number,
        relevantSubrolls: typeof allClickableSubrolls,
        depth: number = 0
      ): React.ReactNode[] => {
        // Base case 1: Prevent infinite recursion with max depth
        // This prevents crashes when rerolling creates deeply nested identical structures
        if (depth > 10) {
          return [<span key="max-depth" className="static-text">{text}</span>];
        }

        // Base case 2: No subrolls to process
        if (!relevantSubrolls || relevantSubrolls.length === 0) {
          return [<span key="no-subrolls" className="static-text">{text}</span>];
        }

        // Base case 3: Empty or invalid text
        if (!text || text.length === 0) {
          return [];
        }

        const elements: React.ReactNode[] = [];
        let lastIndex = 0;

        // Filter and sort subrolls that are valid for this text segment
        const validSubrolls = relevantSubrolls
          .filter(subroll => {
            // Bounds checking: subroll must be within the current text segment
            const relativeStart = subroll.startIndex - startOffset;
            const relativeEnd = subroll.endIndex - startOffset;
            return relativeStart >= 0 && 
                   relativeEnd <= text.length && 
                   relativeStart < relativeEnd &&
                   subroll.startIndex >= startOffset &&
                   subroll.endIndex <= startOffset + text.length;
          })
          .sort((a, b) => a.startIndex - b.startIndex);

        validSubrolls.forEach((subroll, index) => {
          const relativeStart = subroll.startIndex - startOffset;
          const relativeEnd = subroll.endIndex - startOffset;

          // Skip if this overlaps with what we've already rendered
          if (relativeStart < lastIndex) {
            return;
          }

          // Add text before this subroll
          if (relativeStart > lastIndex) {
            const beforeText = text.substring(lastIndex, relativeStart);
            if (beforeText) {
              elements.push(
                <span key={`before-${index}`} className="static-text">
                  {beforeText}
                </span>
              );
            }
          }

          // Find the original index for click handling
          const originalIndex = rollResult.subrolls.findIndex(
            (s) =>
              s.startIndex === subroll.startIndex &&
              s.endIndex === subroll.endIndex &&
              s.text === subroll.text &&
              s.source === subroll.source
          );

          // Calculate visual depth
          const visualDepth = getSubrollDepth(subroll);
          
          // Find child subrolls that are completely contained within this subroll
          const childSubrolls = allClickableSubrolls.filter(child =>
            child !== subroll &&
            child.startIndex >= subroll.startIndex &&
            child.endIndex <= subroll.endIndex &&
            child.startIndex < child.endIndex // Valid child
          );
          
          // Determine styling
          let depthClass = '';
          if (childSubrolls.length > 0) {
            depthClass = 'container-element'; // Containers 
          } else {
            depthClass = 'leaf-element'; // Leaf nodes
          }

          // Get the text content of this subroll
          const subrollText = text.substring(relativeStart, relativeEnd);

          if (childSubrolls.length > 0) {
            // This subroll has children - render them nested inside with recursion
            const nestedContent = renderTextSegment(
              subrollText, 
              subroll.startIndex, 
              childSubrolls,
              depth + 1 // Increment depth to prevent infinite recursion
            );
            
            elements.push(
              <span
                key={`subroll-${index}`}
                className={`subtable-result clickable-subtable ${depthClass}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSubtableReroll(originalIndex);
                }}
                title={t.rollResults.clickToRerollSubtable.replace(
                  "{source}",
                  subroll.source || ""
                )}
                data-source={subroll.source}
                data-depth={visualDepth}
              >
                {nestedContent}
              </span>
            );
          } else {
            // Leaf node - no children
            elements.push(
              <span
                key={`subroll-${index}`}
                className={`subtable-result clickable-subtable ${depthClass}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSubtableReroll(originalIndex);
                }}
                title={t.rollResults.clickToRerollSubtable.replace(
                  "{source}",
                  subroll.source || ""
                )}
                data-source={subroll.source}
                data-depth={visualDepth}
              >
                {subrollText}
              </span>
            );
          }

          lastIndex = relativeEnd;
        });

        // Add any remaining text after the last subroll
        if (lastIndex < text.length) {
          const afterText = text.substring(lastIndex);
          if (afterText) {
            elements.push(
              <span key="after" className="static-text">
                {afterText}
              </span>
            );
          }
        }

        return elements;
      };

      // Start with the full text and top-level subrolls
      const topLevelSubrolls = allClickableSubrolls.filter(subroll => {
        // A subroll is top-level if no other subroll completely contains it
        return !allClickableSubrolls.some(otherSubroll =>
          otherSubroll !== subroll &&
          otherSubroll.startIndex <= subroll.startIndex &&
          otherSubroll.endIndex >= subroll.endIndex
        );
      });

      return renderTextSegment(rollResult.text, 0, topLevelSubrolls, 0);
    };

    // Try the complex nested rendering first, but fall back to simple if needed
    try {
      return <>{renderNestedClickable()}</>;
    } catch (error) {
      console.warn('Complex rendering failed, falling back to simple rendering:', error);
      
      // Simple fallback: just make each subroll clickable without nesting
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      
      allClickableSubrolls.forEach((subroll, index) => {
        // Add text before this subroll
        if (subroll.startIndex > lastIndex) {
          const beforeText = rollResult.text.substring(lastIndex, subroll.startIndex);
          if (beforeText) {
            elements.push(
              <span key={`before-${index}`} className="static-text">
                {beforeText}
              </span>
            );
          }
        }
        
        // Find the original index for click handling
        const originalIndex = rollResult.subrolls.findIndex(
          (s) =>
            s.startIndex === subroll.startIndex &&
            s.endIndex === subroll.endIndex &&
            s.text === subroll.text &&
            s.source === subroll.source
        );
        
        // Add the clickable subroll
        elements.push(
          <span
            key={`subroll-${index}`}
            className="subtable-result clickable-subtable leaf-element"
            onClick={(e) => {
              e.stopPropagation();
              onSubtableReroll(originalIndex);
            }}
            title={t.rollResults.clickToRerollSubtable.replace(
              "{source}",
              subroll.source || ""
            )}
            data-source={subroll.source}
          >
            {subroll.text}
          </span>
        );
        
        lastIndex = subroll.endIndex;
      });
      
      // Add any remaining text
      if (lastIndex < rollResult.text.length) {
        const afterText = rollResult.text.substring(lastIndex);
        if (afterText) {
          elements.push(
            <span key="after" className="static-text">
              {afterText}
            </span>
          );
        }
      }
      
      return <>{elements}</>;
    }
  };

  // Count clickable subtables using the same logic as the filtering above
  const rootSubrollForCount = rollResult.subrolls?.find(subroll => 
    subroll.startIndex === 0 && subroll.endIndex === rollResult.text.length
  );
  
  const subtableCount = rollResult.subrolls?.filter(subroll => {
    if (subroll.source === 'output') return false;
    if (rootSubrollForCount && subroll === rootSubrollForCount) return false;
    return subroll.type === 'subtable';
  }).length || 0;

  // Handle clicks on the result box (for full reroll)
  const handleResultBoxClick = (e: React.MouseEvent) => {
    // Only trigger full reroll if the click wasn't on a subtable element
    if (!(e.target as HTMLElement).closest(".clickable-subtable")) {
      onReroll();
    }
  };

  return (
    <div className="interactive-result-container">
      <div
        className={`roll-result-spotlight interactive clickable ${
          isHistoryItem ? "history-result" : ""
        }`}
        onClick={handleResultBoxClick}
        title={
          subtableCount > 0
            ? t.rollResults.clickHighlightedPartsToRerollIndividual
            : t.rollResults.clickToReroll
        }
      >
        <div className="result-content">
          <div className="result-text">{renderInteractiveText()}</div>
        </div>

        {!isHistoryItem && (
          <div className="result-help">
            <div className="help-icon" title={t.rollResults.howToReroll}>
              <span className="help-symbol">?</span>
              <div className="help-tooltip">
                {subtableCount > 0 ? (
                  <>
                    <div className="help-tip">
                      {t.rollResults.clickHighlightedParts}
                    </div>
                    <div className="help-tip">
                      {t.rollResults.clickAnywhereElse}
                    </div>
                  </>
                ) : (
                  <div className="help-tip">{t.rollResults.clickToReroll}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveRollResult;
