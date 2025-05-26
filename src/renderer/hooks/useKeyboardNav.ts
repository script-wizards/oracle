import { useState, useEffect, useCallback } from 'react';

export interface KeyboardNavState {
    selectedIndex: number;
    isNavigating: boolean;
}

export interface KeyboardNavHandlers {
    handleArrowUp: () => void;
    handleArrowDown: () => void;
    handleEnter: () => void;
    handleEscape: () => void;
    handleTab: (event: KeyboardEvent) => void;
    handleNumberKey: (number: number) => void;
    setSelectedIndex: (index: number) => void;
    resetNavigation: () => void;
}

export interface UseKeyboardNavOptions {
    itemCount: number;
    onSelect: (index: number) => void;
    onEscape?: () => void;
    onEnter?: (index: number) => void;
    enableNumberShortcuts?: boolean;
    maxNumberShortcuts?: number;
    loop?: boolean;
}

export function useKeyboardNav({
    itemCount,
    onSelect,
    onEscape,
    onEnter,
    enableNumberShortcuts = true,
    maxNumberShortcuts = 9,
    loop = true
}: UseKeyboardNavOptions): KeyboardNavState & KeyboardNavHandlers {
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [isNavigating, setIsNavigating] = useState<boolean>(false);

    // Reset selection when item count changes
    useEffect(() => {
        if (itemCount === 0) {
            setSelectedIndex(-1);
            setIsNavigating(false);
        } else if (selectedIndex >= itemCount) {
            setSelectedIndex(itemCount > 0 ? 0 : -1);
        } else if (selectedIndex === -1 && itemCount > 0) {
            setSelectedIndex(0);
            setIsNavigating(true);
        }
    }, [itemCount, selectedIndex]);

    const handleArrowUp = useCallback(() => {
        if (itemCount === 0) return;

        setIsNavigating(true);
        setSelectedIndex(prev => {
            if (prev <= 0) {
                return loop ? itemCount - 1 : 0;
            }
            return prev - 1;
        });
    }, [itemCount, loop]);

    const handleArrowDown = useCallback(() => {
        if (itemCount === 0) return;

        setIsNavigating(true);
        setSelectedIndex(prev => {
            if (prev >= itemCount - 1) {
                return loop ? 0 : itemCount - 1;
            }
            return prev + 1;
        });
    }, [itemCount, loop]);

    const handleEnter = useCallback(() => {
        if (selectedIndex >= 0 && selectedIndex < itemCount) {
            if (onEnter) {
                onEnter(selectedIndex);
            } else {
                onSelect(selectedIndex);
            }
        }
    }, [selectedIndex, itemCount, onSelect, onEnter]);

    const handleEscape = useCallback(() => {
        setSelectedIndex(-1);
        setIsNavigating(false);
        if (onEscape) {
            onEscape();
        }
    }, [onEscape]);

    const handleTab = useCallback((event: KeyboardEvent) => {
        // Allow tab to move focus naturally, but update our navigation state
        if (event.shiftKey) {
            // Shift+Tab - moving backwards
            handleArrowUp();
        } else {
            // Tab - moving forwards
            handleArrowDown();
        }
        // Don't prevent default - let tab work for accessibility
    }, [handleArrowUp, handleArrowDown]);

    const handleNumberKey = useCallback((number: number) => {
        if (!enableNumberShortcuts || number < 1 || number > maxNumberShortcuts) {
            return;
        }

        const index = number - 1; // Convert 1-based to 0-based
        if (index < itemCount) {
            setSelectedIndex(index);
            setIsNavigating(true);
            onSelect(index);
        }
    }, [enableNumberShortcuts, maxNumberShortcuts, itemCount, onSelect]);

    const resetNavigation = useCallback(() => {
        setSelectedIndex(-1);
        setIsNavigating(false);
    }, []);

    const setSelectedIndexWrapper = useCallback((index: number) => {
        if (index >= 0 && index < itemCount) {
            setSelectedIndex(index);
            setIsNavigating(true);
        } else {
            setSelectedIndex(-1);
            setIsNavigating(false);
        }
    }, [itemCount]);

    return {
        selectedIndex,
        isNavigating,
        handleArrowUp,
        handleArrowDown,
        handleEnter,
        handleEscape,
        handleTab,
        handleNumberKey,
        setSelectedIndex: setSelectedIndexWrapper,
        resetNavigation
    };
}
