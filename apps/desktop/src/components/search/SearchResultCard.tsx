import { Badge } from '@/components/ui/Badge';
import type { SearchResult } from '@/types/search';

interface SearchResultCardProps {
  result: SearchResult;
  onClick: () => void;
}

const sourceColors: Record<string, string> = {
  wiki: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ticket: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  sop: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  skill: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  knowledge: 'bg-coral/15 text-coral-light border-coral/30',
  document: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  const scorePercent = Math.round(result.score * 100);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg bg-surface-raised border border-gray-700/40 p-4 hover:border-gray-600 hover:-translate-y-0.5 transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
            sourceColors[result.source.type] ?? sourceColors.document
          }`}
        >
          {result.source.type}
        </span>
        <span className="text-sm font-medium text-gray-200 truncate flex-1">
          {result.source.title}
        </span>
        {/* Relevance score */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-coral rounded-full"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{scorePercent}%</span>
        </div>
      </div>

      {/* Section */}
      {result.source.section && (
        <p className="text-xs text-gray-500 mb-1">{result.source.section}</p>
      )}

      {/* Content preview */}
      <p className="text-sm text-gray-400 line-clamp-3 whitespace-pre-wrap">
        {result.content}
      </p>

      {/* Related chunks */}
      {result.related.length > 0 && (
        <div className="mt-2 pl-3 border-l-2 border-gray-700/50 space-y-1">
          {result.related.slice(0, 2).map((rel, i) => (
            <div key={i} className="text-xs text-gray-500">
              <Badge variant="task" className="mr-1">{rel.relation}</Badge>
              <span className="text-gray-400">{rel.title}</span>
            </div>
          ))}
          {result.related.length > 2 && (
            <span className="text-xs text-gray-600">
              +{result.related.length - 2} more related
            </span>
          )}
        </div>
      )}
    </button>
  );
}
