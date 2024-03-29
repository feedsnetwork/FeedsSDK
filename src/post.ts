import { RuntimeContext } from './runtimecontext';
import { Logger } from './utils/logger'
import { PostBody } from './postbody'
import { Comment } from './comment'
import { utils } from "./utils/utils"
import { CommentInfo } from "./commentInfo"
import { ScriptingNames as scripts } from './vault/constants';

const logger = new Logger("Post")

export class Post {
    private body: PostBody;
    private context: RuntimeContext

    public constructor(appContext: RuntimeContext, body: PostBody) {
        this.body = body;
        this.context = appContext;
    }

    // Get post information
    public getBody(): PostBody {
        return this.body;
    }

    public getPostId(): string {
        return this.body.getPostId()
    }

    public getChannelId(): string {
        return this.body.getChannelId()
    }

    /**
    * add comment to post
    * @param content: Comment content
    */
    public async addComment(content: string): Promise<Comment> {
        try {
            let userDid   = this.context.getUserDid()
            let channelId = this.getChannelId()
            let postId    = this.getPostId()
            let refcommentId = "0"
            let commentId = utils.generateCommentId(userDid, postId, refcommentId, content)
            let createdAt = new Date().getTime()
            let params = {
                "comment_id": commentId,
                "channel_id": channelId,
                "post_id"   : postId,
                "refcomment_id": refcommentId,
                "content": content,
                "created_at": createdAt,
            }

            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript(
                scripts.SCRIPT_CREATE_COMMENT,
                params,
                this.getBody().getTargetDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to add comment : ${result}`)

            params["updated_at"] = createdAt
            params["status"] = 0
            params["creater_did"] = this.context.getUserDid()

            return Comment.parseFrom(this.context, this.getBody().getTargetDid(), params)
        } catch (error) {
            logger.error("Add coment error : ", error)
            throw new Error(error)
        }
    }

    /**
    * Update the comment for the specified postid
    * @param commentId：comment id
    * @param content：comment content
    */
    public async updateComment(commentId: string, content: string) {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "post_id"   : this.getPostId(),
                "comment_id": commentId,
                "content"   : content,
                "updated_at": new Date().getTime()
            }
            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript(
                scripts.SCRIPT_UPDATE_COMMENT,
                params,
                this.getBody().getTargetDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to update comment: ${result}`);
        } catch (error) {
            logger.error("Update comment error : ", error)
            throw new Error(error)
        }
    }

    /**
    * Delete the comment with the specified commentid
    * @param commentId：comment id
    */
    public async deleteComment(commentId: string) {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "post_id"   : this.getPostId(),
                "comment_id": commentId
            }

            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript(
                scripts.SCRIPT_DELETE_COMMENT,
                params,
                this.getBody().getTargetDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to delete comment: ${result}`);
        } catch (error) {
            logger.error("Delete comment error : ", error)
            throw new Error(error)
        }
    }


    /** // 新增
    * Query the comment under the specified conditions under this post
    * @param earlierThan： end time
    * @param maximum：Maximum number of comments returned
    */
    public async queryComments(earlierThan: number, maximum: number): Promise<CommentInfo[]> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "post_id"   : this.getPostId(),
                "limit"     : maximum,
                "end"       : earlierThan
            }

            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript(
                scripts.SCRIPT_COMMENT_BY_END_TIME_AND_LIMIT,
                params,
                this.getBody().getTargetDid(),
                this.context.getAppDid()
            ) as any
            logger.debug(`Call script to query comments: ${result}`);

            let items = result.find_message.items
            let comments = []
            items.forEach((item: any) => {
                comments.push(CommentInfo.parse(this.getBody().getTargetDid(), item))
            })
            logger.debug(`Got comments: ${comments}`)
            return comments
        } catch (error) {
            logger.error("query comment error: ", error)
            throw new Error(error)
        }
    }

    /** Return up to 100 entries，Include sub-comments
    * Query the comments in the between paragraphs under this post
    * @param begin： start time
    * @param end: end time
    */
    public async queryCommentsByRangeOfTime(begin: number, end: number): Promise<Comment[]> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "post_id"   : this.getPostId(),
                "start"     : begin,
                "end"       : end,
                "status"    : 0
            }

            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript(
                scripts.SCRIPT_SOMETIME_COMMENT,
                params,
                this.getBody().getTargetDid(),
                this.context.getAppDid()
            ) as any
            logger.debug(`Call script to query comments by range of time : ${result}`);

            let items = result.find_message.items
            let comments = []
            items.forEach((item: any) => {
                comments.push(Comment.parseFrom(this.context, this.getBody().getTargetDid(), item))
            })
            logger.debug(`Got comments by range of time: ${comments}`)
            return comments
        } catch (error) {
            logger.error('query comments range of time error:', error)
            throw new Error(error)
        }
    }

    /**
    * Query the comment information of the specified commentId
    * @param commentId：comment id
    */
    public async queryCommentById(commentId: string): Promise<Comment> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "post_id"   : this.getPostId(),
                "comment_id": commentId
            }

            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript(
                scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID,
                params,
                this.getBody().getTargetDid(),
                this.context.getAppDid()
            ) as any
            logger.debug(`Call script to query comment : ${result}`);

            const items = result.find_message.items
            let comments = []
            items.forEach((item: any) => {
                comments.push(Comment.parseFrom(this.context, this.getBody().getTargetDid(), item))
            })
            logger.debug(`Got comment by Id: ${comments[0]}`)
            return comments[0]
        } catch (error) {
            logger.error('query comment by id error:', error)
            throw new Error(error);
        }
    }

    // Query all comments under this post, including sub-comments, return up to 100...
    public async queryCommentsByPostId(): Promise<Comment[]> {
        try {
            let params = {
                "channel_id": this.getChannelId(),
                "post_id"   : this.getPostId(),
            }

            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript(
                scripts.SCRIPT_QUERY_COMMENT_BY_POSTID,
                params,
                this.getBody().getTargetDid(),
                this.context.getAppDid()
            ) as any
            logger.debug(`Call script to query comments by postId : ${result}`);

            const items = result.find_message.items
            let comments = []
            items.forEach((item: any) => {
                comments.push(Comment.parseFrom(this.context, this.getBody().getTargetDid(), item))
            })
            logger.debug(`Got comments by postid: ${comments}`)
            return comments
        } catch (error) {
            logger.error('query comment by post id error:', error)
            throw new Error(error);
        }
    }

    public async downloadMediaByHiveUrl(url: string) {
        try {
            logger.debug("download media url: ", url)
            const params = url.split("@")
            const scriptName = params[0]
            const remoteName = params[1]
            let runner = await this.context.getScriptRunner(this.getBody().getTargetDid())
            let result = await runner.callScript<any>(scriptName, { "path": remoteName }, this.getBody().getTargetDid(), this.context.getAppDid())
            const transaction_id = result[scriptName]["transaction_id"]
            logger.debug("download media transaction_id: ", transaction_id)
            return await runner.downloadFile(transaction_id)
            // let jsonString = dataBuffer.toString()
        } catch (error) {
            logger.error('Download media by hive Url error:', error)
            throw error
        }
    }
/*
    public static generateLikeId(postId: string, commentId: string, userDid: string): string {
        return utils.generateLikeId(postId, commentId, userDid)
    }
*/
}
