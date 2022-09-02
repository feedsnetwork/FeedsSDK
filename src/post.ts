import { Logger } from './utils/logger'
import { PostChunk } from './PostChunk'
import { Dispatcher } from './Dispatcher';
import { Comment } from './Comment'
import { theme } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { config } from "./config"
import { hiveService } from "./hiveService"
const logger = new Logger("Post")

export class Post {
    private chunk: PostChunk;
    private hiveservice: hiveService

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
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": this.getPostChunk().getChannelId(),
                    "post_id": this.getPostChunk().getPostId(),
                    "comment_id": commentId
                }
                const appid = config.ApplicationDID
                const targetDid = this.getPostChunk().getTargetDid()
                let result = await this.hiveservice.callScript(config.SCRIPT_DELETE_COMMENT, params, targetDid, appid)
                logger.log('Delete comment success: ', result)
                resolve(result)
            } catch (error) {
                logger.error('Delete comment error:', error)
                reject(error)
            }
        });
    }

    public fetchComments(earlierThan: number, maximum: number): Promise<Comment[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const appid = config.ApplicationDID
                const params = {
                    "channel_id": this.getPostChunk().getChannelId(), "post_id": this.getPostChunk().getPostId(), "limit": { "$lt": maximum },
                    "created": { "$gt": earlierThan }
                }
                let result = await this.hiveservice.callScript(config.SCRIPT_SOMETIME_COMMENT, params, this.getPostChunk().getTargetDid(), appid)
                logger.log('fetch comments success: ', result)
                resolve(result)
            } catch (error) {
                logger.error('fetch comments error:', error)
                reject(error)
            }
        });
    }

    public async fetchAndDispatchComments(earlierThan: number, maximum: number, dispatcher: Dispatcher<Comment>) {
        // TODO:
    }

    public fetchCommentsRangeOfTime(begin: number, end: number, maximum: number): Promise<Comment[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const appid = config.ApplicationDID
                const params = {
                    "channel_id": this.getPostChunk().getChannelId(), "post_id": this.getPostChunk().getPostId(), "start": begin,
                    "end": end
                }
                let result = await this.hiveservice.callScript(config.SCRIPT_SOMETIME_COMMENT, params, this.getPostChunk().getTargetDid(), appid)
                logger.log('fetch comments range of time success: ', result)
                resolve(result)
            } catch (error) {
                logger.error('fetch comments range of time error:', error)
                reject(error)
            }
        });
    }

    public async fetchAndDispatchCommentsRangeOfTime(begin: number, end: number, maximum: number, dispatcher: Dispatcher<Comment>) {
        //TODO;
    }

    public fetchCommentById(commentId: string): Promise<Comment> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": this.getPostChunk().getChannelId(),
                    "post_id": this.getPostChunk().getPostId(),
                    "comment_id": commentId
                }
                const appid = config.ApplicationDID
                let result = await this.hiveservice.callScript(config.SCRIPT_QUERY_COMMENT_BY_POSTID, params, this.getPostChunk().getTargetDid(), appid)
                logger.log('fetch comment by id success: ', result)
                resolve(result)
            } catch (error) {
                logger.error('fetch comment by id error:', error)
                reject(error)
            }
        })
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
