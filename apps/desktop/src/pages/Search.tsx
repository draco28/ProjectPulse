import { useState, useDeferredValue } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Search as SearchIcon, ChevronDown, Check } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { SearchResults } from '@/components/search/SearchResults';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

const sourceOptions = [
  { value: '', label: 'All sources' },
  { value: 'wiki', label: 'Wiki' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'sop', label: 'SOPs' },
  { value: 'skill', label: 'Skills' },
  { value: 'knowledge', label: 'Knowledge' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [sourceType, setSourceType] = useState('');
  const deferredQuery = useDeferredValue(query);

  const { data, isLoading, isFetching } = useSearch({
    query: deferredQuery,
    sourceTypes: sourceType || undefined,
    limit: 20,
  });

  const selectedSource = sourceOptions.find((o) => o.value === sourceType) ?? sourceOptions[0];

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-100">Search</h1>

      {/* Search input + source filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wiki, tickets, SOPs, knowledge..."
            className="w-full rounded-lg bg-surface-raised border border-gray-700/50 pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-coral/50 transition-colors"
            autoFocus
          />
          {isFetching && (
            <Spinner
              size="sm"
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
          )}
        </div>

        {/* Source type filter */}
        <Listbox value={sourceType} onChange={setSourceType}>
          <div className="relative">
            <ListboxButton className="flex items-center gap-2 rounded-lg bg-surface-raised border border-gray-700/50 px-3 py-2.5 text-sm text-gray-300 hover:border-gray-600 transition-colors whitespace-nowrap">
              {selectedSource.label}
              <ChevronDown size={14} className="text-gray-500" />
            </ListboxButton>
            <ListboxOptions className="absolute right-0 z-10 mt-1 w-40 rounded-lg bg-surface-overlay border border-gray-700/50 py-1 text-sm shadow-lg">
              {sourceOptions.map((opt) => (
                <ListboxOption
                  key={opt.value}
                  value={opt.value}
                  className="group relative cursor-pointer select-none py-1.5 pl-8 pr-3 text-gray-300 data-[focus]:bg-surface-hover data-[focus]:text-gray-100"
                >
                  <span className="block truncate group-data-[selected]:font-medium">
                    {opt.label}
                  </span>
                  <span className="absolute inset-y-0 left-0 hidden items-center pl-2 group-data-[selected]:flex">
                    <Check size={12} className="text-coral" />
                  </span>
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>

      {/* Results */}
      {!deferredQuery || deferredQuery.length < 2 ? (
        <EmptyState
          icon={SearchIcon}
          title="Start typing to search"
          description="Search across wiki pages, tickets, SOPs, skills, and knowledge items using semantic + keyword search."
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Spinner />
        </div>
      ) : data?.results.length ? (
        <SearchResults results={data.results} metadata={data.metadata} />
      ) : (
        <EmptyState
          icon={SearchIcon}
          title="No results found"
          description={`No results for "${deferredQuery}". Try a different query or source type.`}
        />
      )}
    </div>
  );
}
