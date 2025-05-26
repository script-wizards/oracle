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

    // Filter out output subrolls and parent subrolls with nested refs (they're only for highlighting in table viewer)
    const sortedSubrolls = rollResult.subrolls
      .filter(subroll => subroll.source !== 'output' && !subroll.hasNestedRefs)
      .sort((a, b) => a.startIndex - b.startIndex);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSubrolls.forEach((subroll, sortedIndex) => {
      // Find the original index of this subroll in the unsorted array (excluding output and nested subrolls)
      const originalIndex = rollResult.subrolls.findIndex(
        (s) =>
          s.startIndex === subroll.startIndex &&
          s.endIndex === subroll.endIndex &&
          s.text === subroll.text &&
          s.source !== 'output' &&
          !s.hasNestedRefs
      );

      // Add text before this subroll
      if (subroll.startIndex > lastIndex) {
        const beforeText = rollResult.text.substring(
          lastIndex,
          subroll.startIndex
        );
        if (beforeText) {
          elements.push(
            <span key={`before-${sortedIndex}`} className="static-text">
              {beforeText}
            </span>
          );
        }
      }

      // Add the subroll as clickable if it's a subtable (but not the output section)
      if (subroll.type === "subtable" && subroll.source && subroll.source.toLowerCase() !== 'output') {
        elements.push(
          <span
            key={`subroll-${sortedIndex}`}
            className="subtable-result clickable-subtable"
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
      } else {
        // Non-subtable subroll (like dice), show as static
        elements.push(
          <span key={`subroll-${sortedIndex}`} className="static-text">
            {subroll.text}
          </span>
        );
      }

      lastIndex = subroll.endIndex;
    });

    // Add any remaining text after the last subroll
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

  const subtableCount =
    rollResult.subrolls?.filter((s) => s.type === "subtable" && s.source !== 'output' && !s.hasNestedRefs).length || 0;

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
