/**
 * The routine to dispatch content
 */
interface Dispatcher<T> {
    dispatch(t: T): void;
}

export type {
    Dispatcher
}
