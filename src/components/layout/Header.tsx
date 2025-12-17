import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNote: () => void;
}

export function Header({ searchQuery, onSearchChange, onCreateNote }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="搜索项目..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 h-9 bg-secondary border-0 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <Button onClick={onCreateNote} size="sm" className="h-9 px-4">
        <Plus className="w-4 h-4 mr-1.5" />
        新建项目
      </Button>
    </header>
  );
}
