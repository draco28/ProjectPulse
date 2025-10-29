'use client';

import { useReducer, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

// Command Palette State
interface CommandState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  entityType: 'all' | 'issues' | 'knowledge' | 'wiki' | 'agents';
}

interface SearchResult {
  id: number;
  type: 'issue' | 'knowledge' | 'wiki' | 'agent';
  title: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: string;
}

type CommandAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MOVE_UP' }
  | { type: 'MOVE_DOWN' }
  | { type: 'SET_ENTITY_TYPE'; payload: CommandState['entityType'] }
  | { type: 'RESET' };

// Reducer
function commandReducer(state: CommandState, action: CommandAction): CommandState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false, query: '', results: [], selectedIndex: 0 };
    case 'SET_QUERY':
      return { ...state, query: action.payload, selectedIndex: 0 };
    case 'SET_RESULTS':
      return { ...state, results: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'MOVE_UP':
      return {
        ...state,
        selectedIndex: state.selectedIndex > 0 ? state.selectedIndex - 1 : state.results.length - 1,
      };
    case 'MOVE_DOWN':
      return {
        ...state,
        selectedIndex: state.selectedIndex < state.results.length - 1 ? state.selectedIndex + 1 : 0,
      };
    case 'SET_ENTITY_TYPE':
      return { ...state, entityType: action.payload, selectedIndex: 0 };
    case 'RESET':
      return { ...state, query: '', results: [], selectedIndex: 0 };
    default:
      return state;
  }
}

const initialState: CommandState = {
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: 0,
  isLoading: false,
  entityType: 'all',
};

