import { RuntimeContext } from './runtimecontext';
import { Logger } from './utils/logger'
import { PostBody } from './postbody'
import { Comment } from './comment'
import { hiveService } from "./hiveService"
import { utils } from "./utils/utils"
import { CommentInfo } from "./commentInfo"
import { hiveService as VaultService } from "./hiveService"
import { ScriptingNames as scripts } from './vault/constants';
import { Likeinfo } from './Likeinfo';

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
    public async addComment(content: string): Promise<Comment> {
        try {
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
    
            const result = await this.vault.callScript(scripts.SCRIPT_CREATE_COMMENT, params,
                this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("add comment success: ", result)
    
            params["updated_at"] = createdAt
            params["status"] = 0
            params["creater_did"] = this.context.getUserDid()
            const comment = Comment.parse(this.getBody().getTargetDid(), params)
            logger.debug("add comment 'CommentInfo': ", comment)
    
            return comment
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
    public async updateComment(commentId: string, content: string): Promise<boolean> {
        try {
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
    
            const result = await this.vault.callScript(scripts.SCRIPT_UPDATE_COMMENT, params,
                this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("update comment success: ", result)
            return true
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
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
                }
            const targetDid = this.getBody().getTargetDid()
            logger.debug("delete comment params: ", params)
    
            const result = await this.vault.callScript(scripts.SCRIPT_DELETE_COMMENT, params,
                targetDid, this.context.getAppDid())
            logger.debug("delete comment success: ", result)
            return true
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
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "limit": maximum,
                "end": earlierThan 
            }
            logger.debug("query comment params: ", params)
            const results = await this.vault.callScript(scripts.SCRIPT_COMMENT_BY_END_TIME_AND_LIMIT, params,
                this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query comment success: ", results)

            const result = results.find_message.items
            let comments = []
            result.forEach(item => {
                const com = CommentInfo.parse(this.getBody().getTargetDid(), item)
                comments.push(com)
            })
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
    public async queryCommentsRangeOfTime(begin: number, end: number): Promise<Comment[]> {
        try {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "start": begin,
                "end": end,
                "status": 0
            }
            logger.log("query comments range of time params: ", params)
            const results = await this.vault.callScript(scripts.SCRIPT_SOMETIME_COMMENT, params,
                this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query comments range of time success: ", results)
            const result = results.find_message.items
            let comments = []
            result.forEach(item => {
                const comment = Comment.parse(this.getBody().getTargetDid(), item)
                comments.push(comment)
            })
            logger.debug("query comments range of time 'Comment': ", comments)
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
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId
            }
            logger.debug("query comment by id params: ", params)

            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params,
                this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query comment by id success: ", results)
            const result = results.find_message.items
            let comments = []
            result.forEach(item => {
                const comment = Comment.parse(this.getBody().getTargetDid(), item)
                comments.push(comment)
            })
            logger.debug("query comment by id 'Comment': ", comments)
            return comments[0]
        } catch (error) {
            logger.error('query comment by id error:', error)
            throw new Error(error);
        }
    }

    // Query all comments under this post, including sub-comments, return up to 100...
    public async queryCommentByPostId(): Promise<Comment[]> {
        try {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
            }
            logger.debug("query comment by post id params: ", params)
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_POSTID, params,
                this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query comment by post id success: ", results)
            const result = results.find_message.items
            let comments = []
            result.forEach(item => {
                const comment = Comment.parse(this.getBody().getTargetDid(), item)
                comments.push(comment)
            })
            logger.debug("query comment by post id 'Comment': ", comments)
            return comments
        } catch (error) {
            logger.error('query comment by post id error:', error)
            throw new Error(error);
        }
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

    // commentId = 0 给post点赞
    public async addLike(likeId: string): Promise<Likeinfo> {
        try {
            const createdAt = (new Date()).getTime()
            const params = {
                "like_id": likeId,
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": "0",
                "created_at": createdAt,
                "updated_at": createdAt,
                "status": 0
            }
            const result = await this.vault.callScript(scripts.SCRIPT_CREATE_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid())
            logger.error('Add like success:', result)
            const likeInfo = Likeinfo.parse(this.context.getUserDid(), params)
            return likeInfo
        } catch (error) {
            logger.error('Add like error:', error)
            throw new Error(error)
        }
    }

    public async addLikeByCommentId(likeId: string, commentId: string): Promise<Likeinfo> {
        try {
            const createdAt = (new Date()).getTime()
            const params = {
                "like_id": likeId,
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId,
                "created_at": createdAt,
                "updated_at": createdAt,
                "status": 0
            }
            const result = await this.vault.callScript(scripts.SCRIPT_CREATE_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug('Add like success:', result)
            const likeInfo = Likeinfo.parse(this.context.getUserDid(), params)
            return likeInfo
        } catch (error) {
            logger.error('Add like error:', error)
            throw new Error(error)
        }
    }

    // targetDid: comment/post的创建者
    public async removeLike(): Promise<boolean> {
        try {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": "0",
            }
            await this.vault.callScript(scripts.SCRIPT_REMOVE_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid())
            return true
        } catch (error) {
            logger.error('Remove like error:', error)
            throw new Error(error)
        }
    }

    // 同步feeds api
    public async updateLike(likeInfo: Likeinfo): Promise<Likeinfo> {
        try {
            const updatedAt = (new Date()).getTime()
            const params = {
                "updated_at": updatedAt,
                "like_id": likeInfo.getLikeId(),
                "status": likeInfo.getStatus()
            }
            const result = await this.vault.callScript(scripts.SCRIPT_UPDATE_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("Update like success: ", result)
            return likeInfo
        } catch (error) {
            logger.error('Update like error:', error)
            throw new Error(error)
        }
    }

    // 同步feeds api 
    public async queryLikeByPost(): Promise<any> {
        try {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "status": 0 // available
            }
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_LIKE_BY_POST, params, this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query like by post success: ", results)
            const result = results.find_message.items
            let likeInfos = []
            result.forEach(item => {
                const like = Likeinfo.parse(this.getBody().getTargetDid(), item)
                likeInfos.push(like)
            })
            return likeInfos
        } catch (error) {
            logger.error('Query like by post error:', error)
            throw new Error(error)
        }
    }

    // 同步feeds api //targetDid: post创建者
    public async queryLikeById(): Promise<any> {
        try {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": "0",
                "status": 0 // available
            }
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_LIKE_BY_ID, params, this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query like by id success: ", results)
            const result = results.find_message.items
            let likeInfos = []
            result.forEach(item => {
                const like = Likeinfo.parse(this.getBody().getTargetDid(), item)
                likeInfos.push(like)
            })
            return likeInfos
        } catch (error) {
            logger.error('Query like by id error:', error)
            throw new Error(error)
        }
    }

    public async queryLikeByCommnetId(commentId: string): Promise<any> {
        try {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "comment_id": commentId,
                "status": 0 // available
            }
            const results = await this.vault.callScript(scripts.SCRIPT_QUERY_LIKE_BY_ID, params, this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query like by commnet id success: ", results)
            const result = results.find_message.items
            let likeInfos = []
            result.forEach(item => {
                const like = Likeinfo.parse(this.getBody().getTargetDid(), item)
                likeInfos.push(like)
            })
            return likeInfos
        } catch (error) {
            logger.error('Query like by comment id error: ', error)
            throw new Error(error)
        }
    }

    //post //同步feeds api
    public async queryLikeByRangeOfTime(start: number, end: number) {
        try {
            const params = {
                "channel_id": this.getBody().getChannelId(),
                "post_id": this.getBody().getPostId(),
                "start": start,
                "end": end // available
            }
            const results = await this.vault.callScript(scripts.SCRIPT_SOMETIME_LIKE, params, this.getBody().getTargetDid(), this.context.getAppDid())
            logger.debug("query like by range of time success: ", results)
            const result = results.find_message.items
            let likeInfos = []
            result.forEach(item => {
                const like = Likeinfo.parse(this.getBody().getTargetDid(), item)
                likeInfos.push(like)
            })
            return likeInfos

        } catch (error) {
            logger.error('Query like by range of time error: ', error)
            throw new Error(error)
        }
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
