import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

const TabsDraggableContext = React.createContext<{
  activeTabIndex: number;
  setActiveTabIndex: (index: number) => void;
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  onTabChange?: (tabId: string) => void;
  parallaxMode?: boolean;
  parallaxRatio?: number;
  indicatorDragOffset?: number;
  isDragging?: boolean;
  swipeThreshold?: number;
  scrollVelocityThreshold?: number;
}>({
  activeTabIndex: 0,
  setActiveTabIndex: () => {},
  tabs: [],
  parallaxMode: false,
  parallaxRatio: 0.5,
  indicatorDragOffset: 0,
  isDragging: false,
  swipeThreshold: 0.3,
  scrollVelocityThreshold: 50,
});

interface TabsDraggableProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
  parallaxMode?: boolean; // Enable parallax effect between selector and content
  parallaxRatio?: number; // Ratio for content movement (0.5 = content moves half speed of selector)
  swipeThreshold?: number; // Threshold percentage for swipe to change tabs (default: 0.3 = 30%)
  scrollVelocityThreshold?: number; // Threshold for vertical scroll velocity to disable horizontal swipes (default: 50)
}

const TabsDraggable = React.forwardRef<HTMLDivElement, TabsDraggableProps>(
  (
    {
      defaultValue,
      value,
      onValueChange,
      className,
      children,
      parallaxMode = false,
      parallaxRatio = 0.5,
      swipeThreshold = 0.3,
      scrollVelocityThreshold = 50,
    },
    ref
  ) => {
    const [tabs, setTabs] = React.useState<
      { id: string; label: string; icon?: React.ReactNode }[]
    >([]);

    // Determine if component is controlled or uncontrolled at mount and keep it stable
    const isControlled = React.useRef(value !== undefined);
    
    // Check for inconsistent control state and warn
    React.useEffect(() => {
      const currentlyControlled = value !== undefined;
      if (isControlled.current !== currentlyControlled) {
        console.warn(
          'TabsDraggable: Component changed from ' +
          (isControlled.current ? 'controlled' : 'uncontrolled') +
          ' to ' +
          (currentlyControlled ? 'controlled' : 'uncontrolled') +
          '. This can cause issues. Ensure the `value` prop is consistently provided or omitted.'
        );
      }
    }, [value]);
    const [internalActiveTabIndex, setInternalActiveTabIndex] =
      React.useState(0);
    const [indicatorDragOffset, setIndicatorDragOffset] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    // Get the actual active tab index
    const activeTabIndex = React.useMemo(() => {
      if (isControlled.current && value && tabs.length > 0) {
        const index = tabs.findIndex((tab) => tab.id === value);
        return index !== -1 ? index : 0;
      }
      return internalActiveTabIndex;
    }, [value, tabs, internalActiveTabIndex]);


    // Handle initial tab selection for uncontrolled mode
    React.useEffect(() => {
      if (!isControlled.current && tabs.length > 0 && defaultValue) {
        const index = tabs.findIndex((tab) => tab.id === defaultValue);
        if (index !== -1) {
          setInternalActiveTabIndex(index);
        }
      }
    }, [defaultValue, tabs]);

    const handleTabChange = React.useCallback(
      (tabId: string) => {
        if (isControlled.current) {
          // In controlled mode, always call onValueChange
          if (onValueChange) {
            onValueChange(tabId);
          }
        } else {
          // In uncontrolled mode, update internal state and optionally call onValueChange
          const newIndex = tabs.findIndex((tab) => tab.id === tabId);
          if (newIndex !== -1) {
            setInternalActiveTabIndex(newIndex);
          }
          if (onValueChange) {
            onValueChange(tabId);
          }
        }
      },
      [onValueChange, tabs]
    );

    const handleSetActiveTabIndex = React.useCallback(
      (index: number) => {
        if (isControlled.current) {
          // In controlled mode, call onValueChange with the tab id
          if (onValueChange && tabs[index]) {
            onValueChange(tabs[index].id);
          }
        } else {
          // In uncontrolled mode, update internal state
          setInternalActiveTabIndex(index);
          if (onValueChange && tabs[index]) {
            onValueChange(tabs[index].id);
          }
        }
      },
      [onValueChange, tabs]
    );

    return (
      <TabsDraggableContext.Provider
        value={{
          activeTabIndex,
          setActiveTabIndex: handleSetActiveTabIndex,
          tabs,
          onTabChange: handleTabChange,
          parallaxMode,
          parallaxRatio,
          indicatorDragOffset,
          isDragging,
          swipeThreshold,
          scrollVelocityThreshold,
        }}
      >
        <div ref={ref} className={cn('flex flex-col', className)}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              if (child.type === TabsDraggableList) {
                return React.cloneElement(child, {
                  setTabs,
                  setIndicatorDragOffset,
                  setIsDragging,
                } as TabsDraggableListProps);
              } else {
                // Recursively search for TabsDraggableList in children
                const findAndCloneTabsList = (
                  element: React.ReactElement
                ): React.ReactElement => {
                  if (element.type === TabsDraggableList) {
                    return React.cloneElement(element, {
                      setTabs,
                      setIndicatorDragOffset,
                      setIsDragging,
                    } as TabsDraggableListProps);
                  }

                  if (element.props && typeof element.props === 'object' && 'children' in element.props) {
                    const updatedChildren = React.Children.map(
                      (element.props as any).children,
                      (nestedChild) => {
                        if (React.isValidElement(nestedChild)) {
                          return findAndCloneTabsList(nestedChild);
                        }
                        return nestedChild;
                      }
                    );

                    return React.cloneElement(element, {
                      ...(element.props as any),
                      children: updatedChildren,
                    });
                  }

                  return element;
                };

                return findAndCloneTabsList(child);
              }
            }
            return child;
          })}
        </div>
      </TabsDraggableContext.Provider>
    );
  }
);
TabsDraggable.displayName = 'TabsDraggable';

