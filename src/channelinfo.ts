import { utils } from "./utils/utils"

class ChannelInfo {
    private readonly ownerDid: string // creator of this channel
    private readonly channelId: string // the unique id of the channel
    private readonly name: string // The name of the channel, which cannot be changed

    private displayName: string // The display name of the channel
    private descritpion: string // Description of the channel
    private receivingAddress: string
    private avatar: string
    private category: string
    private createdAt: number // Timestamp of channel creation
    private updatedAt: number // Timestamp for updating channel information

    private type = "public";
    private nft = "";   // used for nft image as avatar.
    private memo = "";  // reserved field
    private proof = ""; // signature of the channel information
    /**
    *
    * @param _ownerDid： to create channel
    * @param _channelId：the unique id of the channel
    * @param _name：The name of the channel, which cannot be changed
    */
    constructor(ownerDid: string, channelId: string, name: string) {
        this.ownerDid = ownerDid;
        this.channelId = channelId;
        this.name = name;
    }

    /**
    * generate channel id
    * @param ownerDid：of the channel holder
    * @param name：the name of the channel
    */
    public static generateChannelId(ownerDid: string, name: string): string {
        return utils.generateChannelId(ownerDid, name)
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
    public setPaymentAddress(receivingAddr: string): ChannelInfo {
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

    public getPaymentAddress(): string {
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
}

// Deserialize into channel information object
const deserializeToChannelInfo = (targetDid: string, channel: any): ChannelInfo => {
    return new ChannelInfo(targetDid, channel.channel_id, channel.name)
        .setDisplayName(channel.display_name)
        .setDescription(channel.intro)
        .setPaymentAddress(channel.tipping_address)
        .setAvatar(channel.avatar)
        .setCreatedAt(channel.created_at)
        .setUpdatedAt(channel.updated_at)
        .setCategory(channel.category)
}

export {
    deserializeToChannelInfo,
    ChannelInfo
}
