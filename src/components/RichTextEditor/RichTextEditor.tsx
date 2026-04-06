import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

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
}: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={title}
            className={`flex h-8 w-8 items-center justify-center rounded-[6px] border-[2px] border-[#19182B] text-[13px] font-black transition-all ${
                active
                    ? "bg-[#8B6BFF] text-white shadow-[2px_2px_0_#19182B]"
                    : "bg-white text-[#19182B] shadow-[2px_2px_0_#19182B] hover:bg-[#F2ECFF]"
            }`}
        >
            {children}
        </button>
    );
}

/* ── Separator ── */
function TSep() {
    return <div className="mx-1 h-6 w-[2px] rounded bg-[#D1C9E0]" />;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                bulletList: { keepMarks: true },
                orderedList: { keepMarks: true },
            }),
            Underline,
            Placeholder.configure({
                placeholder: placeholder || "Nhập nội dung...",
                emptyEditorClass: "is-editor-empty",
            }),
        ],
        content: value || "",
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // Return empty string if editor only has empty paragraph
            const isEmpty = html === "<p></p>" || html === "";
            onChange(isEmpty ? "" : html);
        },
        editorProps: {
            attributes: {
                class: "prose-editor-content outline-none min-h-[80px] px-4 py-3 text-[15px] font-semibold text-[#19182B]",
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

    if (!editor) return null;

    return (
        <div className="rounded-[8px] border-[2px] border-[#19182B] bg-white shadow-[3px_3px_0_#19182B] transition-all focus-within:translate-x-[1px] focus-within:translate-y-[1px] focus-within:shadow-[2px_2px_0_#19182B]">
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-1 border-b-[2px] border-[#19182B] bg-[#FAFAFA] px-2.5 py-2 rounded-t-[6px]">
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
            </div>

            {/* ── Editor ── */}
            <EditorContent editor={editor} />

            {/* ── Styles for editor content + placeholder ── */}
            <style>{`
                .prose-editor-content h2 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    margin: 0.75rem 0 0.25rem;
                    color: #19182B;
                }
                .prose-editor-content h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 0.5rem 0 0.25rem;
                    color: #19182B;
                }
                .prose-editor-content p {
                    margin: 0.25rem 0;
                    line-height: 1.6;
                }
                .prose-editor-content ul {
                    list-style: disc;
                    padding-left: 1.5rem;
                    margin: 0.25rem 0;
                }
                .prose-editor-content ol {
                    list-style: decimal;
                    padding-left: 1.5rem;
                    margin: 0.25rem 0;
                }
                .prose-editor-content li {
                    margin: 0.15rem 0;
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
                }
                .is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9A95A8;
                    pointer-events: none;
                    height: 0;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}

export default RichTextEditor;
