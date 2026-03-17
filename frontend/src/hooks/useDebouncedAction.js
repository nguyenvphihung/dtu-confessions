import { useEffect, useRef } from 'react';

export function useDebouncedAction(action, delay = 250) {
    const actionRef = useRef(action);
    const timerRef = useRef(null);

    useEffect(() => {
        actionRef.current = action;
    }, [action]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (...args) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            actionRef.current(...args);
        }, delay);
    };
}
