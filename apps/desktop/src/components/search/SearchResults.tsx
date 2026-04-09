import { useNavigate } from 'react-router-dom';
import { SearchResultCard } from './SearchResultCard';
import type { SearchResult, SearchMetadata } from '@/types/search';

interface SearchResultsProps {
  results: SearchResult[];
  metadata: SearchMetadata;
}

export function SearchResults({ results, metadata }: SearchResultsProps) {
  const navigate = useNavigate();

  const handleClick = (result: SearchResult) => {
    // Navigate based on source type
    switch (result.source.type) {
      case 'ticket':
        navigate(`/tickets/${result.source.id}`);
        break;
      default:
        // For wiki, sop, skill, knowledge — no dedicated desktop page yet
        // Could open in a modal or external browser in the future
        break;
    }
  };

  return (
    <div>
      <div className="space-y-2">
        {results.map((result, i) => (
          <SearchResultCard
            key={`${result.source.type}-${result.source.id}-${i}`}
            result={result}
            onClick={() => handleClick(result)}
          />
        ))}
      </div>

      {/* Footer with metadata */}
      <div className="flex items-center gap-3 mt-4 text-xs text-gray-600">
        <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        <span>Strategy: {metadata.strategy}</span>
        <span>{metadata.search_time_ms}ms</span>
      </div>
    </div>
  );
}
