import * as React from 'react';
import {
  Tabs,
  TabsList as TabAccordionList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { cn } from '@/utils/tailwind-utils';

function TabAccordion({ ...props }: React.ComponentProps<typeof Tabs>) {
  // Determine if this is controlled or uncontrolled
  const isControlled = props.value !== undefined;

  // For the accordion, we need to provide a consistent controlled/uncontrolled pattern
  const accordionProps = {
    type: 'single' as const,
    orientation: props.orientation,
    dir: props.dir,
    onValueChange: props.onValueChange,
    ...(isControlled
      ? { value: props.value }
      : { defaultValue: props.defaultValue }),
  };

  return (
    <Accordion {...accordionProps}>
      <Tabs {...props} />
    </Accordion>
  );
}

function TabAccordionTrigger({
  value,
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <AccordionTrigger value={value} asChild {...props}>
      <TabsTrigger
        value={value}
        className={cn('relative', className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </TabsTrigger>
    </AccordionTrigger>
  );
}

function TabAccordionContent({
  value,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsContent>) {
  return (
    <AccordionItem value={value} asChild {...props}>
      <AccordionContent className="border-b-0" {...props}>
        <TabsContent
          value={value}
          className={cn('relative', className)}
          {...props}
        >
          {children}
        </TabsContent>
      </AccordionContent>
    </AccordionItem>
  );
}

export {
  TabAccordion,
  TabAccordionList,
  TabAccordionTrigger,
  TabAccordionContent,
};
