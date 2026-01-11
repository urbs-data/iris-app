'use client';

import * as React from 'react';
import { CheckIcon, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SearchMode = 'static' | 'dynamic';

interface ComboboxProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onSearch?: (search: string) => void;
  debounceMs?: number;
  searchMode?: SearchMode;
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccione una opción...',
  searchPlaceholder,
  emptyMessage = 'No se encontraron resultados.',
  className,
  disabled = false,
  isLoading = false,
  onSearch,
  debounceMs = 300,
  searchMode
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, debounceMs);

  const mode: SearchMode = searchMode ?? (onSearch ? 'dynamic' : 'static');

  // Guardar la opción seleccionada para siempre mostrarla
  const selectedOptionRef = React.useRef<ComboboxOption | null>(null);

  React.useEffect(() => {
    if (mode === 'dynamic' && onSearch && debouncedSearch !== undefined) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch, mode]);

  const selectedOption = React.useMemo(() => {
    const found = options.find((option) => option.value === value);
    if (found) {
      selectedOptionRef.current = found;
      return found;
    }
    // Si no está en las opciones actuales, usar la última guardada
    return value ? selectedOptionRef.current : null;
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (mode === 'dynamic') {
      // En modo dinámico, asegurar que la opción seleccionada esté siempre visible
      if (
        selectedOption &&
        !options.some((opt) => opt.value === selectedOption.value)
      ) {
        return [selectedOption, ...options];
      }
      return options;
    }
    if (!debouncedSearch) return options;
    const searchLower = debouncedSearch.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.value.toLowerCase().includes(searchLower)
    );
  }, [options, debouncedSearch, mode, selectedOption]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn('w-full justify-between', className)}
        >
          {isLoading ? (
            <div className='flex items-center gap-2'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span>Cargando...</span>
            </div>
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0' align='start'>
        <Command shouldFilter={mode === 'static'}>
          <CommandInput
            placeholder={searchPlaceholder || placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Cargando...' : emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value === value ? null : option.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
