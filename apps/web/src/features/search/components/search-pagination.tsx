/**
 * Renders pagination controls for the search results page.
 * Uses tanstack router navigation and keeps query params intact.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'; // arrow icons
import { Button } from '@/components/ui/button'; // styled button component
import { Route } from '@/routes/search'; // access to search route for navigation

interface SearchPaginationProps {
  currentPage: number; // currently selected page
  totalPages: number; // total number of pages available
}

export function SearchPagination({
  currentPage,
  totalPages,
}: SearchPaginationProps) {
  const navigate = Route.useNavigate(); // router hook for programmatic navigation

  // helper to update url and scroll position
  const goToPage = (page: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page,
      }),
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (totalPages <= 1) {
    return null; // hide when pagination unnecessary
  }

  // create an array of page buttons with ellipsis when needed
  const renderPageNumbers = () => {
    const pages = [] as React.ReactNode[];
    const maxVisible = 5; // max number of page buttons to show
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <Button
          key={1}
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          className="h-10 w-10"
        >
          1
        </Button>
      );

      if (start > 2) {
        pages.push(
          <span key="dots-start" className="px-2 py-1">
            ...
          </span>
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => goToPage(i)}
          className="h-10 w-10"
          disabled={i === currentPage}
        >
          {i}
        </Button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(
          <span key="dots-end" className="px-2 py-1">
            ...
          </span>
        );
      }

      pages.push(
        <Button
          key={totalPages}
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
          className="h-10 w-10"
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-1">{renderPageNumbers()}</div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
