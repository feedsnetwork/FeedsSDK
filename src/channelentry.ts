export class ChannelEntry {
    private _targetDid: string
    private channelId: string
    private createdAt: number
    private updatedAt: number
    private displayName: string
    private status: number

    public constructor(targetDid: string, channelId: string, displayName: string, status: number) {
        this.channelId = channelId;
        this.createdAt = new Date().getTime()
        this.updatedAt = new Date().getTime()
        this.displayName = displayName
        this._targetDid = targetDid
        this.status = status
    }

    public setCreatedAt(createdAt: number): ChannelEntry {
        this.createdAt = createdAt
        return this
    }

    public setUpdatedAt(updatedAt: number): ChannelEntry {
        this.updatedAt = updatedAt
        return this
    }

    public getTargetDid(): string {
        return this._targetDid
    }

    public getChannelId(): string {
        return this.channelId
    }

    public getCreatedAt(): number {
        return this.createdAt
    }

    public getUpdatedAt(): number {
        return this.updatedAt
    }

    public getDisplayName(): string {
        return this.displayName
    }

    public getStatus(): number {
        return this.status
    }
}