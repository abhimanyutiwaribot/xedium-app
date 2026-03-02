import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apifetch } from "../api/client";
import ArticleRenderer from "../components/article/article-renderer";
import { THEMES, type ThemeKey } from "../themes";
import ArticleInteractions from "../components/article/interactions";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../context/auth-context";

export default function Article() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await apifetch(`/a/article/${id}`);
        setData(res);
      } catch (err) {
        console.error(err);
      }
    }

    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (data?.title) {
      document.title = `${data.title} | Xedium`;
    }
    return () => {
      document.title = "Xedium";
    };
  }, [data]);

  if (!data) return (
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-12">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 bg-muted" />
        <Skeleton className="h-12 w-full bg-muted" />
        <Skeleton className="h-12 w-2/3 bg-muted" />
      </div>
      <div className="flex gap-4 items-center">
        <Skeleton className="w-10 h-10 rounded-full bg-muted" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-muted" />
          <Skeleton className="h-3 w-24 bg-muted" />
        </div>
      </div>
      <div className="space-y-4 pt-10">
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-3/4 bg-muted" />
      </div>
    </div>
  );

  const selectedTheme = data.theme ? THEMES[data.theme as ThemeKey] : null;

  // Calculate reading time
  const wordsPerMinute = 200;
  const wordCount = data.content?.split(/\s+/).length || 0;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return (
    <>
      {/* Background Overlay - Locked height to prevent mobile 'zoom' on scroll */}
      {selectedTheme && (
        <div
          className="fixed top-0 left-0 w-full h-full -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${selectedTheme.url})`,
            backgroundColor: selectedTheme.overlay === "dark" ? "#000" : "#fff",
            transform: 'translateZ(0)', // Force GPU to prevent scroll jitter
            willChange: 'transform'
          }}
        >
          <div className={`absolute inset-0 ${selectedTheme.overlay === "dark" ? "bg-black/40" : "bg-white/40"}`} />
        </div>
      )}

      <div className={`min-h-screen relative no-scrollbar ${selectedTheme ? "" : "bg-background"} ${selectedTheme?.overlay === "dark" ? "dark" : ""}`}>
        <main
          className="max-w-3xl mx-auto px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-1000"
          style={{ color: selectedTheme?.color || (selectedTheme && selectedTheme.overlay === "light" ? "#333333" : "#ffffff") }}
        >
          <header className="mb-12">
            <div className="flex items-center gap-2 text-sm opacity-60 mb-6 uppercase tracking-[0.2em] font-bold">
              <Link to="/" className="hover:opacity-100 transition-clean">Home</Link>
              <span>/</span>
              {user?.id === data.authorId ? (
                <Link to={`/article/${id}/vS`} className="hover:opacity-100 transition-clean">Story Version {data.version}</Link>
              ) : (
                <span>Story Version {data.version}</span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-10 leading-[1.05]">
              {data.title}
            </h1>

            <div className={`flex items-center justify-between py-8 border-y ${selectedTheme?.overlay === "light" ? "border-black/10" : "border-white/10"}`}>
              <div className="flex items-center gap-4">
                <Link to={`/u/${data.username}`}>
                  <div className={`w-12 h-12 rounded-full overflow-hidden shadow-sm ${selectedTheme?.overlay === "light" ? "bg-black/5" : "bg-white/10"}`}>
                    {data.authorAvatar ? (
                      <img src={data.authorAvatar} alt={data.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold uppercase opacity-60">
                        {data.username[0]}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="space-y-0.5">
                  <Link to={`/u/${data.username}`} className="font-bold text-lg hover:opacity-70 transition-clean flex items-center gap-2">
                    {data.authorName || `@${data.username}`}
                  </Link>
                  <div className="text-sm opacity-60 flex items-center gap-2 font-medium">
                    {new Date(data.published_At).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    <span>·</span>
                    <span>{readingTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="article-content">
            <ArticleRenderer content={data.content} />
          </section>

          <footer className="mt-32 pt-16 border-t border-border/10 flex flex-col gap-6">
            <div className="flex items-center gap-4 text-muted-foreground italic text-lg opacity-60">
              <div className="w-8 h-[1px] bg-muted-foreground" />
              <span>The end</span>
            </div>
          </footer>
        </main>

        <ArticleInteractions
          articleId={id!}
          initialClaps={data.clapsCount || 0}
          initialBookmarked={data.isBookmarked || false}
          initialClapped={data.isClapped || false}
        />
      </div>
    </>
  );
}