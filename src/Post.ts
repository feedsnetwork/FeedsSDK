import { Logger } from './utils/logger'
import { PostChunk } from './PostChunk'
import { Dispatcher } from './Dispatcher';
import { Comment } from './Comment'

const logger = new Logger("Post")

export class Post {
    private chunk: PostChunk;

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
}
