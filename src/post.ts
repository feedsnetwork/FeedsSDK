import { RuntimeContext } from './runtimecontext';
import { Logger } from './utils/logger'
import { PostBody } from './postbody'
import { Dispatcher } from './dispatcher';
import { Comment } from './comment'
import { hiveService } from "./hiveService"
import { utils } from "./utils/utils"

import { ScriptingNames as scripts } from './vault/constants';

const logger = new Logger("Post")

export class Post {
    private runtime: RuntimeContext;
    private body: PostBody;
    private vault: hiveService
    private context: RuntimeContext

    private constructor(body: PostBody) {
        this.body = body;
        this.context = RuntimeContext.getInstance()
    }

    public getBody(): PostBody {
        return this.body;
    }

    private generateCommentId(did: string, postId: string, refCommentId: string, commentContent: string): string {
        return utils.generateCommentId(did, postId, refCommentId, commentContent)
    }

    public addComent(content: string): Promise<boolean> {
        const userDid = this.context.getUserDid()
        const channelId = this.getBody().getChannelId()
        const postId = this.getBody().getPostId()
        const refcommentId = "0"
        const commentId = this.generateCommentId(userDid, postId, refcommentId, content)
        const createdAt = (new Date()).getTime()
        const params = {
            "comment_id": commentId,
            "channel_id": channelId,
            "post_id": postId,
            "refcomment_id": refcommentId,
            "content": content,
            "created_at": createdAt
        }

        return this.vault.callScript(scripts.SCRIPT_CREATE_COMMENT, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                return true
            })
            .catch(error => {
                logger.error("Add coment error : ", error)
                throw new Error(error)
            })
    }
    
    public updateComment(commentId: string, content: string): Promise<boolean> {
        const updatedAt = (new Date()).getTime()
        const channelId = this.getBody().getChannelId()
        const postId = this.getBody().getPostId()

        const params = {
            "channel_id": channelId,
            "post_id": postId,
            "comment_id": commentId,
            "content": content,
            "updated_at": updatedAt
        }
        return this.vault.callScript(scripts.SCRIPT_UPDATE_COMMENT, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                return true
            })
            .catch(error => {
                logger.error("Update comment error : ", error)
                throw new Error(error)
            })
    }

    public deleteComment(commentId: string) {
        return new Promise( (resolve, _reject) => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
            }
            const targetDid = this.getBody().getTargetDid()

            const result = this.vault.callScript(scripts.SCRIPT_DELETE_COMMENT, params,
                targetDid, this.runtime.getAppDid())
            // TODO: error.
            resolve(result)
        }).then( result => {
            // TODO:
        }).catch (error => {
            logger.error('Delete comment error:', error)
            throw new Error(error)
        });
    }

    public queryComments(earlierThan: number, maximum: number): Promise<Comment[]> {
        return new Promise<Comment[]>((resolve, _reject) => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "limit": { "$lt": maximum },
                "created": { "$gt": earlierThan }
            }
            const result = this.vault.callScript(scripts.SCRIPT_SOMETIME_COMMENT, params,
                this.getBody().getTargetDid(), this.runtime.getAppDid())

            // TODO: error
            resolve(result)
        }).then(result => {
            // TODO:
            return result
        }).catch(error => {
            logger.error('fetch comments error:', error)
            throw new Error(error)
        })
    }

    public queryAndDispatchComments(earlierThan: number, maximum: number,
        dispatcher: Dispatcher<Comment>) {
        return this.queryComments(earlierThan, maximum).then((comments) => {
            comments.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch( error => {
            throw new Error(error)
        })
    }

    public queryCommentsRangeOfTime(begin: number, end: number, maximum: number): Promise<Comment[]> {
       return new Promise<Comment[]>((resolve, _reject) => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "start": begin,
                "end": end
            }
            const result = this.vault.callScript(scripts.SCRIPT_SOMETIME_COMMENT, params,
                this.getBody().getTargetDid(), this.runtime.getAppDid())
            // TODO: error.
            resolve(result)
        }).then(result => {
            // TODO:
            return result
        }).catch(error => {
            logger.error('fetch comments range of time error:', error)
            throw new Error(error)
        })
    }

    public queryAndDispatchCommentsRangeOfTime(begin: number, end: number, maximum: number,
        dispatcher: Dispatcher<Comment>) {
        return this.queryComments(begin, end).then((comments) => {
            comments.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch( error => {
            throw new Error(error)
        })
    }

    public queryCommentById(commentId: string): Promise<Comment> {
        return new Promise<Comment>((resolve, _reject) => {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
            }
            const result = this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_POSTID, params,
                this.getBody().getTargetDid(), this.runtime.getAppDid())
            //TODO:
            resolve(result)
        }).then(result => {
            // TODO:
            return result
        }).catch(error => {
            logger.error('fetch comment by id error:', error)
            throw new Error(error);
        })
    }

    public queryAndDispatchCommentById(commentId: string, dispatcher: Dispatcher<Comment>) {
        return this.queryCommentById(commentId).then((comment) => {
            dispatcher.dispatch(comment)
        }).catch( error => {
            throw new Error(error)
        })
    }

    public static parse(targetDid: string, result: any): Post {

        try {
            const postChun = PostBody.parse(targetDid, result)
            const post = new Post(postChun)
            return post
        } catch (error) {
            //logger.error('Parse post result error: ', error)
            throw error
        }
        return null;
    }
}
