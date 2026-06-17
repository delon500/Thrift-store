import { useEffect } from "react";

const APP_NAME = "School Thrift";

// Sets the browser tab title for a page and restores the previous one on
// unmount. Pass a falsy value to fall back to just the app name.
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
