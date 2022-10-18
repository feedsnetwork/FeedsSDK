import { utils } from "./utils/utils"

export class ChannelInfo {
    private ownerDid: string // to create channel
    private channelId: string // the unique id of the channel
    private name: string // The name of the channel, which cannot be changed

    private displayName: string // The display name of the channel
    private descritpion: string // Description of the channel
    private receivingAddress: string // 
    private avatar: string // channel's avatar
    private category: string // 
    private createdAt: number // Timestamp of channel creation
    private updatedAt: number // Timestamp for updating channel information

    private type: string;   // TODO:
    private nft: string;    // TODO:
    private memo: string;   // TODO:
    private proof: string;  // TODO:
    /**
    *
    * @param _ownerDid： to create channel
    * @param _channelId：the unique id of the channel
    * @param _name：The name of the channel, which cannot be changed
    */
    private constructor(_ownerDid: string, _channelId: string, _name: string) {
        this.ownerDid = _ownerDid;
        this.channelId = _channelId;
        this.name = _name;
    }

    /**
    * generate channel id
    * @param ownerDid：of the channel holder
    * @param name：the name of the channel
    */
    public static generateChannelId(ownerDid: string, name: string): string {
        return utils.generateChannelId(ownerDid, name)
    }

    public static clone(channel: ChannelInfo): ChannelInfo {
        return (new ChannelInfo(channel.ownerDid, channel.channelId, channel.name))
            .setDisplayName(channel.displayName)
            .setDescription(channel.descritpion)
            .setReceivingAddress(channel.receivingAddress);
    }

    /**
    * Set the name displayed by the channel
    * @param displayName：channel's nickname
    */
    public setDisplayName(displayName: string): ChannelInfo {
        this.displayName = displayName;
        return this;
    }

    /**
    *   Set the description of the channel
    * @param description：Description of the channel
    */
    public setDescription(description: string): ChannelInfo {
        this.descritpion = description;
        return this;
    }

    /**
    *
    * @param receivingAddr
    */
    public setReceivingAddress(receivingAddr: string): ChannelInfo {
        this.receivingAddress = receivingAddr;
        return this;
    }

    /**
    * Set channel avatar
    * @param avatar：channel's avatar
    */
    public setAvatar(avatar: string): ChannelInfo {
        this.avatar = avatar;
        return this;
    }

    /**
    *
    * @param category
    */
    public setCategory(category: string): ChannelInfo {
        this.category = category;
        return this;
    }

    /**
    * Set the creation time of the channel
    * @param createdAt：The creation time of the channel
    */
    public setCreatedAt(createdAt: number): ChannelInfo {
        this.createdAt = createdAt;
        return this;
    }

    /**
    * Set update the timestamp of the channel
    * @param updatedAt：update the timestamp of the channel
    */
    public setUpdatedAt(updatedAt: number): ChannelInfo {
        this.updatedAt = updatedAt;
        return this;
    }

    /**
    * Set the state of the channel
    * @param type:（public and private）
    */
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

    /**
    * Get the creator of the channel
    */
    public getOwnerDid(): string {
        return this.ownerDid;
    }

    /**
    * Get the unique ID of the channel
    */
    public getChannelId(): string {
        return this.channelId;
    }

    /**
    * Get the name of the channel
    */
    public getName(): string {
        return this.name;
    }

    /**
    * Get the channel's nickname
    */
    public getDisplayName(): string {
        return this.displayName;
    }

    /**
    * Get the description of the channel
    */
    public getDescription(): string {
        return this.descritpion;
    }

    public getReceivingAddress(): string {
        return this.receivingAddress;
    }

    /**
    * Get channel's avatar
    */
    public getAvatar(): string {
        return this.avatar;
    }

    public getCategory(): string {
        return this.category;
    }

    /**
    * Get the creation time of the channel
    */
    public getCreatedAt(): number {
        return this.createdAt;
    }

    /**
    * Get the update time of the channel
    */
    public getUpdatedAt(): number {
        return this.updatedAt;
    }

    /**
    * Get the type of channel
    */
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

    // Deserialize channel information
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
