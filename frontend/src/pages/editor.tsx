import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditorCanvas from "../components/editor/editor-canvas";
import { editorJsToMarkdown } from "../utils/markdown";
import { apifetch } from "../api/client";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowLeft, Save, Send, Eye } from "lucide-react";

export default function Editor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const handleEditorChange = useCallback((data: any) => {
    if (isEditMode && !hasLoadedInitialData) return;
    setContent(data);
  }, [hasLoadedInitialData, isEditMode])

  useEffect(() => {
    if (!isEditMode || hasLoadedInitialData) return;
    setLoading(true);

    apifetch(`/q/edit/${id}`, { method: "GET" })
      .then((data) => {
        setTitle(data.title);
        setInitialData(data.content_json);
        setCurrentVersion(data.current_version);
        setHasLoadedInitialData(true);
        setLastSaved(new Date());
      })
      .catch(() => toast.error("Failed to load draft"))
      .finally(() => setLoading(false));
  }, [id, isEditMode, hasLoadedInitialData]);


  async function saveDraft(isAutoSave = false) {
    if (!title || !content) {
      if (!isAutoSave) toast.error("Please add a title and some content");
      return;
    }

    setSaving(true);

    const markdown = editorJsToMarkdown(content);

    try {
      if (isEditMode) {
        await apifetch(`/q/edit/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            title,
            content_markdown: markdown,
            content_json: content
          }),
        });

        setLastSaved(new Date());
        toast.success("Version saved successfully");
      } else {
        // Handle New Draft
        const res = await apifetch("/q/article", {
          method: "POST",
          body: JSON.stringify({
            title,
            content_markdown: markdown,
            content_json: content,
          }),
        });

        // CRITICAL: Mark as loaded BEFORE navigating so the useEffect doesn't trigger a fetch
        setHasLoadedInitialData(true);
        setCurrentVersion(1);
        setLastSaved(new Date());

        toast.success("New draft created");

        // Once created, we move to the edit URL silently
        navigate(`/editor/${res.id}`, { replace: true });
      }
    } catch (error) {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function publishArticle() {
    try {
      await apifetch(`/q/${id}/publish`, { method: "POST" });
      toast.success("Article published!");
      navigate('/');
    } catch (error) {
      toast.error("Failed to publish article");
    }
  }

  if (isEditMode && !hasLoadedInitialData && loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-12">
        <Skeleton className="h-16 w-full bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent animate-in fade-in duration-1000">
      {/* Editor Header / Tooling */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-clean">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {isEditMode ? (
              <button
                onClick={() => navigate(`/article/${id}/vS`)}
                className="text-[11px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-clean px-2 py-1 rounded hover:bg-muted/50"
                title="View Version History"
              >
                <span className="md:hidden">v{currentVersion}</span>
                <span className="hidden md:inline">Editing Draft: v{currentVersion}</span>
              </button>
            ) : (
              <span className="text-[11px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">
                New Draft
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">

            <button
              onClick={() => saveDraft(false)}
              disabled={saving}
              className="flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-clean flex-shrink-0 disabled:opacity-50"
              title="Save Draft (New Version)"
            >
              <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">{saving ? "Saving Version" : "Save Version"}</span>
            </button>
            {isEditMode && (
              <>
                <button
                  onClick={() => navigate(`/article/${id}/preview`)}
                  className="flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-clean flex-shrink-0"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden md:inline">Preview</span>
                </button>
                <button
                  onClick={publishArticle}
                  className="flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:opacity-90 transition-all flex-shrink-0 outline-none active:scale-95"
                  title="Publish"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden md:inline">Publish</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        {/* Title Area */}
        <textarea
          placeholder="Title"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-white text-3xl md:text-4xl font-bold tracking-tight outline-none resize-none placeholder:text-white/20 leading-tight mb-4"
        />

        {/* Editor Canvas */}
        <div className="article-content">
          <EditorCanvas
            initialData={initialData}
            onChange={handleEditorChange}
          />
        </div>
      </div>
    </div>
  );
}
