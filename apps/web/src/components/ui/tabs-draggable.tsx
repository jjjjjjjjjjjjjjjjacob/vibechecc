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
}>({
  activeTabIndex: 0,
  setActiveTabIndex: () => {},
  tabs: [],
  parallaxMode: false,
  parallaxRatio: 0.5,
  indicatorDragOffset: 0,
  isDragging: false,
});

interface TabsDraggableProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
  parallaxMode?: boolean; // Enable parallax effect between selector and content
  parallaxRatio?: number; // Ratio for content movement (0.5 = content moves half speed of selector)
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
    },
    ref
  ) => {
    const [tabs, setTabs] = React.useState<
      { id: string; label: string; icon?: React.ReactNode }[]
    >([]);

    const [activeTabIndex, setActiveTabIndex] = React.useState(() => {
      if (value) {
        const index = tabs.findIndex((tab) => tab.id === value);
        return index !== -1 ? index : 0;
      }
      if (defaultValue) {
        const index = tabs.findIndex((tab) => tab.id === defaultValue);
        return index !== -1 ? index : 0;
      }
      return 0;
    });

    const [indicatorDragOffset, setIndicatorDragOffset] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    React.useEffect(() => {
      if (value) {
        const index = tabs.findIndex((tab) => tab.id === value);
        if (index !== -1) {
          setActiveTabIndex(index);
        }
      }
    }, [value, tabs]);

    const handleTabChange = React.useCallback(
      (tabId: string) => {
        if (onValueChange) {
          onValueChange(tabId);
        }
      },
      [onValueChange]
    );

    return (
      <TabsDraggableContext.Provider
        value={{
          activeTabIndex,
          setActiveTabIndex,
          tabs,
          onTabChange: handleTabChange,
          parallaxMode,
          parallaxRatio,
          indicatorDragOffset,
          isDragging,
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
      <div ref={ref} className={cn('relative', className)}>
        <div className="flex items-center justify-center px-4 py-2">
          <div className="bg-muted/50 relative inline-flex gap-2 rounded-full p-1 backdrop-blur-sm">
            {/* Tab Indicator - visual background */}
            <div
              ref={indicatorRef}
              className={cn(
                'bg-background absolute inset-y-1 rounded-full shadow-sm',
                !isDragging && 'transition-transform duration-300 ease-out'
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
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
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
>(({ value, className, style, children }, ref) => {
  const context = React.useContext(TabsDraggableContext);
  const {
    activeTabIndex,
    tabs,
    parallaxMode,
    parallaxRatio,
    indicatorDragOffset,
    isDragging = false,
  } = context;

  // Find current tab index
  const currentTabIndex = tabs.findIndex((tab) => tab.id === value);
  const isActive = currentTabIndex === activeTabIndex;

  // Calculate parallax transform if enabled
  const parallaxTransform = React.useMemo(() => {
    if (!parallaxMode || indicatorDragOffset === undefined) return '';

    // Content moves in the opposite direction at a reduced rate
    const contentOffset = -indicatorDragOffset * (parallaxRatio || 0.5);
    return `translateX(${contentOffset}px)`;
  }, [parallaxMode, indicatorDragOffset, parallaxRatio]);

  // Only render if this content is active
  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center',
        parallaxMode &&
          !isDragging &&
          'transition-transform duration-300 ease-out',
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
}

const TabsDraggableContentContainer = React.forwardRef<
  HTMLDivElement,
  TabsDraggableContentContainerProps
>(({ className, style, children }, _ref) => {
  const context = React.useContext(TabsDraggableContext);
  const {
    activeTabIndex,
    setActiveTabIndex,
    tabs,
    onTabChange,
    parallaxMode,
    parallaxRatio,
    indicatorDragOffset,
  } = context;

  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);

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

  // Content dragging handlers
  const handleContentDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX - dragOffset;
    lastX.current = clientX;
    setIsDragging(true);
  };

  const handleContentDrag = React.useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const offset = clientX - dragStartX.current;

      // Calculate velocity for momentum
      velocityX.current = clientX - lastX.current;
      lastX.current = clientX;

      // Apply elastic resistance at boundaries
      const maxOffset = -(tabs.length - 1) * containerWidth;
      let elasticOffset = offset;

      if (activeTabIndex === 0 && offset > 0) {
        // First tab, dragging right (elastic resistance)
        elasticOffset = offset * 0.15; // Only allow 15% of drag distance
      } else if (activeTabIndex === tabs.length - 1 && offset < 0) {
        // Last tab, dragging left (elastic resistance)
        elasticOffset = offset * 0.15;
      }

      // Calculate the actual position considering the active tab
      const basePosition = -activeTabIndex * containerWidth;
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
    [isDragging, activeTabIndex, tabs.length, containerWidth]
  );

  const handleContentDragEnd = React.useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    const threshold = containerWidth * 0.3; // 30% threshold
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
  }, [isDragging, handleContentDrag, handleContentDragEnd]);

  // Calculate positions
  const contentTransform = parallaxMode
    ? `translateX(${-activeTabIndex * containerWidth + contentOffset}px)`
    : `translateX(${-activeTabIndex * containerWidth + dragOffset}px)`;

  return (
    <div
      ref={containerRef}
      role="region"
      tabIndex={0}
      className={cn(
        'relative min-h-[300px] cursor-default overflow-hidden sm:min-h-[400px]',
        className
      )}
      style={style}
      onMouseDown={parallaxMode ? undefined : handleContentDragStart}
      onTouchStart={parallaxMode ? undefined : handleContentDragStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // For keyboard access, we'll just switch to the next/previous tab
          if (e.key === 'Enter') {
            const nextIndex = Math.min(activeTabIndex + 1, tabs.length - 1);
            if (nextIndex !== activeTabIndex) {
              setActiveTabIndex(nextIndex);
              if (onTabChange && tabs[nextIndex]) {
                onTabChange(tabs[nextIndex].id);
              }
            }
          } else if (e.key === ' ') {
            const prevIndex = Math.max(activeTabIndex - 1, 0);
            if (prevIndex !== activeTabIndex) {
              setActiveTabIndex(prevIndex);
              if (onTabChange && tabs[prevIndex]) {
                onTabChange(tabs[prevIndex].id);
              }
            }
          }
        }
      }}
      aria-label="Swipe or drag to navigate between tab content"
    >
      <div
        ref={contentRef}
        className={cn(
          'flex h-full',
          !isDragging && 'transition-transform duration-300 ease-out'
        )}
        style={{
          transform: contentTransform,
          width: `${tabs.length * 100}%`,
        }}
      >
        {tabs.map((_, index) => (
          <div
            key={index}
            className="flex h-full items-center justify-center"
            style={{
              width: `${100 / tabs.length}%`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              {children}
            </div>
          </div>
        ))}
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
