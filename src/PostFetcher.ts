import { Dispatcher } from "./Dispatcher"
import { PostChunk } from "./PostChunk"

export interface PostFetcher {
    /**
     *
     * @param earlierThan
     * @param maximum
     */
     fetchPosts(earlierThan: number, maximum: number): Promise<PostChunk[]>

     /**
      *
      * @param until
      * @param dispatcher
      */
     fetchAndDispatchPosts(until: number, upperLimit: number, dispatcher: Dispatcher<PostChunk>)

     /**
      * TODO:
      * @param start
      * @param end
      * @returns
      */
     fetchPostsByRangeOfTime(start: number, end: number): Promise<PostChunk[]>

     /**
      *
      * @param start
      * @param end
      * @param dispatcher
      */
     fetchAndDispatchPostsRangeOfTime(start: number, end: number, upperLimit: number, dispatcher: Dispatcher<PostChunk>)

     /**
      *
      * @param postId
      * @returns
      */
     fetchPost(postId: string): Promise<PostChunk>

     /**
      *
      * @param postId
      * @param dispatcher
      */
     fetchAndDispatchPost(postId: string, dispatcher: Dispatcher<PostChunk>)
}