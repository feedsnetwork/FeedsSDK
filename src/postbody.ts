import { Post } from "./Post";

const enum MediaType {
    noMeida = 0,
    containsImg = 1,
    containsVideo = 2,
}

export type PostContent = {
    version: string,
    content: string,
    mediaData: MediaData[],// 已经上传的到hive(size/type/scriptName@path)
    mediaType: MediaType
}

type MediaData = {
    kind: string,           //"image/video/audio"
    originMediaPath: string,
    type: string,           //"image/jpg",
    size: number,           //origin file size
    thumbnailPath: string    //"thumbnailCid"
    duration: number,
    imageIndex: number,
    additionalInfo: any,
    memo: any
}


export class PostBody {

    private readonly targetDid: string;
    private readonly postId: string;
    private readonly channelId: string;
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

    public static parse(targetDid: string, result: any): PostBody {
        let contents = null
        let postContent: PostContent = {
            version: '',
            content: '',
            mediaData: [],
            mediaType: MediaType.noMeida
        }
        try {
            contents = JSON.parse(result['content'])
        } catch (error) {
            throw error
        }

        if (contents) {
            let mDatas = contents['mediaData']
            let mData = {}
            for (let index = 0; index < mDatas.length; index++) {
                mData = mDatas[index]
            }
            const mediaData: MediaData = {
                kind: mData['kind'],
                originMediaPath: mData['originMediaPath'],
                type: mData['type'],
                size: mData['size'],
                thumbnailPath: mData['thumbnailPath'],
                duration: mData['duration'],
                imageIndex: mData['imageIndex'],
                additionalInfo: mData['additionalInfo'],
                memo: mData['memo']
            }
            let mediaDatas = []
            mediaDatas.push(mediaData)

            // postContent
            postContent = {
                version: contents['version'],
                content: contents['content'],
                mediaData: mediaDatas,
                mediaType: contents['mediaType']
            }
        }
        const postChunk = new PostBody(targetDid, result.post_id, result.channel_id)
        postChunk.setCreatedAt(result.created_at)
        postChunk.setUpdatedAt(result.updated_at)
        postChunk.content(postContent)
        postChunk.setStatus(result.status)
        postChunk.setType(result.type)
        postChunk.setTag(result.tag)
        postChunk.setProof(result.proof)
        postChunk.setMemo(result.memo)

        return postChunk
    }
}