interface TabsDraggableListProps {
  className?: string;
  children: React.ReactNode;
  setTabs?: (
    tabs: { id: string; label: string; icon?: React.ReactNode }[]
  ) => void;
  setIndicatorDragOffset?: (offset: number) => void;
  setIsDragging?: (isDragging: boolean) => void;
  indicatorRailsClassName?: string;
  indicatorClassName?: string;
}

const TabsDraggableList = React.forwardRef<
  HTMLDivElement,
  TabsDraggableListProps
>(
  (
    {
      className,
      children,
      setTabs,
      setIndicatorDragOffset: parentSetIndicatorDragOffset,
      setIsDragging: parentSetIsDragging,
      indicatorRailsClassName,
      indicatorClassName,
    },
    ref
  ) => {
    const context = React.useContext(TabsDraggableContext);
    const { activeTabIndex, setActiveTabIndex, onTabChange } = context;

    const [isDragging, setIsDragging] = React.useState(false);
    const [indicatorDragOffset, setIndicatorDragOffset] = React.useState(0);

    const indicatorRef = React.useRef<HTMLDivElement>(null);
    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
    const indicatorDragStartX = React.useRef(0);

    const [tabPositions, setTabPositions] = React.useState<
      { left: number; width: number }[]
    >([]);

    // Extract tabs data from children
    React.useEffect(() => {

      const tabsData: { id: string; label: string; icon?: React.ReactNode }[] =
        [];
      React.Children.forEach(children, (child) => {
        if (
          React.isValidElement(child) &&
          child.type === TabsDraggableTrigger
        ) {
          const props = child.props as TabsDraggableTriggerProps;
          const { value, children: triggerChildren, icon } = props;
          tabsData.push({
            id: value,
            label: typeof triggerChildren === 'string' ? triggerChildren : '',
            icon,
          });
        }
      });

      if (setTabs) {
        setTabs(tabsData);
      }
    }, [children, setTabs]);

    // Calculate tab positions
    React.useEffect(() => {
      const positions: { left: number; width: number }[] = [];
      let accumulated = 0;

      tabRefs.current.forEach((ref) => {
        if (ref) {
          const width = ref.offsetWidth;
          positions.push({ left: accumulated, width });
          accumulated += width + 8; // 8px gap
        }
      });

      setTabPositions(positions);
    }, [children]);

    // Handle tab click
    const handleTabClick = (index: number, value: string) => {
      if (index === activeTabIndex) return;

      setActiveTabIndex(index);
      setIndicatorDragOffset(0);

      if (onTabChange) {
        onTabChange(value);
      }
    };

    // Indicator dragging handlers
    const handleIndicatorDragStart = (
      e: React.MouseEvent | React.TouchEvent
    ) => {
      e.stopPropagation();
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      indicatorDragStartX.current = clientX;
      setIsDragging(true);
      if (parentSetIsDragging) {
        parentSetIsDragging(true);
      }
      setIndicatorDragOffset(0);
    };

    const handleIndicatorDrag = React.useCallback(
      (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const dragDistance = clientX - indicatorDragStartX.current;

        // Calculate which tab we're closest to based on drag distance
        const currentPos = tabPositions[activeTabIndex];
        if (!currentPos) return;

        // Limit elastic at boundaries
        const firstTabPos = tabPositions[0];
        const lastTabPos = tabPositions[tabPositions.length - 1];
        let constrainedOffset = dragDistance;

        if (currentPos.left + dragDistance < firstTabPos.left - 20) {
          // Elastic resistance at start
          const overflow =
            currentPos.left + dragDistance - (firstTabPos.left - 20);
          constrainedOffset = dragDistance - overflow * 0.7;
        } else if (currentPos.left + dragDistance > lastTabPos.left + 20) {
          // Elastic resistance at end
          const overflow =
            currentPos.left + dragDistance - (lastTabPos.left + 20);
          constrainedOffset = dragDistance - overflow * 0.7;
        }

        setIndicatorDragOffset(constrainedOffset);
        // Update parent context for content parallax
        if (parentSetIndicatorDragOffset) {
          parentSetIndicatorDragOffset(constrainedOffset);
        }
      },
      [isDragging, tabPositions, activeTabIndex, parentSetIndicatorDragOffset]
    );

    const handleIndicatorDragEnd = React.useCallback(() => {
      if (!isDragging) return;

      setIsDragging(false);
      if (parentSetIsDragging) {
        parentSetIsDragging(false);
      }

      // Find closest tab based on final indicator position
      const currentPos = tabPositions[activeTabIndex];
      if (!currentPos) return;

      const indicatorCenter =
        currentPos.left + currentPos.width / 2 + indicatorDragOffset;
      let closestIndex = activeTabIndex;
      let minDistance = Infinity;

      // Check distance to each tab center
      tabPositions.forEach((pos, index) => {
        const tabCenter = pos.left + pos.width / 2;
        const distance = Math.abs(indicatorCenter - tabCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      // Reset offsets and snap to the closest tab
      setIndicatorDragOffset(0);
      if (parentSetIndicatorDragOffset) {
        parentSetIndicatorDragOffset(0);
      }

      // Switch to the closest tab if it's different
      if (closestIndex !== activeTabIndex) {
        setActiveTabIndex(closestIndex);
        const tabs = context.tabs;
        if (onTabChange && tabs[closestIndex]) {
          onTabChange(tabs[closestIndex].id);
        }
      }
    }, [
      isDragging,
      tabPositions,
      activeTabIndex,
      indicatorDragOffset,
      context.tabs,
      onTabChange,
      setActiveTabIndex,
      parentSetIndicatorDragOffset,
      parentSetIsDragging,
    ]);

    // Global mouse/touch event listeners
    React.useEffect(() => {
      const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
        handleIndicatorDrag(e);
      };

      const handleGlobalEnd = () => {
        handleIndicatorDragEnd();
      };

      if (isDragging) {
        document.addEventListener('mousemove', handleGlobalMove);
        document.addEventListener('touchmove', handleGlobalMove);
        document.addEventListener('mouseup', handleGlobalEnd);
        document.addEventListener('touchend', handleGlobalEnd);

        return () => {
          document.removeEventListener('mousemove', handleGlobalMove);
          document.removeEventListener('touchmove', handleGlobalMove);
          document.removeEventListener('mouseup', handleGlobalEnd);
          document.removeEventListener('touchend', handleGlobalEnd);
        };
      }
    }, [isDragging, handleIndicatorDrag, handleIndicatorDragEnd]);

    const indicatorPosition = tabPositions[activeTabIndex];
    const indicatorTransform = indicatorPosition
      ? `translateX(${indicatorPosition.left + indicatorDragOffset}px)`
      : '';
    const indicatorWidth = indicatorPosition?.width || 0;

    let tabIndex = -1;

    return (
      <div ref={ref} className={cn('relative py-2', className)}>
        <div className="flex w-full items-center justify-center">
          <div
            className={cn(
              'bg-muted/50 relative inline-flex items-center gap-2 rounded-xl p-1 backdrop-blur-sm',
              indicatorRailsClassName
            )}
          >
            {/* Tab Indicator - visual background */}
            <div
              ref={indicatorRef}
              className={cn(
                'bg-background absolute inset-y-1 rounded-xl shadow-sm',
                !isDragging && 'transition-transform duration-300 ease-out',
                indicatorClassName
              )}
              style={{
                transform: indicatorTransform,
                width: `${indicatorWidth}px`,
              }}
            />

            {/* Tab Buttons */}
            {React.Children.map(children, (child) => {
              if (
                React.isValidElement(child) &&
                child.type === TabsDraggableTrigger
              ) {
                tabIndex++;
                const currentIndex = tabIndex;
                return React.cloneElement(child, {
                  ref: (el: HTMLButtonElement | null) => {
                    tabRefs.current[currentIndex] = el;
                  },
                  onClick: () =>
                    handleTabClick(
                      currentIndex,
                      (child.props as TabsDraggableTriggerProps).value
                    ),
                  'data-state':
                    activeTabIndex === currentIndex ? 'active' : 'inactive',
                  'data-dragging': isDragging,
                } as React.HTMLAttributes<HTMLButtonElement>);
              }
              return child;
            })}

            {/* Invisible drag handle that sits on top of the active tab */}
            {indicatorPosition && (
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  'absolute inset-y-1 z-20 touch-none select-none',
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                )}
                style={{
                  transform: indicatorTransform,
                  width: `${indicatorWidth}px`,
                }}
                onMouseDown={handleIndicatorDragStart}
                onTouchStart={handleIndicatorDragStart}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowLeft' ? -1 : 1;
                    const tabs = context.tabs;
                    const newIndex = Math.max(
                      0,
                      Math.min(tabs.length - 1, activeTabIndex + direction)
                    );
                    if (newIndex !== activeTabIndex) {
                      setActiveTabIndex(newIndex);
                      if (onTabChange && tabs[newIndex]) {
                        onTabChange(tabs[newIndex].id);
                      }
                    }
                  }
                }}
                aria-label="Drag to move between tabs"
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);
TabsDraggableList.displayName = 'TabsDraggableList';

interface TabsDraggableTriggerProps {
  value: string;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  'data-state'?: 'active' | 'inactive';
  'data-dragging'?: boolean;
}

const TabsDraggableTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsDraggableTriggerProps
>(({ value: _value, className, icon, children, onClick, ...props }, ref) => {
  const dataState = props['data-state'];

  return (
    <button
      type="button"
      role="tab"
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative z-10 flex flex-nowrap items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
        dataState === 'active'
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground/80',
        className
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
});
TabsDraggableTrigger.displayName = 'TabsDraggableTrigger';

interface TabsDraggableContentProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const TabsDraggableContent = React.forwardRef<
  HTMLDivElement,
  TabsDraggableContentProps
>(({ value: _value, className, style, children }, ref) => {
  const context = React.useContext(TabsDraggableContext);
  const {
    parallaxMode,
    parallaxRatio,
    indicatorDragOffset,
    isDragging = false,
  } = context;


  // Calculate parallax transform if enabled
  const parallaxTransform = React.useMemo(() => {
    if (!parallaxMode || indicatorDragOffset === undefined) return '';

    // Content moves in the opposite direction at a reduced rate
    const contentOffset = -indicatorDragOffset * (parallaxRatio || 0.5);
    return `translateX(${contentOffset}px)`;
  }, [parallaxMode, indicatorDragOffset, parallaxRatio]);

  // Always render content for swipeable container
  // The container will handle positioning and visibility

  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center',
        !isDragging && 'transition-transform duration-300 ease-out',
        className
      )}
      style={{
        ...style,
        transform: parallaxTransform || style?.transform,
      }}
    >
      {children}
    </div>
  );
});

