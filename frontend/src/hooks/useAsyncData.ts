import { useEffect, useState } from 'react';

interface UseAsyncDataOptions<T> {
    initialData: T;
    errorMessage?: string;
}

interface UseAsyncDataResult<T> {
    data: T;
    isLoading: boolean;
    error: string | null;
}

type AsyncFn<T> = (signal: AbortSignal) => Promise<T>;

export function useAsyncData<T>(
    asyncFn: AsyncFn<T>,
    options: UseAsyncDataOptions<T>
): UseAsyncDataResult<T> {
    const { initialData, errorMessage } = options;
    const [data, setData] = useState<T>(initialData);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const load = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await asyncFn(controller.signal);

                if (!isMounted) {
                    return;
                }

                setData(result);
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }

                const fallbackMessage =
                    err instanceof Error && err.message
                        ? err.message
                        : errorMessage || 'Unable to load data. Please try again later.';

                setData(initialData);
                setError(fallbackMessage);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [asyncFn, errorMessage, initialData]);

    return { data, isLoading, error };
}
