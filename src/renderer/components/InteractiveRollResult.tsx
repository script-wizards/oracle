import React from "react";
import {RollResult, Table} from "../../shared/types";
import {useTranslations} from "../i18n";
import { 
  getClickableSubrolls, 
  getSubrollDepth, 
  getTopLevelSubrolls, 
  countClickableSubtables,
  findOriginalSubrollIndex 
} from "../../shared/utils/SubrollUtils";

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

    const allClickableSubrolls = getClickableSubrolls(rollResult);
    
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
          const originalIndex = findOriginalSubrollIndex(subroll, rollResult.subrolls);

          // Calculate visual depth
          const visualDepth = getSubrollDepth(subroll, allClickableSubrolls);
          
          // Find child subrolls that are completely contained within this subroll
          const childSubrolls = allClickableSubrolls.filter(child =>
            child !== subroll &&
            child.startIndex >= subroll.startIndex &&
            child.endIndex <= subroll.endIndex &&
            child.startIndex < child.endIndex // Valid child
          );
          
          // Determine styling
          const depthClass = childSubrolls.length > 0 ? 'container-element' : 'leaf-element';

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
      const topLevelSubrolls = getTopLevelSubrolls(allClickableSubrolls);
      return renderTextSegment(rollResult.text, 0, topLevelSubrolls, 0);
    };

    // Try the complex nested rendering first, but fall back to simple if needed
    try {
      return <>{renderNestedClickable()}</>;
    } catch (error) {
      console.warn('Complex rendering failed, falling back to simple rendering:', error);
      return renderSimpleFallback(allClickableSubrolls);
    }
  };

  // Simple fallback rendering extracted to separate function
  const renderSimpleFallback = (allClickableSubrolls: any[]) => {
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
      const originalIndex = findOriginalSubrollIndex(subroll, rollResult.subrolls);
      
      // Get the actual text at the subroll's position in the full result
      const actualSubrollText = rollResult.text.substring(subroll.startIndex, subroll.endIndex);
      
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
          {actualSubrollText}
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
  };

  // Count clickable subtables using utility function
  const subtableCount = countClickableSubtables(rollResult);

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
