
import { useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";

export function useFileWatcher(
    onChange: (changeData?: { event: string; path: string }) => void
) {
    const debouncedOnChange = useCallback(debounce(onChange, 300), [onChange]);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        const evtSource = new EventSource("/api/watch");

        evtSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "file-change") {
                    debouncedOnChange(data);
                }
            } catch (error) {
                console.error("Error parsing SSE message:", error);
            }
        };

        evtSource.onerror = (err) => {
            console.error("SSE error:", err);
            evtSource.close();
            if (isMounted.current) {
                setTimeout(() => {
                    useFileWatcher(onChange); // try reconnect
                }, 3000);
            }
        };

        return () => {
            isMounted.current = false;
            evtSource.close();
            debouncedOnChange.cancel();
        };
    }, [onChange, debouncedOnChange]);

    return null;
}
