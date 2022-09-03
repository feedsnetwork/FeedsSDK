import { utils } from "./utils/utils";

export class ChannelInfo {
    private readonly ownerDid: string;
    private readonly channelId: string;
    private readonly name: string;
    private displayName: string;
    private intro: string;
    private receivingAddress: string;
    private avatar: string;
    private createdAt: number;
    private updatedAt: number;
    private type: string;
    private nft: string;
    private category: string;
    private proof: string;
    private memo: string;

    private constructor(_ownerDid: string, _channelId: string, _name: string) {
        this.ownerDid = _ownerDid;
        this.channelId = _channelId;
        this.name = _name;
    }

    public static generateChannelId(ownerDid: string, name: string): string {
        return utils.generateChannelId(ownerDid, name)
    }

    public static clone(channel: ChannelInfo): ChannelInfo {
        return (new ChannelInfo(channel.ownerDid, channel.channelId, channel.name))
            .setDisplayName(channel.displayName)
            .setDescription(channel.intro)
            .setReceivingAddress(channel.receivingAddress);
    }

    public setDisplayName(displayName: string): ChannelInfo {
        this.displayName = displayName;
        return this;
    }

    public setDescription(description: string): ChannelInfo {
        this.intro = description;
        return this;
    }

    public setReceivingAddress(receivingAddr: string): ChannelInfo {
        this.receivingAddress = receivingAddr;
        return this;
    }

    public setAvatar(avatar: string): ChannelInfo {
        this.avatar = avatar;
        return this;
    }

    public setCreatedAt(createdAt: number): ChannelInfo {
        this.createdAt = createdAt;
        return this;
    }

    public setUpdatedAt(updatedAt: number): ChannelInfo {
        this.updatedAt = updatedAt;
        return this;
    }

    public setType(type: string): ChannelInfo {
        this.type = type;
        return this;
    }

    public setNft(nft: string): ChannelInfo {
        this.nft = nft;
        return this;
    }

    public setCategory(category: string): ChannelInfo {
        this.category = category;
        return this;
    }

    public setProof(proof: string): ChannelInfo {
        this.proof = proof;
        return this;
    }

    public setMemo(memo: string): ChannelInfo {
        this.memo = memo;
        return this;
    }

    public getOwnerDid(): string {
        return this.channelId;
    }

    public getChannelId(): string {
        return this.channelId;
    }

    public getName(): string {
        return this.name;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public getDescription(): string {
        return this.intro;
    }

    public getReceivingAddress(): string {
        return this.receivingAddress;
    }

    public getAvatar(): string {
        return this.avatar;
    }

    public getCreatedAt(): Number {
        return this.createdAt;
    }

    public getUpdatedAt(): Number {
        return this.updatedAt;
    }

    public getType(): string {
        return this.type;
    }

    public getNft(): string {
        return this.nft;
    }

    public getCategory(): string {
        return this.category;
    }

    public getProof(): string {
        return this.proof;
    }

    public getMmemo(): string {
        return this.memo;
    }

    static parse(targetDid: string, channel: any): ChannelInfo {
        const channelInfo = new ChannelInfo(targetDid, channel.channel_id, channel.name)
        channelInfo.setDisplayName = channel.display_name
        channelInfo.setDescription = channel.intro
        channelInfo.receivingAddress = channel.tipping_address
        channelInfo.avatar = channel.avatar
        channelInfo.createdAt = channel.created_at
        channelInfo.updatedAt = channel.updated_at
        channelInfo.type = channel.type
        channelInfo.nft = channel.nft
        channelInfo.category = channel.category
        channelInfo.proof = channel.proof
        channelInfo.memo = channel.memo

        return channelInfo
    }
}