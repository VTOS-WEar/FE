import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useEffect, useState, useCallback, useRef } from "react";

type RichTextEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
};

/* ── Toolbar button ── */
function TBtn({
    active,
    onClick,
    children,
    title,
    disabled,
}: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`flex h-8 min-w-[32px] px-1 items-center justify-center rounded-[6px] border border-gray-200 text-[12px] font-black transition-all ${
                disabled
                    ? "opacity-30 cursor-not-allowed bg-gray-100 text-gray-400"
                    : active
                    ? "bg-violet-500 text-white border-violet-500"
                    : "bg-white text-gray-700 hover:bg-violet-50"
            }`}
        >
            {children}
        </button>
    );
}

/* ── Separator ── */
function TSep() {
    return <div className="mx-0.5 h-6 w-[2px] rounded bg-gray-200" />;
}

/* ── Color picker button ── */
function ColorBtn({
    color,
    onClick,
    title,
    active,
}: {
    color: string;
    onClick: () => void;
    title: string;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={title}
            className={`w-6 h-6 rounded-full border border-gray-300 transition-all ${
                active ? "border-gray-700 scale-110" : "border-gray-300 hover:border-gray-500 hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
        />
    );
}

const TEXT_COLORS = [
    { color: "#111827", label: "Đen" },
    { color: "#4B5563", label: "Xám" },
    { color: "#DC2626", label: "Đỏ" },
    { color: "#EA580C", label: "Cam" },
    { color: "#CA8A04", label: "Vàng" },
    { color: "#16A34A", label: "Xanh lá" },
    { color: "#2563EB", label: "Xanh dương" },
    { color: "#7C3AED", label: "Tím" },
];

const HIGHLIGHT_COLORS = [
    { color: "#FEF08A", label: "Vàng" },
    { color: "#BBF7D0", label: "Xanh lá" },
    { color: "#BFDBFE", label: "Xanh dương" },
    { color: "#E9D5FF", label: "Tím" },
    { color: "#FECACA", label: "Đỏ" },
    { color: "#FED7AA", label: "Cam" },
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const [showTextColors, setShowTextColors] = useState(false);
    const [showHighlightColors, setShowHighlightColors] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: true,
                    HTMLAttributes: { class: "rte-bullet-list" },
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: true,
                    HTMLAttributes: { class: "rte-ordered-list" },
                },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "rte-link",
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || "Nhập nội dung...",
                emptyEditorClass: "is-editor-empty",
            }),
        ],
        content: value || "",
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const isEmpty = html === "<p></p>" || html === "";
            onChange(isEmpty ? "" : html);
        },
        editorProps: {
            attributes: {
                class: "prose-editor-content outline-none min-h-[100px] px-4 py-3 text-[15px] font-normal text-[#4B5563]",
            },
        },
    });

    // Sync external value changes (e.g. reset form)
    useEffect(() => {
        if (!editor) return;
        const currentHTML = editor.getHTML();
        const normalizedCurrent = currentHTML === "<p></p>" ? "" : currentHTML;
        const normalizedValue = value || "";
        if (normalizedCurrent !== normalizedValue) {
            editor.commands.setContent(normalizedValue, false);
        }
    }, [value, editor]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => { setShowTextColors(false); setShowHighlightColors(false); setShowEmojis(false); };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Nhập URL:", previousUrl || "https://");
        if (url === null) return; // cancelled
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm transition-all focus-within:shadow-soft-md">
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5 rounded-t-[6px]">
                {/* Undo / Redo */}
                <TBtn
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Hoàn tác (Ctrl+Z)"
                >
                    ↩
                </TBtn>
                <TBtn
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Làm lại (Ctrl+Y)"
                >
                    ↪
                </TBtn>

                <TSep />

                {/* Text formatting */}
                <TBtn
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Đậm (Ctrl+B)"
                >
                    B
                </TBtn>
                <TBtn
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Nghiêng (Ctrl+I)"
                >
                    <span className="italic">I</span>
                </TBtn>
                <TBtn
                    active={editor.isActive("underline")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Gạch chân (Ctrl+U)"
                >
                    <span className="underline">U</span>
                </TBtn>
                <TBtn
                    active={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Gạch ngang"
                >
                    <span className="line-through">S</span>
                </TBtn>

                <TSep />

                {/* Headings */}
                <TBtn
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Tiêu đề lớn"
                >
                    H2
                </TBtn>
                <TBtn
                    active={editor.isActive("heading", { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    title="Tiêu đề nhỏ"
                >
                    H3
                </TBtn>

                <TSep />

                {/* Lists */}
                <TBtn
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Danh sách"
                >
                    •
                </TBtn>
                <TBtn
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Danh sách số"
                >
                    1.
                </TBtn>

                <TSep />

                {/* Alignment */}
                <TBtn
                    active={editor.isActive({ textAlign: "left" })}
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    title="Căn trái"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
                </TBtn>
                <TBtn
                    active={editor.isActive({ textAlign: "center" })}
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    title="Căn giữa"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
                </TBtn>
                <TBtn
                    active={editor.isActive({ textAlign: "right" })}
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    title="Căn phải"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
                </TBtn>

                <TSep />

                {/* Link */}
                <TBtn
                    active={editor.isActive("link")}
                    onClick={setLink}
                    title="Chèn liên kết"
                >
                    🔗
                </TBtn>

                {/* Block */}
                <TBtn
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    title="Trích dẫn"
                >
                    "
                </TBtn>
                <TBtn
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Đường kẻ ngang"
                >
                    —
                </TBtn>

                <TSep />

                {/* Text Color */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <TBtn
                        onClick={() => { setShowTextColors(!showTextColors); setShowHighlightColors(false); }}
                        title="Màu chữ"
                    >
                        <span className="flex flex-col items-center leading-none">
                            <span className="text-[11px]">A</span>
                            <span className="w-4 h-1 rounded-sm mt-[-1px]" style={{ backgroundColor: editor.getAttributes("textStyle").color || "#111827" }} />
                        </span>
                    </TBtn>
                    {showTextColors && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-soft-md z-50 flex gap-1.5">
                            {TEXT_COLORS.map((c) => (
                                <ColorBtn
                                    key={c.color}
                                    color={c.color}
                                    title={c.label}
                                    active={editor.getAttributes("textStyle").color === c.color}
                                    onClick={() => { editor.chain().focus().setColor(c.color).run(); setShowTextColors(false); }}
                                />
                            ))}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().unsetColor().run(); setShowTextColors(false); }}
                                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-red-400 flex items-center justify-center text-[10px] text-gray-400 hover:text-red-500"
                                title="Xóa màu"
                            >✕</button>
                        </div>
                    )}
                </div>

                {/* Highlight */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <TBtn
                        onClick={() => { setShowHighlightColors(!showHighlightColors); setShowTextColors(false); }}
                        active={editor.isActive("highlight")}
                        title="Tô nền"
                    >
                        <span className="flex flex-col items-center leading-none">
                            <span className="text-[11px]">🖍</span>
                        </span>
                    </TBtn>
                    {showHighlightColors && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-soft-md z-50 flex gap-1.5">
                            {HIGHLIGHT_COLORS.map((c) => (
                                <ColorBtn
                                    key={c.color}
                                    color={c.color}
                                    title={c.label}
                                    active={editor.isActive("highlight", { color: c.color })}
                                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c.color }).run(); setShowHighlightColors(false); }}
                                />
                            ))}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightColors(false); }}
                                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-red-400 flex items-center justify-center text-[10px] text-gray-400 hover:text-red-500"
                                title="Xóa tô nền"
                            >✕</button>
                        </div>
                    )}
                </div>

                {/* Emoji Picker */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <TBtn
                        onClick={() => { setShowEmojis(!showEmojis); setShowTextColors(false); setShowHighlightColors(false); }}
                        title="Chèn emoji"
                    >
                        <span className="text-[13px]">😊</span>
                    </TBtn>
                </div>
            </div>

            {/* Emoji Picker Overlay — rendered outside toolbar to avoid overflow */}
            {showEmojis && (
                <>
                    <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowEmojis(false)} />
                    <div
                        className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <EmojiPicker
                            onEmojiClick={(emojiData: EmojiClickData) => {
                                editor.chain().focus().insertContent(emojiData.emoji).run();
                                setShowEmojis(false);
                            }}
                            theme={Theme.LIGHT}
                            width={350}
                            height={420}
                            searchPlaceHolder="Tìm emoji..."
                            previewConfig={{ showPreview: false }}
                            lazyLoadEmojis={true}
                        />
                    </div>
                </>
            )}

            {/* ── Editor ── */}
            <EditorContent editor={editor} />

            {/* ── Styles ── */}
            <style>{`
                .prose-editor-content h2 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    margin: 0.75rem 0 0.25rem;
                    color: #374151;
                    letter-spacing: -0.01em;
                }
                .prose-editor-content h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 0.5rem 0 0.25rem;
                    color: #374151;
                }
                .prose-editor-content p {
                    margin: 0.25rem 0;
                    line-height: 1.7;
                    color: #4B5563;
                    font-weight: 400;
                }
                .prose-editor-content ul,
                .prose-editor-content .rte-bullet-list {
                    list-style: disc;
                    padding-left: 1.5rem;
                    margin: 0.25rem 0;
                }
                .prose-editor-content ol,
                .prose-editor-content .rte-ordered-list {
                    list-style: decimal;
                    padding-left: 1.5rem;
                    margin: 0.25rem 0;
                }
                .prose-editor-content li {
                    margin: 0.15rem 0;
                }
                .prose-editor-content li p {
                    margin: 0;
                }
                .prose-editor-content blockquote {
                    border-left: 3px solid #8B6BFF;
                    padding-left: 1rem;
                    margin: 0.5rem 0;
                    color: #6F6A7D;
                    font-style: italic;
                }
                .prose-editor-content hr {
                    border: none;
                    border-top: 2px solid #E5E7EB;
                    margin: 0.75rem 0;
                }
                .prose-editor-content strong {
                    font-weight: 800;
                    color: #111827;
                }
                .prose-editor-content em {
                    font-style: italic;
                    color: #374151;
                }
                .prose-editor-content u {
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    text-decoration-color: #8B6BFF;
                }
                .prose-editor-content s {
                    text-decoration: line-through;
                    color: #9CA3AF;
                }
                .prose-editor-content a,
                .prose-editor-content .rte-link {
                    color: #2563EB;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                    cursor: pointer;
                }
                .prose-editor-content a:hover {
                    color: #1D4ED8;
                }
                .prose-editor-content mark {
                    border-radius: 3px;
                    padding: 0.1em 0.2em;
                }
                .is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9A95A8;
                    pointer-events: none;
                    height: 0;
                    font-weight: 400;
                }
            `}</style>
        </div>
    );
}

export default RichTextEditor;
