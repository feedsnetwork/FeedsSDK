import { Logger } from './utils/logger'
import { CommentInfo } from './commentInfo'
import { RuntimeContext } from './runtimecontext'
import { hiveService as VaultService } from "./hiveService"
import { utils } from "./utils/utils"
import { ScriptingNames as scripts } from './vault/constants';

const logger = new Logger("Comment")

export class Comment {
    private commentInfo: CommentInfo
    private context: RuntimeContext
    private vault: VaultService
    private targetDid: string

    /**
    *
    * @param targetDid：the creator of the post
    * @param commentInfo：Comment details
    */
    constructor(targetDid: string, commentInfo: CommentInfo) {
        this.context = RuntimeContext.getInstance()
        this.commentInfo = commentInfo
        this.vault = new VaultService()
        this.targetDid = targetDid
    }

    // generate comment id
    private generateCommentId(did: string, postId: string, refCommentId: string, commentContent: string): string {
        return utils.generateCommentId(did, postId, refCommentId, commentContent)
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
            const userDid = this.context.getUserDid()
            const channelId = this.getCommentInfo().getChannelId()
            const postId = this.getCommentInfo().getPostId()
            const refcommentId = this.getCommentInfo().getCommentId()
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
    
            const result = await this.vault.callScript(scripts.SCRIPT_CREATE_COMMENT, params,
                this.getCommentInfo().getTargetDidDid(), this.context.getAppDid())
            logger.debug("add comment success: ", result)
            params["updated_at"] = createdAt
            params["status"] = 0
            params["creater_did"] = this.context.getUserDid()
            const comment = Comment.parse(this.targetDid, params)
            return comment
        } catch (error) {
            logger.error("Add comment error : ", error)
            throw new Error(error)
        }
    }

    /**
    * update comment
    * @param content：comment content
    */
    public async updateComment(content: string): Promise<boolean> {
        try {
            const updatedAt = (new Date()).getTime()
            const channelId = this.getCommentInfo().getChannelId()
            const postId = this.getCommentInfo().getPostId()
    
            const params = {
                "channel_id": channelId,
                "post_id": postId,
                "comment_id": this.getCommentInfo().getCommentId(),
                "content": content,
                "updated_at": updatedAt
            }
            logger.debug("update comment params: ", params)
            const result = await this.vault.callScript(scripts.SCRIPT_UPDATE_COMMENT, params,
                this.getCommentInfo().getTargetDidDid(), this.context.getAppDid())
            logger.debug("update comment success: ", result)
            return true
        } catch (error) {
            logger.error("Update comment error : ", error)
            throw new Error(error)
        }
    }

    /**
    * deleteComment
    */
    public async deleteComment(): Promise<boolean> {
        try {
            const params = {
                "channel_id": this.getCommentInfo().getChannelId(),
                "post_id": this.getCommentInfo().getPostId(),
                "comment_id": this.getCommentInfo().getCommentId()
            }
            logger.debug("delete comment params: ", params)
            const targetDid = this.getCommentInfo().getTargetDidDid()
    
            const result = await this.vault.callScript(scripts.SCRIPT_DELETE_COMMENT, params,
                targetDid, this.context.getAppDid())
            logger.debug("delete comment success: ", result)
            return true
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
            const params = {
                "channel_id": this.getCommentInfo().getChannelId(),
                "post_id": this.getCommentInfo().getPostId(),
                "comment_id": this.getCommentInfo().getCommentId()
            }
            logger.debug("query comment byId params: ", params)
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params,
                this.getCommentInfo().getTargetDidDid(), this.context.getAppDid())
            logger.debug("query comment byId success: ", results)
            const result = results.find_message.items

            let comments = []
            result.forEach(item => {
                const comment = Comment.parse(this.targetDid, item)
                comments.push(comment)
            })
            logger.debug("query comment by id 'comments': ", comments)
            return comments[0]
        } catch (error) {
            logger.error('query comment by id error:', error)
            throw new Error(error)
        }
    }

    public static parse(targetDid: string, data: any): Comment {
        const commentInfo = CommentInfo.parse(targetDid, data)
        const comment = new Comment(targetDid, commentInfo)
        return comment
    }
} 

