import { useRef, useState } from 'react'; // React hooks for state and refs
import { flushSync } from 'react-dom'; // Force synchronous DOM updates

/**
 * Inline editable text component that toggles between a read-only button
 * and a text input. When the user submits or blurs the field, the new
 * value is reported through the `onChange` callback.
 */
export function EditableText({
  fieldName,
  value,
  inputClassName,
  inputLabel,
  buttonClassName,
  buttonLabel,
  onChange,
  editState,
}: {
  fieldName: string; // name attribute for the input element
  value: string; // current text value to display
  inputClassName: string; // styling for the input element
  inputLabel: string; // accessible label for the input
  buttonClassName: string; // styling for the button element
  buttonLabel: string; // accessible label for the button
  onChange: (value: string) => void; // callback when the value changes
  editState?: [boolean, (value: boolean) => void]; // optional external edit state
}) {
  const localEditState = useState(false); // local toggle state when none is provided
  const [edit, setEdit] = editState || localEditState; // prefer external state but fallback to local
  const inputRef = useRef<HTMLInputElement>(null); // ref pointing to the text input
  const buttonRef = useRef<HTMLButtonElement>(null); // ref pointing to the toggle button

  return edit ? (
    <form
      onSubmit={(event) => {
        event.preventDefault(); // prevent default form submission

        onChange(inputRef.current!.value); // emit new value to parent

        flushSync(() => {
          setEdit(false); // leave edit mode synchronously
        });

        buttonRef.current?.focus(); // return focus to the button for accessibility
      }}
    >
      <input
        required // ensure a value is provided before submission
        ref={inputRef} // attach ref for later access
        type="text" // plain text field
        aria-label={inputLabel} // accessible name for screen readers
        name={fieldName} // form field name
        defaultValue={value} // initial value shown in the input
        className={inputClassName} // allow external styling
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            flushSync(() => {
              setEdit(false); // exit edit mode when escape is pressed
            });
            buttonRef.current?.focus(); // move focus back to button
          }
        }}
        onBlur={(_event) => {
          if (
            inputRef.current?.value !== value && // value actually changed
            inputRef.current?.value.trim() !== '' // and is not just whitespace
          ) {
            onChange(inputRef.current!.value); // propagate changed value
          }
          setEdit(false); // always exit edit mode on blur
        }}
      />
    </form>
  ) : (
    <button
      aria-label={buttonLabel} // accessible text for screen readers
      type="button" // avoid submitting any surrounding form
      ref={buttonRef} // capture button reference for focus management
      onClick={() => {
        flushSync(() => {
          setEdit(true); // enter edit mode synchronously
        });
        inputRef.current?.select(); // highlight current value for quick replacement
      }}
      className={buttonClassName} // custom styling for the button
    >
      {value || <span className="text-slate-400 italic">edit</span>} // display
      placeholder when empty
    </button>
  );
}
