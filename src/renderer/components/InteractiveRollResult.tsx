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

    // Render nested clickable boxes properly
    const renderNestedClickableBoxes = () => {
      // Helper function to render text with nested subrolls
      const renderTextWithNesting = (
        text: string, 
        startOffset: number, 
        relevantSubrolls: typeof allClickableSubrolls
      ): React.ReactNode[] => {
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;

        // Sort by start position
        const sortedSubrolls = relevantSubrolls
          .filter(subroll => 
            subroll.startIndex >= startOffset && 
            subroll.endIndex <= startOffset + text.length
          )
          .sort((a, b) => a.startIndex - b.startIndex);

        sortedSubrolls.forEach((subroll, index) => {
          const relativeStart = subroll.startIndex - startOffset;
          const relativeEnd = subroll.endIndex - startOffset;

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

          // Calculate depth for visual styling
          const depth = getSubrollDepth(subroll);
          const depthClass = depth > 0 ? `depth-${Math.min(depth, 3)}` : '';

          // Get the text content of this subroll
          const subrollText = text.substring(relativeStart, relativeEnd);

          // Find child subrolls that are completely contained within this subroll
          const childSubrolls = allClickableSubrolls.filter(child =>
            child !== subroll &&
            child.startIndex >= subroll.startIndex &&
            child.endIndex <= subroll.endIndex
          );

          // If this subroll has children, render them nested inside
          if (childSubrolls.length > 0) {
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
                data-depth={depth}
              >
                {renderTextWithNesting(subrollText, subroll.startIndex, childSubrolls)}
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
                data-depth={depth}
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

      // Start with the full text and all top-level subrolls
      const topLevelSubrolls = allClickableSubrolls.filter(subroll => {
        // A subroll is top-level if no other subroll completely contains it
        return !allClickableSubrolls.some(otherSubroll =>
          otherSubroll !== subroll &&
          otherSubroll.startIndex <= subroll.startIndex &&
          otherSubroll.endIndex >= subroll.endIndex
        );
      });

      return renderTextWithNesting(rollResult.text, 0, topLevelSubrolls);
    };

    return <>{renderNestedClickableBoxes()}</>;
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
