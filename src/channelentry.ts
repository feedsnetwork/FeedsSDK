
export class ChannelEntry {
    private _targetDid: string // the creator of the channel
    private channelId: string // The unique id representing the channel
    private createdAt: number // Time of first subscription
    private updatedAt: number // When to update subscription status
    private displayName: string // Subscriber's nickname in this channel
    private status: number // The subscription status of the channel
    /**
    *
    * @param targetDid：the creator of the channel
    * @param channelId：The unique id representing the channel
    * @param displayName：Subscriber's nickname in this channel
    * @param status：The subscription status of the channel
    */
    public constructor(targetDid: string, channelId: string, displayName: string, status: number) {
        this.channelId = channelId;
        this.createdAt = new Date().getTime()
        this.updatedAt = new Date().getTime()
        this.displayName = displayName
        this._targetDid = targetDid
        this.status = status
    }

    /**
    * Set time for first subscription
    *
    * @param createdAt：Timestamp of first subscription
    */
    public setCreatedAt(createdAt: number): ChannelEntry {
        this.createdAt = createdAt
        return this
    }

    /**
    * When to update subscription status
    * @param updatedAt：Timestamp to update subscription status
    */
    public setUpdatedAt(updatedAt: number): ChannelEntry {
        this.updatedAt = updatedAt
        return this
    }

    /**
    * Get the targetDid of the channel
    */
    public getTargetDid(): string {
        return this._targetDid
    }

    /**
    * Get the unique id of the channel
    */
    public getChannelId(): string {
        return this.channelId
    }

    /**
    * Get the time when the channel was first subscribed
    */
    public getCreatedAt(): number {
        return this.createdAt
    }

    /**
    * Get the timestamp of the latest update subscription channel status
    */
    public getUpdatedAt(): number {
        return this.updatedAt
    }

    /**
    * Get the nickname set by the subscriber in this channel
    */
    public getDisplayName(): string {
        return this.displayName
    }

    /**
    * Get subscription status
    */
    public getStatus(): number {
        return this.status
    }
}