import { JSONObject } from "@elastosfoundation/did-js-sdk"
import { utils } from "./utils/utils"

export enum MediaType {
    noMeida = 0,
    containsImg = 1,
    containsVideo = 2,
}

export class MediaData {
    private kind: string           //"image/video/audio"
    private originMediaPath: string // eg: 68eacbf862f696300cba2efe5fa3a162@feeds/data/68eacbf862f696300cba2efe5fa3a162
    private type: string           //"image/jpg",
    private size: number           //origin file size， eg: 8014599
    private thumbnailPath: string    //"thumbnailCid" eg: 7f63752d5e50bbb244725d910b061c24@feeds/data/7f63752d5e50bbb244725d910b061c24
    private duration: number // 0
    private imageIndex: number // 0
    private additionalInfo: any // {}
    private memo: any // {}

    private constructor() {
    }

    private setKind(kind: string) {
        this.kind = kind
    }

// Media kind:  "image/video/audio"
    public getKind() {
        return this.kind
    }

    private setOriginMediaPath(originMediaPath: string) {
        this.originMediaPath = originMediaPath
    }

    // eg: 68eacbf862f696300cba2efe5fa3a162@feeds/data/68eacbf862f696300cba2efe5fa3a162
    public getOriginMediaPath() {
        return this.originMediaPath
    }

    private setType(type: string) {
        this.type = type
    }

    // eg: "image/jpg"
    public getType() {
        return this.type
    }

    private setSize(size: number) {
        this.size = size
    }

    // Get media size
    public getSize() {
        return this.size
    }

    private setThumbnailPath(thumbnailPath: string) {
        this.thumbnailPath = thumbnailPath
    }
    
// "thumbnailCid" 
// eg: 7f63752d5e50bbb244725d910b061c24@feeds/data/7f63752d5e50bbb244725d910b061c24
    public getThumbnailPath() {
        return this.thumbnailPath
    }

    private setDuration(duration: number) {
        this.duration = duration
    }

    public getDuration() {
        return this.duration
    }

    private setImageIndex(imageIndex: number) {
        this.imageIndex = imageIndex
    }

    public getImageIndex() {
        return this.imageIndex
    }

    private setAdditionalInfo(additionalInfo: any) {
        this.additionalInfo = additionalInfo
    }

    public getAdditionalInfo() {
        return this.additionalInfo
    }

    private setMemo(memo: string) {
        this.memo = memo
    }

    public getMemo() {
        return this.memo
    }

    static parse(data: any): MediaData {

        const mediaData = new MediaData()
        mediaData.setKind(data.kind)
        mediaData.setOriginMediaPath(data.originMediaPath)
        mediaData.setType(data.type)
        mediaData.setSize(data.size)
        mediaData.setThumbnailPath(data.thumbnailPath)
        mediaData.setDuration(data.duration)
        mediaData.setImageIndex(data.imageIndex)
        mediaData.setAdditionalInfo(data.additionalInfo)
        mediaData.setMemo(data.memo)

        return mediaData
    }

    public toJons() {
        const mediaData = {
            "kind": this.getKind(),
            "originMediaPath": this.getOriginMediaPath(),
            "type": this.getType(),
            "size": this.getSize(),
            "imageIndex": this.getImageIndex(),
            "thumbnailPath": this.getThumbnailPath(),
            "duration": this.getDuration(),
            "additionalInfo": this.getAdditionalInfo(),
            "memo": this.getMemo()
        }

        return mediaData
    }
}

export class PostContent {
    private version: string
    private content: string
    private mediaData: MediaData[]// 已经上传的到hive(size/type/scriptName@path)
    private mediaType: MediaType

    constructor(version: string, content: string, mediaData: MediaData[], mediaType: MediaType) {
        this.version = version
        this.content = content
        this.mediaData = mediaData
        this.mediaType = mediaType
    }

    public getVersion() {
        return this.version
    }

