import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import type { SprintListItem } from '@/types/kanban';

interface SprintSelectorProps {
  sprints: SprintListItem[];
  selected: SprintListItem | undefined;
  onChange: (sprint: SprintListItem) => void;
}

export function SprintSelector({ sprints, selected, onChange }: SprintSelectorProps) {
  return (
    <Listbox value={selected} onChange={onChange}>
      <div className="relative w-72">
        <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-surface-raised border border-gray-700/50 py-2 pl-3 pr-10 text-left text-sm text-gray-200 hover:border-gray-600 transition-colors">
          <span className="block truncate">
            {selected
              ? `Sprint ${selected.sprintNumber}: ${selected.title}`
              : 'Select sprint...'}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown size={16} className="text-gray-400" />
          </span>
        </ListboxButton>
        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-surface-overlay border border-gray-700/50 py-1 text-sm shadow-lg">
          {sprints.map((sprint) => (
            <ListboxOption
              key={sprint.id}
              value={sprint}
              className="group relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-300 data-[focus]:bg-surface-hover data-[focus]:text-gray-100"
            >
              <span className="block truncate group-data-[selected]:font-medium">
                Sprint {sprint.sprintNumber}: {sprint.title}
              </span>
              <span className="absolute inset-y-0 left-0 hidden items-center pl-3 group-data-[selected]:flex">
                <Check size={14} className="text-coral" />
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                {sprint.phaseTitle} — {sprint.progress}%
              </span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
