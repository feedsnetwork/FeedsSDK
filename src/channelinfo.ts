
export class ChannelInfo {
    private readonly ownerDid: string;
    private readonly channelId: string;
    private readonly name: string;
    private displayName: string;
    private intro: string;
    private receivingAddress: string;

    private constructor(_ownerDid: string, _channelId: string, _name: string) {
        this.ownerDid = _ownerDid;
        this.channelId = _channelId;
        this.name = _name;
    }

    public static generateChannelId(ownerDid: string, name: string): string {
        // TODO:
        return "";
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
}
