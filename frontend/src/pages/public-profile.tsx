import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apifetch } from "../api/client";
import { UserPlus, UserCheck, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../context/auth-context";

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apifetch(`/profile/u/${username}`);
        setProfile(data);
      } catch (error) {
        toast.error("User not found");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow users.");
      navigate("/signin");
      return;
    }

    try {
      const res = await apifetch(`/profile/follow/${profile.id}`, {
        method: "POST"
      });
      setProfile({
        ...profile, isFollowing: res.followed, _count: {
          ...profile._count,
          followers: res.followed ? profile._count.followers + 1 : profile._count.followers - 1
        }
      });
      toast.success(res.followed ? `Following @${username}` : `Unfollowed @${username}`);
    } catch (error) {
      toast.error("Failed to follow user.");
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-12">
      <div className="flex gap-8 items-center">
        <Skeleton className="w-24 h-24 rounded-full bg-muted" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-48 bg-muted" />
          <Skeleton className="h-4 w-32 bg-muted" />
        </div>
      </div>
      <div className="space-y-4 pt-10">
        <Skeleton className="h-6 w-full bg-muted" />
        <Skeleton className="h-6 w-full bg-muted" />
      </div>
    </div>
  );

  if (!profile) return <div className="p-20 text-center text-muted-foreground font-medium">User not found</div>;

  return (
    <div className="min-h-screen bg-transparent animate-in fade-in duration-700 no-scrollbar">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-24">
        {/* Profile Header Area */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-end justify-between mb-12 md:mb-20 pb-12 md:pb-16 border-b border-border text-center md:text-left">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0 shadow-lg">
              {profile.avatar && (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              )}
            </div>
            {/* Info */}
            <div className="space-y-6 md:space-y-2">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">{profile.name || profile.username}</h1>
              <p className="text-muted-foreground text-base md:text-lg italic font-medium opacity-80">@{profile.username}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 md:gap-8 mt-12 md:mt-6 text-[11px] md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
                <span className="flex flex-col md:flex-row md:gap-2 items-center">
                  <span className="text-foreground text-sm md:text-lg">{profile._count.followers}</span>
                  <span className="opacity-60">Followers</span>
                </span>
                <span className="flex flex-col md:flex-row md:gap-2 items-center">
                  <span className="text-foreground text-sm md:text-lg">{profile._count.following}</span>
                  <span className="opacity-60">Following</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleFollow}
            className={`w-full md:w-auto px-10 py-3.5 rounded-full text-sm font-bold tracking-widest uppercase transition-all active:scale-95 flex items-center justify-center gap-2 ${profile.isFollowing
              ? "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
              : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg"
              }`}
          >
            {profile.isFollowing ? (
              <>
                <UserCheck className="w-4 h-4" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Follow
              </>
            )}
          </button>
        </div>

        {/* Bio Section */}
        <div className="mb-10 md:mb-20">
          <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-3 md:mb-10 flex items-center justify-center md:justify-start gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Bio
          </h2>
          <p className="text-xl md:text-3xl leading-relaxed  text-center md:text-left opacity-90 max-w-2xl">
            "{profile.bio || "This user hasn't written a bio yet."}"
          </p>
        </div>

        {/* Articles List */}
        <div className="mt-16 md:mt-24">
          <div className="flex items-center gap-2 mb-6 md:mb-12">
            <div className="w-1.5 h-4 bg-primary rounded-full shadow-sm" />
            <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground/60 leading-none">Latest Publications</h2>
          </div>

          <div className="space-y-2">
            {profile.articles?.map((article: any) => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="group w-full py-6 md:py-10 flex items-center justify-between border-b border-border/50 hover:bg-muted/30 transition-clean px-4 md:px-8 -mx-4 md:-mx-8 rounded-2xl"
              >
                <div className="space-y-2 md:space-y-3 pr-4">
                  <h3 className="text-xl md:text-3xl font-bold tracking-tight leading-tight group-hover:text-primary transition-colors">{article.title}</h3>
                  <div className="text-[11px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                    {new Date(article.published_At).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </div>
                </div>
                <div className="text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all text-xl md:text-2xl opacity-40 group-hover:opacity-100 pr-2">
                  →
                </div>
              </Link>
            ))}
            {(!profile.articles || profile.articles.length === 0) && (
              <div className="text-muted-foreground italic py-16 md:py-24 text-center border border-dashed border-border rounded-3xl opacity-60">
                No articles published yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
