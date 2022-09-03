import { Logger } from './utils/logger'
import { PostBody } from './postbody'
import { Dispatcher } from './Dispatcher';
import { Comment } from './Comment'
import { theme } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { config } from "./config"
import { hiveService } from "./hiveService"
import { AppContext } from './appcontext';
const logger = new Logger("Post")

export class Post {
    private appContext: AppContext;
    private body: PostBody;
    private vault: hiveService

    private constructor(body: PostBody, ) {
        this.body = body;
    }

    public getBody(): PostBody {
        return this.body
    }

    public async addComent(): Promise<string> {
        throw new Error("Method not implemented");
    }

    public async updateComment(commentId: string) {
        throw new Error("Method not implemented");
    }

    public async deleteComment(commentId: string) {
        return new Promise( async() => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
            }
            const appid = config.ApplicationDID
            const targetDid = this.getBody().getTargetDid()

            await this.vault.callScript(config.SCRIPT_DELETE_COMMENT, params, targetDid,
                this.appContext.applicationDID)
        }).then( result => {
            // TODO:
        }).catch (error => {
            logger.error('Delete comment error:', error)
            throw new Error(error)
        });
    }

    public queryComments(earlierThan: number, maximum: number): Promise<Comment[]> {
        return new Promise<Comment[]>(async () => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "limit": { "$lt": maximum },
                "created": { "$gt": earlierThan }
            }
            await this.vault.callScript(config.SCRIPT_SOMETIME_COMMENT, params,
                this.getBody().getTargetDid(), this.appContext.applicationDID)
        }).then(result => {
            // TODO:
            return result
        }).catch(error => {
            logger.error('fetch comments error:', error)
            throw new Error(error)
        })
    }

    public async fetchAndDispatchComments(earlierThan: number, maximum: number,
        dispatcher: Dispatcher<Comment>) {
        // TODO:
    }

    public fetchCommentsRangeOfTime(begin: number, end: number, maximum: number): Promise<Comment[]> {
        return new Promise<Comment[]>(async (resolve, reject) => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "start": begin,
                "end": end
            }
            await this.vault.callScript(config.SCRIPT_SOMETIME_COMMENT, params,
                this.getBody().getTargetDid(), this.appContext.applicationDID)
        }).then(result => {
            // TODO:
            return result
        }).catch(error => {
            logger.error('fetch comments range of time error:', error)
            throw new Error(error)
        })
    }

    public async fetchAndDispatchCommentsRangeOfTime(begin: number, end: number, maximum: number,
        dispatcher: Dispatcher<Comment>) {
        //TODO;
    }

    public fetchCommentById(commentId: string): Promise<Comment> {
        return new Promise(async (resolve, reject) => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
            }
            await this.vault.callScript(config.SCRIPT_QUERY_COMMENT_BY_POSTID, params,
                this.getBody().getTargetDid(), this.appContext.applicationDID)
        }).then(result => {
            // TODO:
            return result
        }).catch(error => {
            logger.error('fetch comment by id error:', error)
            throw new Error(error)
        })
    }

    public async fetchAndDispatchCommentById(commentId: string, dispatcher: Dispatcher<Comment>) {
        //TODO;
    }

    public static parse(targetDid: string, result: any): Post {
        try {
            const postChun = PostBody.parse(targetDid, result)
            const post = new Post(postChun)
            return post
        } catch (error) {
            logger.error('Parse post result error: ', error)
            throw error
        }
    }
}