    public getContent() {
        return this.content
    }

    public getMediaData() {
        return this.mediaData
    }

    public getMediaType() {
        return this.mediaType
    }

    public toString() {
        const mediaDatas = []
        this.mediaData.forEach(item => {
            mediaDatas.push(item.toJons())
        })
        const contentJson = {
            "version": this.version,
            "content": this.content,
            "mediaData": mediaDatas,
            "mediaType": this.mediaType
        }
        return JSON.stringify(contentJson)
    }
}

export class PostBody {

    private targetDid: string;
    private postId: string;
    private channelId: string;
    private createdAt: number;
    private updatedAt: number;
    private content: PostContent;
    private status: number;
    private type: string;
    private tag: string;
    private proof: string;
    private memo: string;

    private constructor(targetDid: string, postId: string, channelId: string) {
        this.targetDid = targetDid;
        this.postId = postId;
        this.channelId = channelId;
        const time = (new Date()).getTime()
        this.createdAt = time // 默认
        this.updatedAt = time
        this.tag = ''
        this.proof = ''
        this.memo = ''

    }

    static generatePostId(did: string, channelId: string, postContent: string) {
        return utils.generatePostId(did, channelId, postContent)
    }

    public setCreatedAt(createdAt: number): PostBody {
        this.createdAt = createdAt;
        return this;
    }

    public setUpdatedAt(updatedAt: number): PostBody {
        this.updatedAt = updatedAt;
        return this;
    }

    public setContent(content: PostContent): PostBody {
        this.content = content;
        return this;
    }


    public setContentWithJson(content: any): PostBody {
        const mediaDataJson = content.mediaData
        let mediaDatas = []
        mediaDataJson.forEach(item => {
            const mediaData = MediaData.parse(item)
            mediaDatas.push(mediaData)
        });
        const postContent = new PostContent(content.version, content.content, mediaDatas, content.mediaType)
        this.content = postContent
        return this
    }

    public setStatus(status: number): PostBody {
        this.status = status;
        return this;
    }
    public setType(type: string): PostBody {
        this.type = type;
        return this;
    }

    public setTag(tag: string): PostBody {
        this.tag = tag;
        return this;
    }

    public setProof(proof: string): PostBody {
        this.proof = proof;
        return this;
    }

    public setMemo(memo: string): PostBody {
        this.memo = memo;
        return this;
    }

    public getTargetDid(): string {
        return this.targetDid;
    }

    public getPostId(): string {
        return this.postId;
    }

    public getChannelId(): string {
        return this.channelId;
    }

    public getCreatedAt(): number {
        return this.createdAt;
    }

    public getUpdatedAt(): number {
        return this.updatedAt;
    }

    public getContent(): PostContent {
        return this.content;
    }

    public getStatus(): number {
        return this.status;
    }

    public getType(): string {
        return this.type;
    }

    public getTag(): string {
        return this.tag;
    }

    public getProof(): string {
        return this.proof;
    }

    public getMemo(): string {
        return this.memo;
    }

    public static parse(targetDid: string, post: any): PostBody {
        const contents = JSON.parse(post.content)
        const _mediaDatas = contents.mediaData

        let mediaDatas = []
        _mediaDatas.forEach(item => {
            const mediaData = MediaData.parse(item)
            mediaDatas.push(mediaData)
        })

        const postContent = new PostContent(contents.version, contents.content, mediaDatas, contents.mediaType)
        const postId = post.post_id
        const channelId = post.channel_id
        const postBody = new PostBody(targetDid, postId, channelId)
        postBody.setCreatedAt(post.created_at)
        postBody.setUpdatedAt(post.updated_at)
        postBody.setContent(postContent)
        postBody.setStatus(post.status)
        postBody.setType(post.type)
        postBody.setTag(post.tag)
        postBody.setProof(post.proof)
        postBody.setMemo(post.memo)
        // postBody.setPinStatus()//TODO:

        return postBody
    }
}
