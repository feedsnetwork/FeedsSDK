import { Logger } from './utils/logger'
import { CommentInfo } from './commentInfo'
import { RuntimeContext } from './runtimecontext'
import { utils } from "./utils/utils"
import { ScriptingNames as scripts } from './vault/constants';
import { ScriptingService as ScriptRunner } from "./vault/scriptingservice";

const logger = new Logger("Comment")

export class Comment {
    private commentInfo: CommentInfo
    private context: RuntimeContext
    private targetDid: string
    private scriptingService: ScriptRunner;

    /**
    *
    * @param targetDid：the creator of the post
    * @param commentInfo：Comment details
    */
    constructor(appContext: RuntimeContext, targetDid: string, commentInfo: CommentInfo) {
        this.context = appContext
        this.commentInfo = commentInfo
        this.targetDid = targetDid
        this.scriptingService = new ScriptRunner(appContext)
    }

    /**
    * Get review details
    */
    public getCommentInfo(): CommentInfo {
        return this.commentInfo
    }

    /**
    * Get the creator of the post
    */
    public getTargetDid(): string {
        return this.targetDid
    }

    /**
    * add comment
    * @param content： comment content
    */
    public async addComment(content: string): Promise<Comment> {
        try {
            let userDid = this.context.getUserDid()
            let channelId = this.getCommentInfo().getChannelId()
            let postId = this.getCommentInfo().getPostId()
            let refcommentId = this.getCommentInfo().getCommentId()
            let commentId = utils.generateCommentId(userDid, postId, refcommentId, content);
            let createdAt = new Date().getTime()
            let params = {
                "comment_id": commentId,
                "channel_id": channelId,
                "post_id": postId,
                "refcomment_id": refcommentId,
                "content": content,
                "created_at": createdAt,
            }

            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_CREATE_COMMENT,
                params,
                this.getCommentInfo().getTargetDidDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to create comment : ${result}`)

            params["updated_at"] = createdAt
            params["status"] = 0
            params["creater_did"] = this.context.getUserDid()
            return Comment.parse(this.targetDid, params)
        } catch (error) {
            logger.error("Add comment error : ", error)
            throw new Error(error)
        }
    }

    /**
    * update comment
    * @param content：comment content
    */
    public async updateComment(content: string) {
        try {
            let params = {
                "channel_id": this.getCommentInfo().getChannelId(),
                "post_id"   : this.getCommentInfo().getPostId(),
                "comment_id": this.getCommentInfo().getCommentId(),
                "content"   : content,
                "updated_at": new Date().getTime()
            }

            const result = await this.scriptingService.callScript(
                scripts.SCRIPT_UPDATE_COMMENT,
                params,
                this.getCommentInfo().getTargetDidDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to update comment: ${result}`);
        } catch (error) {
            logger.error("Update comment error : ", error)
            throw new Error(error)
        }
    }

    /**
    * deleteComment
    */
    public async deleteComment() {
        try {
            let params = {
                "channel_id": this.getCommentInfo().getChannelId(),
                "post_id"   : this.getCommentInfo().getPostId(),
                "comment_id": this.getCommentInfo().getCommentId()
            }
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_DELETE_COMMENT,
                params,
                this.getCommentInfo().getTargetDidDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to delete comment: ${result}`);
        } catch (error) {
            logger.error("delete comment error : ", error)
            throw new Error(error)
        }
    }

    /**
    * Query the comments of the specified comment id
    */
    public async queryCommentById(): Promise<Comment[]> {
        try {
            let params = {
                "channel_id": this.getCommentInfo().getChannelId(),
                "post_id"   : this.getCommentInfo().getPostId(),
                "comment_id": this.getCommentInfo().getCommentId()
            }
            let result = await this.scriptingService.callScript(
                scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID,
                params,
                this.getCommentInfo().getTargetDidDid(),
                this.context.getAppDid()
            )
            logger.debug(`Call script to query comment: ${result}`);

            const items = result.find_message.items
            let comments = []
            result.forEach((item: any) => {
                comments.push(Comment.parse(this.targetDid, item))
            })
            logger.debug(`Got comment by Id: ${comments}`);
            return comments[0]
        } catch (error) {
            logger.error('query comment by id error:', error)
            throw new Error(error)
        }
    }

    public static parse(targetDid: string, data: any): Comment {
        const commentInfo = CommentInfo.parse(targetDid, data)
        const comment = new Comment(RuntimeContext.getInstance(), targetDid, commentInfo)
        return comment
    }
}

