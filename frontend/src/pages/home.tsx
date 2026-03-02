import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apifetch } from "../api/client";
import { Skeleton } from "../components/ui/skeleton";

type FeedItem = {
  id: string;
  title: string;
  author: {
    username: string;
    name: string | null;
  };
  readingTime: number;
  published_At: string;
};

export default function HomePage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apifetch("/a")
      .then((res) => res.items ?? res.data ?? res)
      .then(setItems)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-12 max-w-2xl mx-auto space-y-12">
        <Skeleton className="h-4 w-32 mb-8 bg-muted" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="w-6 h-6 rounded-full bg-muted" />
              <Skeleton className="w-24 h-4 bg-muted" />
            </div>
            <Skeleton className="h-8 w-full bg-muted" />
            <Skeleton className="h-4 w-1/3 bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-12 md:py-20 animate-in fade-in duration-700 no-scrollbar">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-1 h-3 bg-foreground" />
          <h1 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Latest Articles</h1>
        </div>

        <div className="space-y-16">
          {items.map((item) => (
            <article key={item.id} className="group relative flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {/* Placeholder for author avatar */}
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase">
                    {item.author.username[0]}
                  </div>
                </div>
                <Link to={`/u/${item.author.username}`} className="hover:text-foreground hover:underline transition-clean">
                  @{item.author.username}
                </Link>
                <span>·</span>
                <span>{new Date(item.published_At).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              <Link to={`/article/${item.id}`} className="block">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-muted-foreground transition-clean mb-2">
                  {item.title}
                </h2>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  Read more
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            </article>
          ))}

          {items.length === 0 && (
            <div className="text-center py-20 text-muted-foreground italic">
              No articles yet. Be the first to write.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}