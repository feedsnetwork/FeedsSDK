/**
 * The routine to dispatch content
 */
export interface Dispatcher<T> {
    dispatch(t: T): void;
}