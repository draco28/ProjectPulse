import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton className="flex items-center gap-1.5 rounded-lg bg-surface-raised border border-gray-700/50 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-600 transition-colors">
          <span className="text-gray-500">{label}:</span>
          <span>{selected.label}</span>
          <ChevronDown size={12} className="text-gray-500" />
        </ListboxButton>
        <ListboxOptions className="absolute z-10 mt-1 max-h-48 w-40 overflow-auto rounded-lg bg-surface-overlay border border-gray-700/50 py-1 text-xs shadow-lg">
          {options.map((opt) => (
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
  );
}

const statusOptions: FilterOption[] = [
  { value: '', label: 'All' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions: FilterOption[] = [
  { value: '', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const kindOptions: FilterOption[] = [
  { value: '', label: 'All' },
  { value: 'feature', label: 'Feature' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'issue', label: 'Issue' },
  { value: 'tech_debt', label: 'Tech Debt' },
  { value: 'epic', label: 'Epic' },
];

interface TicketFiltersProps {
  status: string;
  priority: string;
  kind: string;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onKindChange: (v: string) => void;
}

export function TicketFilters({
  status,
  priority,
  kind,
  onStatusChange,
  onPriorityChange,
  onKindChange,
}: TicketFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <FilterDropdown label="Status" value={status} options={statusOptions} onChange={onStatusChange} />
      <FilterDropdown label="Priority" value={priority} options={priorityOptions} onChange={onPriorityChange} />
      <FilterDropdown label="Kind" value={kind} options={kindOptions} onChange={onKindChange} />
    </div>
  );
}
