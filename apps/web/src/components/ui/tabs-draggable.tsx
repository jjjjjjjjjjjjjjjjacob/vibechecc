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

    // Determine if component is controlled or uncontrolled
    const isControlled = value !== undefined;
    const [internalActiveTabIndex, setInternalActiveTabIndex] =
      React.useState(0);
    const [indicatorDragOffset, setIndicatorDragOffset] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    // Get the actual active tab index
    const activeTabIndex = React.useMemo(() => {
      if (isControlled && value && tabs.length > 0) {
        const index = tabs.findIndex((tab) => tab.id === value);
        return index !== -1 ? index : 0;
      }
      return internalActiveTabIndex;
    }, [isControlled, value, tabs, internalActiveTabIndex]);

    // Handle initial tab selection for uncontrolled mode
    React.useEffect(() => {
      if (!isControlled && tabs.length > 0 && defaultValue) {
        const index = tabs.findIndex((tab) => tab.id === defaultValue);
        if (index !== -1) {
          setInternalActiveTabIndex(index);
        }
      }
    }, [isControlled, defaultValue, tabs]);

    const handleTabChange = React.useCallback(
      (tabId: string) => {
        if (isControlled) {
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
      [isControlled, onValueChange, tabs]
    );

    const handleSetActiveTabIndex = React.useCallback(
      (index: number) => {
        if (isControlled) {
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
      [isControlled, onValueChange, tabs]
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
                } as React.HTMLAttributes<HTMLElement>);
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
                  'absolute inset-y-1 z-20 cursor-default touch-none select-none'
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
  onClick?: () => void;
  'data-state'?: 'active' | 'inactive';
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
}

const TabsDraggableContentContainer = React.forwardRef<
  HTMLDivElement,
  TabsDraggableContentContainerProps
>(({ className, style, children, sectionGap = 0 }, _ref) => {
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
  const [transitioningToIndex, setTransitioningToIndex] = React.useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  
  // Gesture detection and scroll locking
  const [touchStartDirection, setTouchStartDirection] = React.useState<'horizontal' | 'vertical' | null>(null);
  const [isScrollLocked, setIsScrollLocked] = React.useState(false);
  const initialTouchPos = React.useRef<{ x: number; y: number } | null>(null);
  const savedScrollY = React.useRef(0);

  // Determine whether any dragging is happening (content drag or indicator drag in parallax mode)
  const isAnyDragging = isDragging || indicatorIsDragging;

  // While dragging, also expand the neighbor tab in the drag direction so it's visible during the slide
  const neighborIndex: number | null = React.useMemo(() => {
    if (!isAnyDragging && !isTransitioning) return null;

    if (parallaxMode) {
      const offset = indicatorDragOffset || 0;
      if (offset === 0) return null;
      // Fix parallax direction: indicator moves right => show next tab (right)
      const direction = offset > 0 ? 1 : -1;
      const candidate = activeTabIndex + direction;
      if (candidate < 0 || candidate >= tabs.length) return null;
      return candidate;
    }

    // For normal drag mode
    if (dragOffset !== 0) {
      const direction = dragOffset > 0 ? -1 : 1; // content dragged right shows previous; left shows next
      const candidate = activeTabIndex + direction;
      if (candidate >= 0 && candidate < tabs.length) {
        return candidate;
      }
    }
    
    return null;
  }, [
    isAnyDragging,
    isTransitioning,
    parallaxMode,
    indicatorDragOffset,
    dragOffset,
    activeTabIndex,
    tabs.length,
  ]);

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
  
  // Scroll locking functions
  const lockBodyScroll = React.useCallback(() => {
    if (!isScrollLocked) {
      savedScrollY.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      setIsScrollLocked(true);
    }
  }, [isScrollLocked]);
  
  const unlockBodyScroll = React.useCallback(() => {
    if (isScrollLocked) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY.current);
      setIsScrollLocked(false);
    }
  }, [isScrollLocked]);

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

        // Reset velocity after a delay to allow horizontal swipes again
        setTimeout(() => {
          setVerticalScrollVelocity(0);
        }, 150);
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
    if (verticalScrollVelocity > scrollVelocityThreshold) {
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
      
      // Gesture direction detection on first move
      if (touchStartDirection === null && initialTouchPos.current) {
        const deltaX = Math.abs(clientX - initialTouchPos.current.x);
        const deltaY = Math.abs(clientY - initialTouchPos.current.y);
        
        // Only determine direction if there's significant movement
        if (deltaX > 5 || deltaY > 5) {
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
          
          if (angle > 60) {
            // Vertical gesture - don't handle horizontal swipe
            setTouchStartDirection('vertical');
            setIsDragging(false);
            return;
          } else if (angle < 30) {
            // Horizontal gesture - lock vertical scroll
            setTouchStartDirection('horizontal');
            lockBodyScroll();
          }
        }
      }
      
      // If this was determined to be a vertical gesture, ignore it
      if (touchStartDirection === 'vertical') {
        return;
      }

      // Prevent event from bubbling to parent TabsDraggable components
      e.stopPropagation();
      e.preventDefault();

      const offset = clientX - dragStartX.current;

      // Calculate velocity for momentum
      velocityX.current = clientX - lastX.current;
      lastX.current = clientX;

      // Apply elastic resistance at boundaries
      const stride = containerWidth + sectionGap; // distance from panel to panel including gap
      const maxOffset = -(tabs.length - 1) * stride;
      let elasticOffset = offset;

      if (activeTabIndex === 0 && offset > 0) {
        // First tab, dragging right (elastic resistance)
        elasticOffset = offset * 0.15; // Only allow 15% of drag distance
      } else if (activeTabIndex === tabs.length - 1 && offset < 0) {
        // Last tab, dragging left (elastic resistance)
        elasticOffset = offset * 0.15;
      }

      // Calculate the actual position considering the active tab
      const basePosition = -activeTabIndex * stride;
      const currentPosition = basePosition + elasticOffset;

      // Constrain to maximum elastic bounds (2% overscroll)
      const maxElastic = containerWidth * 0.167;
      if (currentPosition > maxElastic) {
        elasticOffset = maxElastic - basePosition;
      } else if (currentPosition < maxOffset - maxElastic) {
        elasticOffset = maxOffset - maxElastic - basePosition;
      }

      setDragOffset(elasticOffset);
    },
    [isDragging, activeTabIndex, tabs.length, containerWidth, sectionGap, touchStartDirection, lockBodyScroll]
  );

  const handleContentDragEnd = React.useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    
    // Unlock body scroll if it was locked
    unlockBodyScroll();
    setTouchStartDirection(null);
    initialTouchPos.current = null;

    const threshold = containerWidth * swipeThreshold; // Use configurable threshold
    const velocity = velocityX.current;

    let newIndex = activeTabIndex;

    // Determine new tab based on drag distance and velocity
    if (Math.abs(velocity) > 10) {
      // Fast swipe
      newIndex =
        velocity > 0
          ? Math.max(0, activeTabIndex - 1)
          : Math.min(tabs.length - 1, activeTabIndex + 1);
    } else if (Math.abs(dragOffset) > threshold) {
      // Slow drag past threshold
      newIndex =
        dragOffset > 0
          ? Math.max(0, activeTabIndex - 1)
          : Math.min(tabs.length - 1, activeTabIndex + 1);
    }

    // Handle transition if tab is changing
    if (newIndex !== activeTabIndex) {
      setTransitioningToIndex(newIndex);
      setIsTransitioning(true);
      
      // Clear transition state after animation completes
      setTimeout(() => {
        setTransitioningToIndex(null);
        setIsTransitioning(false);
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
    unlockBodyScroll,
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
      setTransitioningToIndex(activeTabIndex);
      setIsTransitioning(true);
      
      // Clear transition state after animation completes
      const timeoutId = setTimeout(() => {
        setTransitioningToIndex(null);
        setIsTransitioning(false);
      }, 300);
      
      // Cleanup timeout on unmount or state change
      return () => clearTimeout(timeoutId);
    }
    prevActiveTabIndexRef.current = activeTabIndex;
  }, [activeTabIndex, isDragging, indicatorIsDragging]);
  
  // Cleanup scroll lock on unmount
  React.useEffect(() => {
    return () => {
      unlockBodyScroll();
    };
  }, [unlockBodyScroll]);

  // Calculate positions
  const stride = containerWidth + sectionGap;
  const contentTransform = parallaxMode
    ? `translateX(${-(activeTabIndex * stride) + contentOffset}px)`
    : `translateX(${-(activeTabIndex * stride) + dragOffset}px)`;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={style}
      data-tabs-draggable-container
      onMouseDown={parallaxMode ? undefined : handleContentDragStart}
      onTouchStart={parallaxMode ? undefined : handleContentDragStart}
    >
      <style>
        {`
          input,
          textarea,
          button,
          select,
          [contenteditable="true"] {
            pointer-events: auto !important;
            touch-action: auto !important;
            user-select: auto !important;
          }
        `}
      </style>

      <div
        ref={contentRef}
        className={cn(
          'flex items-center justify-center',
          !isDragging && 'transition-transform duration-300 ease-out'
        )}
        style={{
          transform: contentTransform,
          width: sectionGap > 0 ? undefined : `${tabs.length * 100}%`,
          columnGap: sectionGap > 0 ? `${sectionGap}px` : undefined,
        }}
      >
        {tabs.map((tab, index) => {
          // Enhanced visibility logic: show active, neighbor (during drag), and transitioning tabs
          const isVisible =
            index === activeTabIndex ||
            (neighborIndex !== null && index === neighborIndex) ||
            (transitioningToIndex !== null && index === transitioningToIndex);
            
          return (
            <div
              key={tab.id}
              className={cn(
                'min-h-0', // Allow shrinking
                isVisible ? 'h-auto' : 'h-0 overflow-hidden'
              )}
              style={{
                width:
                  sectionGap > 0 && containerWidth > 0
                    ? `${containerWidth}px`
                    : `${100 / tabs.length}%`,
              }}
            >
              <div
                className={cn(
                  'w-full',
                  isVisible ? 'h-auto' : 'h-0 overflow-hidden'
                )}
                style={{
                  pointerEvents: 'auto',
                }}
              >
                {React.Children.toArray(children).find((child) => {
                  if (
                    React.isValidElement(child) &&
                    (child.props as { value?: string }).value === tab.id
                  ) {
                    return child;
                  }
                  return null;
                })}
              </div>
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
