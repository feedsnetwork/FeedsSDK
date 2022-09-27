import { JSONObject } from "@elastosfoundation/did-js-sdk"
import { utils } from "./utils/utils"

export class CommentInfo {
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

    constructor(channelId: string, postId: string, commentId: string) {
        this.channelId = channelId
        this.postId = postId
        this.commentId = commentId
    }

    setCreaterDid(createrDid: string): CommentInfo {
        this.createrDid = createrDid
        return this
    }

    public getCreaterDid() {
        return this.createrDid
    }

    setChannelId(channelId: string): CommentInfo {
        this.channelId = channelId
        return this
    }

    public getChannelId() {
        return this.channelId
    }

    setPostId(postId: string): CommentInfo {
        this.postId = postId
        return this
    }

    public getPostId() {
        return this.postId
    }

    setCommentId(commentId: string): CommentInfo {
        this.commentId = commentId
        return this
    }

    public getCommentId() {
        return this.commentId
    }

    setRefcommentId(refcommentId: string): CommentInfo {
        this.refcommentId = refcommentId
        return this
    }

    public getRefcommentId() {
        return this.refcommentId
    }

    setContent(content: string): CommentInfo {
        this.content = content
        return this
    }

    public getContent() {
        return this.content
    }

    setStatus(status: string): CommentInfo {
        this.status = status
        return this
    }

    public getStatus() {
        return this.status
    }

    setUpdatedAt(updatedAt: number): CommentInfo {
        this.updatedAt = updatedAt
        return this
    }

    public getUpdatedAt() {
        return this.updatedAt
    }

    setCreatedAt(createdAt: number): CommentInfo {
        this.createdAt = createdAt
        return this
    }

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

    public static parse(comment: any): CommentInfo {
        const commentInfo = new CommentInfo(comment.channel_id, comment.post_id, comment.comment_id)
        commentInfo.setCreaterDid(comment.creater_did)
        commentInfo.setRefcommentId(comment.refcomment_id)
        commentInfo.setContent(comment.content)
        commentInfo.setStatus(comment.status)
        commentInfo.setCreatedAt(comment.created_at)
        commentInfo.setUpdatedAt(comment.updated_at)

        return commentInfo
    }
}
