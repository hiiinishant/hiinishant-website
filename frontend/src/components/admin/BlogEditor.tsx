"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Youtube } from "@tiptap/extension-youtube";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Highlight } from "@tiptap/extension-highlight";
import { useState, useRef, useEffect } from "react";
import { API_BASE } from "@/lib/api";

// Extend Tiptap's Image extension to support custom attributes: width, alignment, caption
const CustomImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "large", // small, medium, large, full
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
          class: `img-width-${attributes.width}`,
        }),
        parseHTML: (element) => element.getAttribute("data-width") || "large",
      },
      align: {
        default: "center", // left, center, right
        renderHTML: (attributes) => ({
          "data-align": attributes.align,
          class: `img-align-${attributes.align}`,
        }),
        parseHTML: (element) => element.getAttribute("data-align") || "center",
      },
      caption: {
        default: "",
        renderHTML: (attributes) => ({
          "data-caption": attributes.caption,
        }),
        parseHTML: (element) => element.getAttribute("data-caption") || "",
      },
    };
  },
});

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BlogEditor({ value, onChange }: BlogEditorProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tableZoom, setTableZoom] = useState(100); // percent: 50–150

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: "bg-zinc-950/80 border border-white/5 rounded-xl p-4 my-6 font-mono text-sm text-brand-200 overflow-x-auto",
          },
        },
      }),
      CustomImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-xl border border-white/5 mx-auto block max-w-full h-auto object-cover",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Write your article content here...",
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-accent underline hover:text-accent-light",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: false,
      }),
      BubbleMenuExtension,
    ],
    content: "",
    // Required for Next.js: avoid SSR hydration mismatch with ProseMirror
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-brand max-w-none focus:outline-none min-h-[400px] text-brand-300 px-5 py-6",
      },
      // Handle drag & drop image
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file);
            return true;
          }
        }
        return false;
      },
      // Handle paste image
      handlePaste(view, event) {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync content when value changes externally (e.g. during load or edit toggle)
  useEffect(() => {
    if (!editor || !value) return;
    try {
      const currentJSON = JSON.stringify(editor.getJSON());
      if (value !== currentJSON) {
        const parsed = JSON.parse(value);
        editor.commands.setContent(parsed);
      }
    } catch {
      // Fallback if value is plain markdown/text (for existing posts)
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const uploadImage = async (file: File) => {
    setUploadProgress(10);
    try {
      const token = sessionStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append("image", file);

      setUploadProgress(30);

      const backendUrl = API_BASE;
      const res = await fetch(`${backendUrl}/api/blog/upload-image`, {
        method: "POST",
        headers,
        body: formData,
      });

      setUploadProgress(70);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload image.");
      }

      const data = await res.json();
      setUploadProgress(100);

      // Insert image node at current cursor position
      editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run();

      setTimeout(() => setUploadProgress(null), 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message || "Image upload failed");
      setUploadProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadImage(e.target.files[0]);
    }
  };

  const handleInsertYoutube = () => {
    const url = prompt("Enter YouTube video URL:");
    if (url) {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  const handleSetLink = () => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = prompt("Enter link URL (e.g. https://example.com):", previousUrl);

    if (url === null) return; // user cancelled

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  };

  if (!editor) return null;

  // Selected image attributes overlay helpers
  const selectedImageAttrs = editor.isActive("image")
    ? editor.getAttributes("image")
    : null;

  type ImageAttrs = {
    width?: "small" | "medium" | "large" | "full";
    align?: "left" | "center" | "right";
    caption?: string;
  };

  const updateImageAttr = (attrs: ImageAttrs) => {
    if (selectedImageAttrs) {
      editor.chain().focus().updateAttributes("image", attrs).run();
    }
  };

  return (
    <div className="flex flex-col border border-white/5 rounded-xl bg-zinc-950/40 focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 focus-within:bg-zinc-950/70 transition-all overflow-hidden font-sans">
      {/* Main Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-white/5 bg-zinc-950/60 items-center justify-between">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Text Formats */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 text-xs rounded-lg transition-colors font-bold ${
              editor.isActive("bold") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 text-xs rounded-lg transition-colors italic ${
              editor.isActive("italic") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 text-xs rounded-lg transition-colors line-through ${
              editor.isActive("strike") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Strikethrough"
          >
            S
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 text-xs rounded-lg transition-colors font-bold ${
              editor.isActive("highlight") ? "bg-amber-500/30 text-amber-300 border border-amber-500/40" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Highlight Text"
          >
            🟡 Highlight
          </button>
          <button
            type="button"
            onClick={handleSetLink}
            className={`p-2 text-xs rounded-lg transition-colors font-semibold ${
              editor.isActive("link") ? "bg-accent/20 text-accent border border-accent/40" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Insert / Edit Link"
          >
            🔗 Link
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 text-xs rounded-lg transition-colors font-mono ${
              editor.isActive("code") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Inline Code"
          >
            &lt;/&gt;
          </button>

          <span className="w-px h-4 bg-white/10 mx-1"></span>

          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 text-xs rounded-lg transition-colors font-bold ${
              editor.isActive("heading", { level: 1 }) ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 text-xs rounded-lg transition-colors font-bold ${
              editor.isActive("heading", { level: 2 }) ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 text-xs rounded-lg transition-colors font-bold ${
              editor.isActive("heading", { level: 3 }) ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
          >
            H3
          </button>

          <span className="w-px h-4 bg-white/10 mx-1"></span>

          {/* Lists & Tasks */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 text-xs rounded-lg transition-colors ${
              editor.isActive("bulletList") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 text-xs rounded-lg transition-colors ${
              editor.isActive("orderedList") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Numbered List"
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 text-xs rounded-lg transition-colors ${
              editor.isActive("taskList") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Checklist / Task List"
          >
            ☑ Checklist
          </button>

          <span className="w-px h-4 bg-white/10 mx-1"></span>

          {/* Blocks */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 text-xs rounded-lg transition-colors ${
              editor.isActive("blockquote") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Blockquote"
          >
            “ Quote
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 text-xs rounded-lg transition-colors ${
              editor.isActive("codeBlock") ? "bg-accent/20 text-accent" : "text-brand-400 hover:text-white hover:bg-white/5"
            }`}
            title="Code Block"
          >
            CodeBlock
          </button>

          <span className="w-px h-4 bg-white/10 mx-1"></span>

          {/* 📊 TABLE INSERTION */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
              editor.isActive("table")
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-white/5 text-brand-300 hover:text-white hover:bg-white/10 border-white/10"
            }`}
            title="Insert Table (3x3)"
          >
            📊 Insert Table
          </button>

          <span className="w-px h-4 bg-white/10 mx-1"></span>

          {/* Media Inserts */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-brand-300 hover:text-white hover:bg-white/10 border border-white/10 flex items-center gap-1 transition-colors"
          >
            🖼️ Image
          </button>

          <button
            type="button"
            onClick={handleInsertYoutube}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-brand-300 hover:text-white hover:bg-white/10 border border-white/10 flex items-center gap-1 transition-colors"
          >
            🎥 YouTube
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 text-xs text-brand-500 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 text-xs text-brand-500 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
          >
            ↻
          </button>
        </div>
      </div>

      {/* 📊 DYNAMIC TABLE CONTROLS SUB-BAR (visible when cursor is inside a table) */}
      {editor.isActive("table") && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 font-mono">
          <span className="font-bold text-amber-400 mr-2 flex items-center gap-1">
            📊 Table Editor:
          </span>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors"
            title="Add Row Above"
          >
            + Row Above
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors"
            title="Add Row Below"
          >
            + Row Below
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 transition-colors"
            title="Delete Row"
          >
            - Delete Row
          </button>

          <span className="w-px h-4 bg-white/20 mx-1"></span>

          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors"
            title="Add Column Left"
          >
            + Col Left
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors"
            title="Add Column Right"
          >
            + Col Right
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 transition-colors"
            title="Delete Column"
          >
            - Delete Col
          </button>

          <span className="w-px h-4 bg-white/20 mx-1"></span>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold transition-colors"
            title="Toggle Header Row"
          >
            📌 Header Row
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold ml-auto transition-colors"
            title="Delete Table"
          >
            🗑️ Delete Table
          </button>

          <span className="w-px h-4 bg-white/20 mx-1"></span>

          {/* ── Zoom Controls ── */}
          <span className="text-brand-500 text-[10px] font-bold uppercase tracking-wider ml-1">Zoom:</span>
          <button
            type="button"
            onClick={() => setTableZoom((z) => Math.max(50, z - 10))}
            disabled={tableZoom <= 50}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Zoom Out Table"
          >
            🔍−
          </button>
          <span className="px-2 py-1 rounded bg-zinc-900 border border-white/10 text-amber-300 font-mono text-[11px] min-w-[44px] text-center">
            {tableZoom}%
          </span>
          <button
            type="button"
            onClick={() => setTableZoom((z) => Math.min(150, z + 10))}
            disabled={tableZoom >= 150}
            className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Zoom In Table"
          >
            🔍+
          </button>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {uploadProgress !== null && (
        <div className="bg-zinc-900 border-b border-white/5 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-accent">
          <span>Uploading content image to Cloudinary...</span>
          <div className="flex items-center gap-3 w-40">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span>{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div
        className="relative"
        style={tableZoom !== 100 ? { "--table-zoom": `${tableZoom / 100}` } as React.CSSProperties : undefined}
      >
        {tableZoom !== 100 && (
          <style>{`.ProseMirror table { transform: scale(var(--table-zoom, 1)); transform-origin: top left; }`}</style>
        )}
        <EditorContent editor={editor} />

        {/* Image bubble menu/editor for sizing, alignment & caption */}
        {editor && editor.isActive("image") && selectedImageAttrs && (
          <BubbleMenu
            editor={editor}
            shouldShow={({ editor }) => editor.isActive("image")}
            className="flex flex-col gap-2 p-3 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md max-w-xs font-sans text-xs text-brand-300"
          >
            <div className="font-semibold text-white border-b border-white/5 pb-1 mb-1">Image Settings</div>
            
            {/* Alignments */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">Alignment</span>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => updateImageAttr({ align })}
                    className={`flex-1 py-1 rounded transition-colors border ${
                      selectedImageAttrs.align === align
                        ? "bg-accent/20 border-accent/40 text-accent font-semibold"
                        : "border-white/5 hover:bg-white/5 text-brand-400 hover:text-white"
                    }`}
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Widths */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">Width</span>
              <div className="grid grid-cols-2 gap-1">
                {(["small", "medium", "large", "full"] as const).map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() => updateImageAttr({ width })}
                    className={`py-1 rounded transition-colors border ${
                      selectedImageAttrs.width === width
                        ? "bg-accent/20 border-accent/40 text-accent font-semibold"
                        : "border-white/5 hover:bg-white/5 text-brand-400 hover:text-white"
                    }`}
                  >
                    {width === "full" ? "Full Width" : width.charAt(0).toUpperCase() + width.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">Caption</span>
              <input
                type="text"
                placeholder="Add image caption..."
                value={selectedImageAttrs.caption || ""}
                onChange={(e) => updateImageAttr({ caption: e.target.value })}
                className="bg-zinc-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-brand-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </BubbleMenu>
        )}
      </div>
    </div>
  );
}
