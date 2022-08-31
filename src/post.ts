import { Logger } from './utils/logger'
import { PostChunk } from './PostChunk'
import { Dispatcher } from './Dispatcher';
import { Comment } from './Comment'
import { theme } from '@elastosfoundation/elastos-connectivity-sdk-js';

const logger = new Logger("Post")

export class Post {
    private chunk: PostChunk;
    private constructor(chunk: PostChunk) {
        this.chunk = chunk;
    }

    public getPostChunk(): PostChunk {
        return this.chunk
    }

    public addComent(): Promise<boolean> {
        throw new Error("Method not implemented");
    }

    public updateComment(): Promise<boolean> {
        throw new Error("Method not implemented");
    }

    public deleteComment(commentId: string): Promise<boolean> {
        throw new Error("Method not implemented");
    }

    public fetchComments(earlierThan: number, maximum: number): Promise<Comment[]> {
        throw new Error("Method not implemented");
    }

    public async fetchAndDispatchComments(earlierThan: number, maximum: number, dispatcher: Dispatcher<Comment>) {
        // TODO:
    }

    public fetchCommentsRangeOfTime(begin: number, end: number, maximum: number): Promise<Comment[]> {
        throw new Error("Method not implemented");
    }

    public async fetchAndDispatchCommentsRangeOfTime(begin: number, end: number, maximum: number, dispatcher: Dispatcher<Comment>) {
        //TODO;
    }

    public fetchCommentById(commentId: string): Promise<Comment> {
        throw new Error("Method not implemented");
    }

    public async fetchAndDispatchCommentById(commentId: string, dispatcher: Dispatcher<Comment>) {
        //TODO;
    }

    public static parse(targetDid: string, result: any): Post {
        try {
            const postChun = PostChunk.parse(targetDid, result)
            const post = new Post(postChun)
            return post
        } catch (error) {
            logger.error('Parse post result error: ', error)
            throw error
        }
    }
}
