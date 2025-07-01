import { useRef } from 'react';
import invariant from 'tiny-invariant';

import { ItemMutationFields } from '../types';
import { useCreateVibeMutation } from '../queries';
import { itemSchema } from '../db/schema';
import { SaveButton } from '@/components/save-button';
import { CancelButton } from '@/components/cancel-button';

export function NewCard({
  columnId,
  boardId,
  nextOrder,
  onComplete,
}: {
  columnId: string;
  boardId: string;
  nextOrder: number;
  onComplete: () => void;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { mutate } = useCreateVibeMutation();

  return (
    <form
      method="post"
      className="border-t-2 border-b-2 border-transparent px-2 py-1"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const id = crypto.randomUUID();
        formData.set(ItemMutationFields.id.name, id);

        invariant(textAreaRef.current);
        textAreaRef.current.value = '';

        const itemData = itemSchema.parse(
          Object.fromEntries(formData.entries())
        );
        // Transform card data to vibe format for compatibility
        mutate({
          title: itemData.title,
          description: itemData.content || itemData.title,
        });
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onComplete();
        }
      }}
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input
        type="hidden"
        name={ItemMutationFields.columnId.name}
        value={columnId}
      />
      <input
        type="hidden"
        name={ItemMutationFields.order.name}
        value={nextOrder}
      />

      <textarea
        autoFocus
        required
        ref={textAreaRef}
        name={ItemMutationFields.title.name}
        placeholder="Enter a title for this card"
        className="h-14 w-full resize-none rounded-lg px-2 py-1 text-sm shadow outline-none placeholder:text-sm placeholder:text-slate-500"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            invariant(buttonRef.current, 'expected button ref');
            buttonRef.current.click();
          }
          if (event.key === 'Escape') {
            onComplete();
          }
        }}
        onChange={(event) => {
          const el = event.currentTarget;
          el.style.height = el.scrollHeight + 'px';
        }}
      />
      <div className="flex justify-between">
        <SaveButton ref={buttonRef}>Save Card</SaveButton>
        <CancelButton onClick={onComplete}>Cancel</CancelButton>
      </div>
    </form>
  );
}
