import React, { useEffect, useRef } from 'react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Function to get the current caret (cursor) position
  const getCaretPosition = (el: HTMLDivElement): number => {
    let caretOffset = 0;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(el);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  };

  // Function to set the caret (cursor) position
  const setCaretPosition = (el: HTMLDivElement, position: number) => {
    const selection = window.getSelection();
    const range = document.createRange();
    let charIndex = 0;

    const traverseNodes = (node: Node): boolean => {
      if (node.nodeType === 3) { // Text node
        const textLength = node.textContent?.length ?? 0;
        if (charIndex + textLength >= position) {
          const offset = position - charIndex;
          range.setStart(node, offset);
          range.setEnd(node, offset);
          return true;
        }
        charIndex += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (traverseNodes(node.childNodes[i])) {
            return true;
          }
        }
      }
      return false;
    };

    if (selection) {
      traverseNodes(el);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const caretPosition = getCaretPosition(editorRef.current); // Save caret position
      editorRef.current.innerHTML = value; // Update innerHTML
      setCaretPosition(editorRef.current, caretPosition); // Restore caret position
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML); // Pass updated content to parent
    }
  };

  return (
    <div className="text-editor">
      {/* Editable Textbox */}
      <div
        ref={editorRef}
        className="border p-2 min-h-[100px] outline-none"
        contentEditable="true"
        onInput={handleInput} // Handle content change
        onBlur={handleInput}  // Handle onBlur to ensure content is saved
      ></div>
    </div>
  );
};

export default TextEditor;
export { TextEditor };
