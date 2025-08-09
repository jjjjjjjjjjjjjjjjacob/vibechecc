import { useEffect, useRef, useState, ReactNode, createRef } from 'react';
import { cn } from '@/utils/tailwind-utils';
import { DialogPortal } from '@/components/ui/dialog';

interface AccordionMenuProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  collapsible?: boolean;
  className?: string;
  durationMs?: number;
  children: ReactNode;
  overlayOpen?: boolean;
  onOverlayClose?: () => void;
  overlayClassName?: string;
  scaleBackgroundOnOverlay?: boolean;
  darkenBackgroundOnOverlay?: boolean;
}

interface PanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function AccordionMenu({
  value,
  defaultValue = null,
  onValueChange,
  collapsible = true,
  className,
  durationMs = 250,
  children,
  overlayOpen = false,
  onOverlayClose,
  overlayClassName,
  scaleBackgroundOnOverlay = true,
  darkenBackgroundOnOverlay = false,
}: AccordionMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  const registry = useRef<Map<string, React.RefObject<HTMLDivElement>>>(
    new Map()
  );
  const [internalValue, setInternalValue] = useState<string | null>(
    defaultValue ?? null
  );
  const activeValue = value !== undefined ? value : internalValue;

  useEffect(() => {
    const el = activeValue ? registry.current.get(activeValue)?.current : null;
    const targetHeight = el ? el.scrollHeight : 0;
    setHeight(targetHeight);
  }, [activeValue]);

  useEffect(() => {
    if (activeValue === null || activeValue === undefined) {
      setHeight(0);
    }
  }, [activeValue]);

  useEffect(() => {
    if (!activeValue) return;
    const el = registry.current.get(activeValue)?.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setHeight(el.scrollHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!overlayOpen || !scaleBackgroundOnOverlay) return;
    const vaulOpen = !!document.querySelector('[data-vaul-drawer]');
    const wrapper = document.querySelector(
      '[data-vaul-drawer-wrapper]'
    ) as HTMLElement | null;
    if (vaulOpen || !wrapper) return;

    const TRANSITION = '0.5s cubic-bezier(0.32, 0.72, 0, 1)';
    const BORDER_RADIUS = 8;
    const WINDOW_TOP_OFFSET = 26;
    const prev = {
      transformOrigin: wrapper.style.transformOrigin,
      transitionProperty: wrapper.style.transitionProperty,
      transitionDuration: wrapper.style.transitionDuration,
      transitionTimingFunction: wrapper.style.transitionTimingFunction,
      borderRadius: wrapper.style.borderRadius,
      overflow: wrapper.style.overflow,
      transform: wrapper.style.transform,
    };
    const prevBodyBg = document.body.style.background;

    const scale = (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
    wrapper.style.transformOrigin = 'top';
    wrapper.style.transitionProperty = 'transform, border-radius';
    wrapper.style.transitionDuration = TRANSITION.split(' ')[0];
    wrapper.style.transitionTimingFunction = TRANSITION.split(' ')
      .slice(1)
      .join(' ');
    wrapper.style.borderRadius = `${BORDER_RADIUS}px`;
    wrapper.style.overflow = 'hidden';
    wrapper.style.transform = `scale(${scale}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`;
    if (darkenBackgroundOnOverlay) {
      try {
        const root = document.documentElement;
        const cssBg = getComputedStyle(root)
          .getPropertyValue('--background')
          .trim();
        if (cssBg) {
          document.body.style.background = cssBg;
        }
      } catch {}
    }

    return () => {
      wrapper.style.transformOrigin = prev.transformOrigin;
      wrapper.style.transitionProperty = prev.transitionProperty;
      wrapper.style.transitionDuration = prev.transitionDuration;
      wrapper.style.transitionTimingFunction = prev.transitionTimingFunction;
      wrapper.style.borderRadius = prev.borderRadius;
      wrapper.style.overflow = prev.overflow;
      wrapper.style.transform = prev.transform;
      if (darkenBackgroundOnOverlay) {
        document.body.style.background = prevBodyBg;
      }
    };
  }, [overlayOpen, scaleBackgroundOnOverlay, darkenBackgroundOnOverlay]);

  return (
    <>
      <div
        className={cn('relative w-full overflow-hidden', className)}
        style={{
          height: activeValue ? height : 0,
          transition: `height ${durationMs}ms ease`,
        }}
        ref={containerRef}
      >
        <div className="relative">
          {ChildrenMapper(children, (child) => {
            if (!child) return null;
            if (typeof child !== 'object' || !('props' in child)) return child;
            // @ts-expect-error runtime tag
            if (child.type?.displayName !== 'AccordionMenuContent')
              return child;

            const val = (child.props as PanelProps).value;
            if (!registry.current.has(val)) {
              registry.current.set(
                val,
                (child.props as any)._ref ?? createRef()
              );
            }
            const ref = registry.current.get(val)!;
            const isActive = activeValue === val;

            return (
              <div
                key={val}
                ref={ref}
                data-state={isActive ? 'active' : 'idle'}
                className={cn(
                  'absolute inset-x-0 top-0 transition-opacity duration-200',
                  isActive
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0'
                )}
                aria-hidden={!isActive}
              >
                <div
                  className={cn(
                    'transition-transform duration-200',
                    isActive ? 'translate-y-0' : 'translate-y-1'
                  )}
                >
                  {child.props.children}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

AccordionMenu.displayName = 'AccordionMenu';

export function AccordionMenuContent({
  value,
  children,
  className,
}: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      // @ts-expect-error internal ref for registry
      _ref={ref}
      data-value={value}
      className={cn('relative', className)}
    >
      {children}
    </div>
  );
}

AccordionMenuContent.displayName = 'AccordionMenuContent';

function ChildrenMapper(children: ReactNode, map: (child: any) => any) {
  const out: any[] = [];
  const it = (Array.isArray(children) ? children : [children]) as any[];
  for (const child of it) {
    if (Array.isArray(child)) {
      for (const c of child) out.push(map(c));
    } else {
      out.push(map(child));
    }
  }
  return out;
}