// Create a separate component for the draggable content container
interface TabsDraggableContentContainerProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  sectionGap?: number; // Horizontal gap between panels in pixels
  cardGap?: number; // Vertical gap between cards within panels in pixels
}

const TabsDraggableContentContainer = React.forwardRef<
  HTMLDivElement,
  TabsDraggableContentContainerProps
>(({ className, style, children, sectionGap = 0, cardGap = 8 }, _ref) => {
  const context = React.useContext(TabsDraggableContext);
  const {
    activeTabIndex,
    setActiveTabIndex,
    tabs,
    onTabChange,
    parallaxMode,
    parallaxRatio,
    indicatorDragOffset,
    swipeThreshold = 0.3,
    scrollVelocityThreshold = 50,
    isDragging: indicatorIsDragging = false,
  } = context;

  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);

  // Transition state management
  const [transitioningToIndex, setTransitioningToIndex] = React.useState<
    number | null
  >(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Gesture detection and scroll locking
  const [touchStartDirection, setTouchStartDirection] = React.useState<
    'horizontal' | 'vertical' | null
  >(null);
  const initialTouchPos = React.useRef<{ x: number; y: number } | null>(null);

  // Drag cooldown mechanism to prevent clicks immediately after drag
  const [isDragCooldown, setIsDragCooldown] = React.useState(false);
  const dragCooldownTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Window scroll position preservation
  const windowScrollPositionRef = React.useRef<number>(0);

  // Determine whether any dragging is happening (content drag or indicator drag in parallax mode)
  const isAnyDragging = isDragging || indicatorIsDragging;

  // Track vertical scroll velocity to disable horizontal swipes during fast scrolling
  const [verticalScrollVelocity, setVerticalScrollVelocity] = React.useState(0);
  const lastScrollY = React.useRef(0);
  const lastScrollTime = React.useRef(Date.now());

  // Calculate content offset based on mode
  const contentOffset = React.useMemo(() => {
    if (parallaxMode && indicatorDragOffset !== undefined) {
      // In parallax mode, content moves based on indicator drag
      return -indicatorDragOffset * (parallaxRatio || 0.5);
    }
    // In normal mode, use the drag offset
    return dragOffset;
  }, [parallaxMode, indicatorDragOffset, parallaxRatio, dragOffset]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const dragStartX = React.useRef(0);
  const velocityX = React.useRef(0);
  const lastX = React.useRef(0);

  const [containerWidth, setContainerWidth] = React.useState(0);


  // Update container width on resize
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Track vertical scroll velocity to disable horizontal swipes during fast scrolling
  React.useEffect(() => {
    const handleScroll = () => {
      const currentTime = Date.now();
      const currentScrollY = window.scrollY;
      const timeDiff = currentTime - lastScrollTime.current;
      const scrollDiff = currentScrollY - lastScrollY.current;

      if (timeDiff > 0) {
        const velocity = Math.abs(scrollDiff / timeDiff);
        setVerticalScrollVelocity(velocity);

        // Reset velocity after a shorter delay to be more responsive
        setTimeout(() => {
          setVerticalScrollVelocity(0);
        }, 100);
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Content dragging handlers
  const handleContentDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't start horizontal drag if user is scrolling vertically fast
    // Use a more conservative threshold to better detect vertical scrolling
    if (verticalScrollVelocity > scrollVelocityThreshold * 0.5) {
      return;
    }

    // Check if this event originated from a nested TabsDraggable
    const target = e.target as HTMLElement;
    const nestedTabsContainer = target.closest(
      '[data-tabs-draggable-container]'
    );
    const currentTabsContainer = containerRef.current;

    // If the event comes from a nested TabsDraggable that's not this one, don't handle it
    if (nestedTabsContainer && nestedTabsContainer !== currentTabsContainer) {
      return;
    }

    // Highest priority: Don't interfere with form elements, but allow tab triggers
    const isFormElement =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('input, textarea, select, [contenteditable="true"]') ||
      target.isContentEditable ||
      target.matches('[role="textbox"], [role="combobox"]');

    // Allow tab triggers to work, but prevent dragging on other buttons and form elements
    const isTabTrigger =
      target.closest('[role="tab"]') || target.closest('button[data-state]');
    const shouldPreventDrag =
      isFormElement || (target.tagName === 'BUTTON' && !isTabTrigger);

    if (shouldPreventDrag) {
      // Don't start dragging, but let the interactive element handle the event normally
      return;
    }

    // Also check if any focused element exists - don't interfere with keyboard input
    const activeEl = document.activeElement as HTMLElement;
    if (
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable ||
        activeEl.closest('input, textarea, [contenteditable="true"]'))
    ) {
      return;
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Store initial touch position for gesture detection
    initialTouchPos.current = { x: clientX, y: clientY };

    dragStartX.current = clientX - dragOffset;
    lastX.current = clientX;
    setIsDragging(true);
    setTouchStartDirection(null); // Reset direction detection

    // Prevent event from bubbling to parent TabsDraggable components
    e.stopPropagation();
  };

  const handleContentDrag = React.useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      // Don't interfere with focused input elements during drag
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Lock-in gesture direction detection
      if (touchStartDirection === null && initialTouchPos.current) {
        const deltaX = Math.abs(clientX - initialTouchPos.current.x);
        const deltaY = Math.abs(clientY - initialTouchPos.current.y);

        // Quick direction detection with immediate lock-in
        if (deltaX > 8 || deltaY > 8) {
          // Clear directional preference - once we detect a direction, lock into it
          if (deltaX > deltaY * 1.5) {
            // Clearly horizontal - lock in horizontal mode and prevent vertical scrolling
            setTouchStartDirection('horizontal');
            // Prevent default to lock vertical scrolling during horizontal gesture
            if (e.cancelable) {
              e.preventDefault();
            }
          } else if (deltaY > deltaX * 1.5) {
            // Clearly vertical - lock in vertical mode and block horizontal dragging
            setTouchStartDirection('vertical');
            setIsDragging(false);
            return;
          }
          // For less clear cases, wait for more movement before deciding
        }
      }

      // If locked into vertical mode, completely ignore horizontal movement
      if (touchStartDirection === 'vertical') {
        return;
      }

      // Prevent event from bubbling to parent TabsDraggable components
      e.stopPropagation();

      // If locked into horizontal mode, prevent vertical scrolling and continue with horizontal drag
      if (touchStartDirection === 'horizontal' && e.cancelable) {
        e.preventDefault(); // Prevent vertical scrolling once horizontal is locked
      }

      const offset = clientX - dragStartX.current;

      // Calculate velocity for momentum
      velocityX.current = clientX - lastX.current;
      lastX.current = clientX;

      // Apply elastic resistance at boundaries with more lenient constraints
      let elasticOffset = offset;
      const maxNormalDrag = containerWidth * 0.15; // Allow dragging up to 15% of container width

      if (activeTabIndex === 0 && offset > 0) {
        // First tab, dragging right - allow more drag distance before elastic resistance
        if (offset > maxNormalDrag) {
          const excess = offset - maxNormalDrag;
          elasticOffset = maxNormalDrag + excess * 0.3; // Elastic for excess
        }
      } else if (activeTabIndex === tabs.length - 1 && offset < 0) {
        // Last tab, dragging left - allow more drag distance before elastic resistance
        if (Math.abs(offset) > maxNormalDrag) {
          const excess = Math.abs(offset) - maxNormalDrag;
          elasticOffset = -(maxNormalDrag + excess * 0.3); // Elastic for excess
        }
      }

      // More generous maximum elastic bounds
      const maxElastic = containerWidth * 0.9;
      if (elasticOffset > maxElastic) {
        elasticOffset = maxElastic;
      } else if (elasticOffset < -maxElastic) {
        elasticOffset = -maxElastic;
      }

      setDragOffset(elasticOffset);
    },
    [
      isDragging,
      activeTabIndex,
      tabs.length,
      containerWidth,
      touchStartDirection,
    ]
  );

  const handleContentDragEnd = React.useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Set drag cooldown to prevent immediate navigation
    setIsDragCooldown(true);
    if (dragCooldownTimeoutRef.current) {
      clearTimeout(dragCooldownTimeoutRef.current);
    }
    dragCooldownTimeoutRef.current = setTimeout(() => {
      setIsDragCooldown(false);
    }, 200); // 200ms cooldown

    // IMPORTANT: If this was determined to be a vertical gesture, don't change tabs at all
    if (touchStartDirection === 'vertical') {
      setTouchStartDirection(null);
      initialTouchPos.current = null;
      setDragOffset(0); // Reset to original position
      return;
    }

    setTouchStartDirection(null);
    initialTouchPos.current = null;

    const threshold = containerWidth * swipeThreshold; // Use configurable threshold
    const velocity = velocityX.current;

    let newIndex = activeTabIndex;

    // Only process tab changes for gestures that were locked into horizontal mode
    if (touchStartDirection === 'horizontal') {
      // With lock-in behavior, we can trust horizontal gestures more
      // Determine new tab based on drag distance and velocity
      if (Math.abs(velocity) > 4) {
        // Fast swipe - very responsive
        if (velocity > 0) {
          // Swiping right (go to previous tab)
          newIndex = Math.max(0, activeTabIndex - 1);
        } else {
          // Swiping left (go to next tab)
          newIndex = Math.min(tabs.length - 1, activeTabIndex + 1);
        }
      } else if (Math.abs(dragOffset) > threshold) {
        // Slow drag past threshold
        if (dragOffset > 0) {
          // Dragging right (go to previous tab)
          newIndex = Math.max(0, activeTabIndex - 1);
        } else {
          // Dragging left (go to next tab)
          newIndex = Math.min(tabs.length - 1, activeTabIndex + 1);
        }
      } else if (Math.abs(dragOffset) > containerWidth * 0.2) {
        // Even smaller drags work since we're confident it's horizontal
        if (dragOffset > 0) {
          newIndex = Math.max(0, activeTabIndex - 1);
        } else {
          newIndex = Math.min(tabs.length - 1, activeTabIndex + 1);
        }
      }
    }

    // Handle transition if tab is changing
    if (newIndex !== activeTabIndex) {
      // Store current window scroll position before tab change
      windowScrollPositionRef.current = window.scrollY;

      setTransitioningToIndex(newIndex);
      setIsTransitioning(true);

      // Clear transition state after animation completes
      setTimeout(() => {
        setTransitioningToIndex(null);
        setIsTransitioning(false);

        // Restore window scroll position after transition
        requestAnimationFrame(() => {
          window.scrollTo(0, windowScrollPositionRef.current);
        });
      }, 300);
    }

    // Animate to final position
    setActiveTabIndex(newIndex);
    setDragOffset(0);

    if (newIndex !== activeTabIndex && onTabChange && tabs[newIndex]) {
      onTabChange(tabs[newIndex].id);
    }
  }, [
    isDragging,
    containerWidth,
    activeTabIndex,
    tabs,
    dragOffset,
    onTabChange,
    setActiveTabIndex,
    swipeThreshold,
    touchStartDirection,
  ]);

  // Global mouse/touch event listeners
  React.useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      handleContentDrag(e);
    };

    const handleGlobalEnd = () => {
      handleContentDragEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMove, {
        passive: false,
      });
      document.addEventListener('touchmove', handleGlobalMove, {
        passive: false,
      });
      document.addEventListener('mouseup', handleGlobalEnd, { passive: true });
      document.addEventListener('touchend', handleGlobalEnd, { passive: true });

      return () => {
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('touchmove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isDragging, handleContentDrag, handleContentDragEnd]);

  // Handle transition when activeTabIndex changes (from button clicks, etc)
  const prevActiveTabIndexRef = React.useRef(activeTabIndex);
  React.useEffect(() => {
    const prevIndex = prevActiveTabIndexRef.current;
    if (prevIndex !== activeTabIndex && !isDragging && !indicatorIsDragging) {
      // Tab changed programmatically (button click, keyboard, etc)
      // Store current window scroll position before tab change
      windowScrollPositionRef.current = window.scrollY;

      setTransitioningToIndex(activeTabIndex);
      setIsTransitioning(true);

      // Clear transition state after animation completes
      const timeoutId = setTimeout(() => {
        setTransitioningToIndex(null);
        setIsTransitioning(false);

        // Restore window scroll position after transition
        requestAnimationFrame(() => {
          window.scrollTo(0, windowScrollPositionRef.current);
        });
      }, 300);

      // Cleanup timeout on unmount or state change
      return () => clearTimeout(timeoutId);
    }
    prevActiveTabIndexRef.current = activeTabIndex;
  }, [activeTabIndex, isDragging, indicatorIsDragging]);

  // Calculate positions for flexbox layout
  // Each tab takes up (100 / tabs.length)% of the container width
  const tabWidthPercentage = 100 / tabs.length;
  const activeTabOffset = activeTabIndex * tabWidthPercentage;

  const contentTransform = parallaxMode
    ? `translateX(calc(-${activeTabOffset}% + ${contentOffset}px))`
    : `translateX(calc(-${activeTabOffset}% + ${dragOffset}px))`;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={style}
      data-tabs-draggable-container
      data-is-dragging={isAnyDragging}
      data-drag-cooldown={isDragCooldown}
      onMouseDown={parallaxMode ? undefined : handleContentDragStart}
      onTouchStart={parallaxMode ? undefined : handleContentDragStart}
    >
      <div
        ref={contentRef}
        className={cn(
          'flex',
          !isDragging && 'transition-transform duration-300 ease-out'
        )}
        style={{
          transform: contentTransform,
          width: `${tabs.length * 100}%`,
          gap: `${sectionGap}px`,
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeTabIndex;
          const isNeighbor = Math.abs(index - activeTabIndex) === 1;
          const shouldRender =
            isActive ||
            (isNeighbor && isDragging) ||
            (isNeighbor && isTransitioning);


          return (
            <div
              key={tab.id}
              className="flex-shrink-0"
              style={{
                width: `${100 / tabs.length}%`,
                height: isActive ? 'auto' : shouldRender ? 'auto' : '0px',
                overflow: isActive
                  ? 'visible'
                  : shouldRender
                    ? 'hidden'
                    : 'hidden',
                opacity: shouldRender ? 1 : 0,
                pointerEvents: isActive
                  ? 'auto'
                  : shouldRender
                    ? 'none'
                    : 'none',
                paddingLeft: index > 0 ? `${cardGap / 2}px` : '0',
                paddingRight:
                  index < tabs.length - 1 ? `${cardGap / 2}px` : '0',
              }}
            >
              {shouldRender && (
                <div className="h-full w-full">
                  {(() => {
                    const allChildren = React.Children.toArray(children);

                    const foundChild = allChildren.find((child) => {
                      const isValid = React.isValidElement(child);
                      const value = isValid
                        ? (child.props as { value?: string }).value
                        : null;
                      const matches = value === tab.id;
                      return isValid && matches;
                    });

                    return foundChild;
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
TabsDraggableContentContainer.displayName = 'TabsDraggableContentContainer';

TabsDraggableContent.displayName = 'TabsDraggableContent';

export {
  TabsDraggable,
  TabsDraggableList,
  TabsDraggableTrigger,
  TabsDraggableContent,
  TabsDraggableContentContainer,
};
