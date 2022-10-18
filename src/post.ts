import { RuntimeContext } from './runtimecontext';
import { Logger } from './utils/logger'
import { PostBody } from './postbody'
import { Dispatcher } from './dispatcher';
import { Comment } from './comment'
import { hiveService } from "./hiveService"
import { utils } from "./utils/utils"
import { CommentInfo } from "./commentInfo"
import { hiveService as VaultService } from "./hiveService"
import { ScriptingNames as scripts } from './vault/constants';

const logger = new Logger("Post")

export class Post {
    private body: PostBody;
    private vault: hiveService
    private context: RuntimeContext

    private constructor(body: PostBody) {
        this.body = body;
        this.context = RuntimeContext.getInstance()
        this.vault = new VaultService()
    }

    // Get post information
    public getBody(): PostBody {
        return this.body;
    }

    private generateCommentId(did: string, postId: string, refCommentId: string, commentContent: string): string {
        return utils.generateCommentId(did, postId, refCommentId, commentContent)
    }

/**
 * add comment to post
 * @param content: Comment content
 */
    public addComment(content: string): Promise<Comment> {
        const userDid = this.context.getUserDid()
        const channelId = this.getBody().getChannelId()
        const postId = this.getBody().getPostId()
        const refcommentId = "0"
        const commentId = this.generateCommentId(userDid, postId, refcommentId, content)
        const createdAt = (new Date()).getTime()
        let params = {
            "comment_id": commentId,
            "channel_id": channelId,
            "post_id": postId,
            "refcomment_id": refcommentId,
            "content": content,
            "created_at": createdAt,
        }
        logger.debug("add comment params: ", params)

        return this.vault.callScript(scripts.SCRIPT_CREATE_COMMENT, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                logger.debug("add comment success: ", result)

                params["updated_at"] = createdAt
                params["status"] = 0
                params["creater_did"] = this.context.getUserDid()
                const comment = Comment.parse(this.getBody().getTargetDid(), params)
                logger.debug("add comment 'CommentInfo': ", comment)

                return comment
            })
            .catch(error => {
                logger.error("Add coment error : ", error)
                throw new Error(error)
            })
    }
    
/**
 * Update the comment for the specified postid
 * @param commentId：comment id
 * @param content：comment content
 */
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
        logger.debug("update comment params: ", params)

        return this.vault.callScript(scripts.SCRIPT_UPDATE_COMMENT, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                logger.debug("update comment success: ", result)
                return true
            })
            .catch(error => {
                logger.error("Update comment error : ", error)
                throw new Error(error)
            })
    }

/**
 * Delete the comment with the specified commentid
 * @param commentId：comment id
 */
    public deleteComment(commentId: string) {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "comment_id": commentId
            }
         const targetDid = this.getBody().getTargetDid()
        logger.debug("delete comment params: ", params)

         return this.vault.callScript(scripts.SCRIPT_DELETE_COMMENT, params,
             targetDid, this.context.getAppDid())
            .then(result => {
                logger.debug("delete comment success: ", result)
                return true
            })
            .catch(error => {
                logger.error("Delete comment error : ", error)
                    throw new Error(error)
            })
    }

    // 新增
/**
 * Query the comment under the specified conditions under this post
 * @param earlierThan： end time
 * @param maximum：Maximum number of comments returned
 */
    public queryComments(earlierThan: number, maximum: number): Promise<CommentInfo[]> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "limit": maximum,
            "end": earlierThan 
        }
        logger.debug("query comment params: ", params)
        return this.vault.callScript(scripts.SCRIPT_COMMENT_BY_END_TIME_AND_LIMIT, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                return result.find_message.items
            }).then(result => {
                logger.debug("query comment success: ", result)
                let comments = []
                result.forEach(item => {
                    const com = CommentInfo.parse(this.getBody().getTargetDid(), item)
                    comments.push(com)
                })
                return comments
            })
            .catch(error => {
                logger.error("query comment error: ", error)
            throw new Error(error)
        })
    }

    public queryAndDispatchComments(earlierThan: number, maximum: number,
        dispatcher: Dispatcher<CommentInfo>) {
        return this.queryComments(earlierThan, maximum).then((comments) => {
            comments.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch( error => {
            throw new Error(error)
        })
    }

/** Return up to 100 entries，Include sub-comments
 * Query the comments in the between paragraphs under this post
 * @param begin： start time
 * @param end: end time
 */
    public queryCommentsRangeOfTime(begin: number, end: number): Promise<Comment[]> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
            "start": begin,
            "end": end,
            "status": 0
        }
        logger.log("query comments range of time params: ", params)
        return this.vault.callScript(scripts.SCRIPT_SOMETIME_COMMENT, params,
            this.getBody().getTargetDid(), this.context.getAppDid())
            .then(result => {
                logger.debug("query comments range of time success: ", result)
                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = Comment.parse(this.getBody().getTargetDid(), item)
                    comments.push(comment)
                })
                logger.debug("query comments range of time 'Comment': ", comments)
                return comments
            })
            .catch(error => {
                logger.error('query comments range of time error:', error)
            throw new Error(error)
        })
    }

    public queryAndDispatchCommentsRangeOfTime(begin: number, end: number,
        dispatcher: Dispatcher<Comment>) {
        return this.queryCommentsRangeOfTime(begin, end).then((comments) => {
            comments.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch( error => {
            throw new Error(error)
        })
    }

/**
 * Query the comment information of the specified commentId
 * @param commentId：comment id
 */
    public queryCommentById(commentId: string): Promise<Comment> {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
            }
        logger.debug("query comment by id params: ", params)

        return this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                logger.debug("query comment by id success: ", result)
                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = Comment.parse(this.getBody().getTargetDid(), item)
                    comments.push(comment)
                })
                logger.debug("query comment by id 'Comment': ", comments)
                return comments[0]
            })
            .catch(error => {
                logger.error('query comment by id error:', error)
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

    // Query all comments under this post, including sub-comments, return up to 100...
    public queryCommentByPostId(): Promise<Comment[]> {
        const params = {
            "channel_id": this.getBody().getChannelId(),
            "post_id": this.getBody().getPostId(),
        }
        logger.debug("query comment by post id params: ", params)
        return this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_POSTID, params,
            this.getBody().getTargetDid(), this.context.getAppDid()).then(result => {
                logger.debug("query comment by post id success: ", result)
                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = Comment.parse(this.getBody().getTargetDid(), item)
                    comments.push(comment)
                })
                logger.debug("query comment by post id 'Comment': ", comments)
                return comments
            })
            .catch(error => {
                logger.error('query comment by post id error:', error)
                throw new Error(error);
            })
    }
/**
 * generate like id
 * @param postId: post id
 * @param commentId: commnet id
 * @param userDid: user did
 */
    public static generateLikeId(postId: string, commentId: string, userDid: string): string {
        return utils.generateLikeId(postId, commentId, userDid)
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
