import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function SearchPagination({ currentPage, totalPages }: SearchPaginationProps) {
  const navigate = useNavigate();
  
  const goToPage = (page: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page,
      }),
    });
    
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (totalPages <= 1) {
    return null;
  }

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
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
          className="w-10 h-10"
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
          className="w-10 h-10"
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
          className="w-10 h-10"
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
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
      
      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>
      
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