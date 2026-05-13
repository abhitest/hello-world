import { useState, useEffect } from "react";

/**
 * Hook to interact with the Webflow Designer Extension SDK.
 * Provides access to pages, elements, and site info from within the Designer.
 */
export function useWebflow() {
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The webflow global is injected by the Designer runtime
    const init = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).webflow) {
          const wf = (window as any).webflow;
          const allPages = await wf.getAllPages();
          setPages(allPages);

          const current = await wf.getCurrentPage();
          setCurrentPage(current);
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to Webflow Designer");
      }
    };

    init();
  }, []);

  const getPageMetadata = async (pageId: string) => {
    try {
      if ((window as any).webflow) {
        const wf = (window as any).webflow;
        const page = await wf.getPageById(pageId);
        return page?.getMetadata?.();
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const setPageMetadata = async (
    pageId: string,
    metadata: { title?: string; description?: string }
  ) => {
    try {
      if ((window as any).webflow) {
        const wf = (window as any).webflow;
        const page = await wf.getPageById(pageId);
        if (page?.setMetadata) {
          await page.setMetadata(metadata);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    pages,
    currentPage,
    isLoading,
    error,
    getPageMetadata,
    setPageMetadata,
  };
}
