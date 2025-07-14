import { Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';

export function SearchEmptyState() {
  const navigate = useNavigate();
  
  const popularSearches = [
    'adventure',
    'food',
    'travel',
    'lifestyle',
    'music',
    'art',
  ];

  const handleSearch = (term: string) => {
    navigate({
      to: '/search',
      search: { q: term },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">No results found</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        We couldn't find any matches for your search. Try adjusting your filters or search terms.
      </p>
      
      <Card className="p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Popular searches</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <Button
              key={term}
              variant="secondary"
              size="sm"
              onClick={() => handleSearch(term)}
              className="capitalize"
            >
              {term}
            </Button>
          ))}
        </div>
      </Card>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Can't find what you're looking for?
        </p>
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/vibes/new' })}
        >
          Create a new vibe
        </Button>
      </div>
    </div>
  );
}