export function CommandPalette() {
  const [state, dispatch] = useReducer(commandReducer, initialState);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(state.query, 300);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'OPEN' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (state.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isOpen]);

  // Search function
  const performSearch = useCallback(
    async (query: string, entityType: CommandState['entityType']) => {
      if (!query.trim()) {
        dispatch({ type: 'SET_RESULTS', payload: [] });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // Mock search results (replace with actual API call)
        // In production: const response = await fetch(`/api/search?q=${query}&type=${entityType}`);
        await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay

        const mockResults: SearchResult[] = [
          {
            id: 1,
            type: 'issue' as const,
            title: `Issue matching "${query}"`,
            description: 'Fix authentication bug in login flow',
            url: '/issues/1',
            icon: 'fa-bug',
            metadata: 'Open • High Priority',
          },
          {
            id: 2,
            type: 'knowledge' as const,
            title: `Knowledge article about "${query}"`,
            description: 'Best practices for API design',
            url: '/knowledge',
            icon: 'fa-book',
            metadata: 'API • Design Patterns',
          },
          {
            id: 3,
            type: 'wiki' as const,
            title: `Wiki page: ${query}`,
            description: 'Technical documentation for the feature',
            url: '/wiki/getting-started',
            icon: 'fa-file-alt',
            metadata: 'Documentation',
          },
          {
            id: 4,
            type: 'agent' as const,
            title: `Agent: ${query} Expert`,
            description: 'Specialized agent for this domain',
            url: '/agents',
            icon: 'fa-robot',
            metadata: 'Active',
          },
        ].filter((result) => {
          // Filter by entity type
          if (entityType === 'all') return true;
          return result.type === entityType;
        });

        dispatch({ type: 'SET_RESULTS', payload: mockResults });
      } catch (error) {
        console.error('Search failed:', error);
        dispatch({ type: 'SET_RESULTS', payload: [] });
      }
    },
    []
  );

  // Trigger search on debounced query change
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, state.entityType);
    } else {
      dispatch({ type: 'SET_RESULTS', payload: [] });
    }
  }, [debouncedQuery, state.entityType, performSearch]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        dispatch({ type: 'MOVE_DOWN' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        dispatch({ type: 'MOVE_UP' });
        break;
      case 'Enter':
        e.preventDefault();
        const selectedResult = state.results[state.selectedIndex];
        if (selectedResult) {
          router.push(selectedResult.url);
          dispatch({ type: 'CLOSE' });
        }
        break;
      case 'Escape':
        e.preventDefault();
        dispatch({ type: 'CLOSE' });
        break;
    }
  };

  const handleResultClick = (url: string) => {
    router.push(url);
    dispatch({ type: 'CLOSE' });
  };

  const entityTypes = [
    { value: 'all' as const, label: 'All', icon: 'fa-search' },
    { value: 'issues' as const, label: 'Issues', icon: 'fa-bug' },
    { value: 'knowledge' as const, label: 'Knowledge', icon: 'fa-book' },
    { value: 'wiki' as const, label: 'Wiki', icon: 'fa-file-alt' },
    { value: 'agents' as const, label: 'Agents', icon: 'fa-robot' },
  ];

  if (!state.isOpen) {
    return (
      <button
        onClick={() => dispatch({ type: 'OPEN' })}
        className="neu-raised smooth-transition fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg hover:scale-105"
      >
        <i className="fas fa-search text-xl"></i>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => dispatch({ type: 'CLOSE' })}
      ></div>

      {/* Command Palette */}
      <div
        role="dialog"
        aria-label="Command Palette"
        className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2 transform"
        onKeyDown={handleKeyDown}
      >
        <div className="neu-raised smooth-transition mx-4 overflow-hidden rounded-3xl">
          {/* Search Input */}
          <div className="flex items-center gap-4 border-b border-white/5 p-6">
            <i className="fas fa-search text-xl text-slate"></i>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search issues, knowledge, wiki, agents..."
              value={state.query}
              onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
              className="flex-1 bg-transparent text-lg text-white placeholder-slate outline-none"
            />
            {state.isLoading && <i className="fas fa-spinner fa-spin text-coral"></i>}
            <kbd className="rounded bg-black/20 px-2 py-1 text-xs text-slate">ESC</kbd>
          </div>

          {/* Entity Type Filter */}
          <div className="flex gap-2 border-b border-white/5 p-4">
            {entityTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => dispatch({ type: 'SET_ENTITY_TYPE', payload: type.value })}
                className={`smooth-transition flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  state.entityType === type.value
                    ? 'coral-gradient text-white'
                    : 'bg-black/20 text-slate hover:bg-black/30'
                }`}
              >
                <i className={`fas ${type.icon}`}></i>
                {type.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {state.results.length > 0 ? (
              <div className="p-2">
                {state.results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result.url)}
                    className={`smooth-transition mb-2 flex w-full items-start gap-4 rounded-2xl p-4 text-left ${
                      index === state.selectedIndex
                        ? 'bg-coral/10 ring-2 ring-coral/50'
                        : 'bg-black/20 hover:bg-black/30'
                    }`}
                  >
                    <div className="neu-raised flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                      <i className={`fas ${result.icon} text-coral`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold text-white">{result.title}</h4>
                      {result.description && (
                        <p className="mb-1 line-clamp-1 text-sm text-slate">{result.description}</p>
                      )}
                      {result.metadata && <p className="text-xs text-slate">{result.metadata}</p>}
                    </div>
                    <kbd className="rounded bg-black/20 px-2 py-1 text-xs text-slate">↵</kbd>
                  </button>
                ))}
              </div>
            ) : state.query && !state.isLoading ? (
              <div className="p-12 text-center">
                <i className="fas fa-search mb-4 text-4xl text-slate"></i>
                <p className="text-slate">No results found for &quot;{state.query}&quot;</p>
              </div>
            ) : (
              <div className="p-12 text-center">
                <i className="fas fa-keyboard mb-4 text-4xl text-slate"></i>
                <p className="mb-2 text-sm text-slate">
                  Start typing to search across all entities
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-slate">
                  <span>
                    <kbd className="rounded bg-black/20 px-2 py-1">↑</kbd>
                    <kbd className="ml-1 rounded bg-black/20 px-2 py-1">↓</kbd> Navigate
                  </span>
                  <span>
                    <kbd className="rounded bg-black/20 px-2 py-1">↵</kbd> Select
                  </span>
                  <span>
                    <kbd className="rounded bg-black/20 px-2 py-1">ESC</kbd> Close
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
