interface TrendingTag {
  tag: string;
  count: number;
}

interface TrendingTagsCardProps {
  tags: TrendingTag[];
}

export function TrendingTagsCard({ tags }: TrendingTagsCardProps) {
  return (
    <div className="neu-raised rounded-3xl p-5">
      <h2 className="text-lg font-semibold text-white">Trending Tags</h2>
      {tags.length === 0 ? (
        <p className="mt-4 text-sm text-slate">No tags recorded yet.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.tag}
              className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-slate"
            >
              #{tag.tag} <span className="text-white/60">({tag.count})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
