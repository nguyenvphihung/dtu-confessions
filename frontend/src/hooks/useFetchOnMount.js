import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

// Call the latest fetch function when the dependencies change.
// We keep a ref to the latest function so the effect doesn't close over a stale
// reference. Do not reset the ref in cleanup — resetting caused double calls
// when deps changed due to unrelated re-renders.
export function useFetchOnMount(fetchFn, deps = []) {
    const fnRef = useRef(fetchFn);
    fnRef.current = fetchFn;

    useEffect(() => {
        try {
            fnRef.current();
        } catch (e) {
            toast.error('Không thể tải dữ liệu');
        }
    }, deps);
}
