import { JSONObject } from "@elastosfoundation/did-js-sdk"
import { utils } from "./utils/utils"

export class CommentInfo {
    private targetDid: string
    private createrDid: string
    private channelId: string
    private postId: string
    private commentId: string
    private refcommentId: string
    private content: string
    private status: string
    private updatedAt: number
    private createdAt: number
    private proof: string
    private memo: string
/**
 *
 * @param channelId： channel id
 * @param postId： postId
 * @param commentId： commentId
 */
    constructor(channelId: string, postId: string, commentId: string) {
        this.channelId = channelId
        this.postId = postId
        this.commentId = commentId
    }
/**
 * Set the creator of the post
 * @param targetDid the creator of the post
 */
    setTargetDid(targetDid: string): CommentInfo {
        this.targetDid = targetDid
        return this
    }

// Get the creator of the post
    public getTargetDidDid() {
        return this.targetDid
    }

/**
 * Set the creator of the comment
 * @param createrDid： the creator of the comment
 */
    setCreaterDid(createrDid: string): CommentInfo {
        this.createrDid = createrDid
        return this
    }

    // Get the creator of the comment
    public getCreaterDid() {
        return this.createrDid
    }

/**
 * Set channel id
 * @param channelId： channle id
 */
    setChannelId(channelId: string): CommentInfo {
        this.channelId = channelId
        return this
    }

    // Get channle id
    public getChannelId() {
        return this.channelId
    }

/**
 * Set post id
 * @param postId：post id
 */
    setPostId(postId: string): CommentInfo {
        this.postId = postId
        return this
    }

    // Get post id
    public getPostId() {
        return this.postId
    }

/**
 * Set comment id
 * @param commentId：comment id
 */
    setCommentId(commentId: string): CommentInfo {
        this.commentId = commentId
        return this
    }

    //Get comment id
    public getCommentId() {
        return this.commentId
    }

/**
 * Set refcomment id
 * @param refcommentId: refcomment id
 */
    setRefcommentId(refcommentId: string): CommentInfo {
        this.refcommentId = refcommentId
        return this
    }

    // Get refcomment id
    public getRefcommentId() {
        return this.refcommentId
    }

/***
 * Set comment content
 * @param content: comment content
 */
    setContent(content: string): CommentInfo {
        this.content = content
        return this
    }

    // Get comment content
    public getContent() {
        return this.content
    }

/**
 * Set comment statue
 * @param status:  0: available， 1： delete，2： edited
 */
    setStatus(status: string): CommentInfo {
        this.status = status
        return this
    }

    // Get the status of a comment 
    public getStatus() {
        return this.status
    }

    // Set the update timestamp of the comment
    setUpdatedAt(updatedAt: number): CommentInfo {
        this.updatedAt = updatedAt
        return this
    }
    
    // Get the update timestamp of the comment
    public getUpdatedAt() {
        return this.updatedAt
    }

    // Set the timestamp of the comment
    setCreatedAt(createdAt: number): CommentInfo {
        this.createdAt = createdAt
        return this
    }

    // Get the timestamp of the comment
    public getCreatedAt() {
        return this.createdAt
    }

    setProof(proof: string): CommentInfo {
        this.proof = proof
        return this
    }

    public getProof() {
        return this.proof
    }

    setMemo(memo: string): CommentInfo {
        this.memo = memo
        return this
    }

    public getMemo() {
        return this.memo
    }

    public static parse(targetDid: string, comment: any): CommentInfo {
        const commentInfo = new CommentInfo(comment.channel_id, comment.post_id, comment.comment_id)
        commentInfo.setTargetDid(targetDid)
        commentInfo.setCreaterDid(comment.creater_did)
        commentInfo.setRefcommentId(comment.refcomment_id)
        commentInfo.setContent(comment.content)
        commentInfo.setStatus(comment.status)
        commentInfo.setCreatedAt(comment.created_at)
        commentInfo.setUpdatedAt(comment.updated_at)

        return commentInfo
    }
}
