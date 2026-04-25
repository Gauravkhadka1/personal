import React, { useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Button } from "@/components/ui/button";
import { List, ListOrdered, Paperclip, X, Palette } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  withAttachments?: boolean;
  attachments?: File[];
  onAttachmentsChange?: (files: File[]) => void;
  attachmentPreviews?: string[];
  onRemoveAttachment?: (index: number) => void;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onContentChange,
  placeholder = "Write something...",
  className = "",
  withAttachments = false,
  attachments = [],
  onAttachmentsChange,
  attachmentPreviews = [],
  onRemoveAttachment,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-4",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-4",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "list-item",
          },
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 hover:underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-md border max-w-full h-auto",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!readOnly && onContentChange) {
        const html = editor.getHTML();
        onContentChange(html);
      }
    },
    editorProps: {
      handlePaste: (view, event) => {
        if (readOnly) return false;
        
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const base64 = readerEvent.target?.result;
                if (base64) {
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({
                        src: base64,
                      })
                    )
                  );
                }
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
      attributes: {
        class: `prose prose-sm dark:prose-invert min-h-[200px] max-w-none p-3 text-gray-900 dark:text-gray-300 focus:outline-none ${
          readOnly ? "bg-gray-50 cursor-default rounded-lg" : "bg-white "
        } ${className}`,
      },
    },
    editable: !readOnly,
  });

  // Update content when it changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    
    if (e.target.files && onAttachmentsChange) {
      const files = Array.from(e.target.files);
      onAttachmentsChange([...attachments, ...files]);
    }
  };

  // Predefined color palette
  const colorOptions = [
    { name: "Black", value: "#000000" },
    { name: "Gray", value: "#6B7280" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F97316" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Green", value: "#22C55E" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
  ];

  const renderToolbar = () => {
    if (!editor || readOnly) return null;

    return (
      <div className="toolbar border-b border-gray-200 px-1 dark:border-gray-700 flex flex-wrap gap-1 rounded-lg">
        {/* Text formatting buttons */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive("bold")
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 "
          }`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${
            editor.isActive("italic")
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Italic"
        >
          <em>I</em>
        </button>
        
        {/* Color picker dropdown */}
        <div className="relative group">
          <button
            type="button"
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
              editor.isActive('textStyle', { color: /^#/ }) 
                ? "bg-gray-200 dark:bg-gray-700" 
                : ""
            }`}
            title="Text Color"
          >
            <Palette className="h-4 w-4" />
          </button>
          
          {/* Color palette dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 p-2 min-w-[120px] hidden group-hover:block">
            <div className="grid grid-cols-3 gap-1 mb-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().setColor(color.value).run()}
                  title={color.name}
                />
              ))}
            </div>
            
            {/* Custom color input */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="w-6 h-6 cursor-pointer"
                title="Custom Color"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Custom</span>
            </div>
            
            {/* Reset color button */}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="w-full mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-center"
            >
              Reset Color
            </button>
          </div>
        </div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${
            editor.isActive("bulletList")
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4"/>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${
            editor.isActive("orderedList")
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4"/>
        </button>

        {/* Links */}
        <button
          type="button"
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            const url = prompt("Enter URL:", previousUrl || "https://");
            if (url !== null) {
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
              } else {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: url })
                  .run();
              }
            }
          }}
          className={`p-2 rounded ${
            editor.isActive("link")
              ? "bg-gray-200 dark:bg-gray-700"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          className={`p-2 rounded ${
            !editor.isActive("link")
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Remove Link"
        >
          🚫🔗
        </button>
      </div>
    );
  };

  return (
    <div className={`border border-gray-300 dark:border-gray-700 rounded-lg ${
      readOnly ? "bg-gray-50 dark:bg-secondary rounded-lg" : "bg-white dark:bg-secondary dark:text-gray-300 rounded-lg"
    }`}>
      {renderToolbar()}
      <EditorContent editor={editor} />
      
      {!readOnly && withAttachments && onAttachmentsChange && onRemoveAttachment && (
        <>
          {/* Attachment previews */}
          {attachmentPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
              {attachmentPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  {preview ? (
                    <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md border border-gray-200 bg-gray-100">
                      <Paperclip className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive/80 p-0 text-white hover:bg-destructive"
                    onClick={() => onRemoveAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Attachment button */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Attach Files
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default RichTextEditor;