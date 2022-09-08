//import { utils } from "./utils/utils";

export class ChannelInfo {
    private downerDid: string;
    private channelId: string;
    private name: string;

    private displayName: string;
    private descritpion: string;
    private receivingAddress: string;
    private avatar: string;
    private category: string;
    private createdAt: number;
    private updatedAt: number;

    private type: string;   // TODO:
    private nft: string;    // TODO:
    private memo: string;   // TODO:
    private proof: string;  // TODO:

    private constructor(_ownerDid: string, _channelId: string, _name: string) {
        this.downerDid = _ownerDid;
        this.channelId = _channelId;
        this.name = _name;
    }

    /*public static generateChannelId(ownerDid: string, name: string): string {
        return utils.generateChannelId(ownerDid, name)
    }*/

    public static clone(channel: ChannelInfo): ChannelInfo {
        return (new ChannelInfo(channel.downerDid, channel.channelId, channel.name))
            .setDisplayName(channel.displayName)
            .setDescription(channel.descritpion)
            .setReceivingAddress(channel.receivingAddress);
    }

    public setDisplayName(displayName: string): ChannelInfo {
        this.displayName = displayName;
        return this;
    }

    public setDescription(description: string): ChannelInfo {
        this.descritpion = description;
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

    public setCategory(category: string): ChannelInfo {
        this.category = category;
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
        return this.descritpion;
    }

    public getReceivingAddress(): string {
        return this.receivingAddress;
    }

    public getAvatar(): string {
        return this.avatar;
    }

    public getCategory(): string {
        return this.category;
    }

    public getCreatedAt(): number {
        return this.createdAt;
    }

    public getUpdatedAt(): number {
        return this.updatedAt;
    }

    public getType(): string {
        return this.type;
    }

    public getNft(): string {
        return this.nft;
    }

    public getProof(): string {
        return this.proof;
    }

    public getMmemo(): string {
        return this.memo;
    }

    static parse(targetDid: string, channel: any): ChannelInfo {
        const channelInfo = new ChannelInfo(targetDid, channel.channel_id, channel.name)
        channelInfo.displayName = channel.display_name
        channelInfo.descritpion = channel.intro
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
