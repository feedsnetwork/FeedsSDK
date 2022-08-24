import { Channel } from "./Channel";
import { ChannelEntry } from "./ChannelEntry";
import { ChannelFetcher } from "./ChannelFetcher";
import { ChannelInfo } from "./ChannelInfo";
import { Dispatcher } from "./Dispatcher";
import { MyChannel } from "./MyChannel";

export class MyProfile implements ChannelFetcher {
    private readonly userDid: string;
    private readonly appDid: string;
    private readonly appInstanceDid: string;

    private resolveCache: string;

    public fetchOwnChannelCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public fetchOwnChannels(): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }

    public fetchAndDispatchOwnChannels(dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }

    public fetchOwnChannnelById(channelId: string): Promise<Channel> {
        throw new Error("Method not implemented.");
    }

    public fetchAndDispatchOwnChannelById(dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }

    public fetchSubscriptionCount(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    public fetchSubscriptions(earlierThan: number, maximum: number): Promise<Channel[]> {
        throw new Error("Method not implemented.");
    }

    public fetchAndDispatchSubscriptions(earlierThan: number, maximum: number, dispatcher: Dispatcher<Channel>) {
        throw new Error("Method not implemented.");
    }

    /**
     * Create a channel on remote vault
     *
     * @param name channel name
     * @param intro brief introduction to the channel
     * @param receivingAddr the ESC address to receive tipping payment
     * @param category channel category
     * @param proof [option] sigature to the channel metadata
     * @returns
     */
    public createChannel(channelInfo: ChannelInfo): Promise<MyChannel> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * Freeze channel when owner stop maintainning the channel.
     * Notice: calling this method will not remove channel metadata on remote vault
     * and also would keep all channel subscribers and all post data there. After calling
     * this method, channel owner would be unable to make posts on this channel, and
     * subscribers are also allowed to fetch posts but can not make comments on the posts.
     * This is the solf way to stop maintaining channel.
     *
     * @param channelId the channel to be freezed
     * @returns
     */

    public freezeChannel(channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * TODO:
     *
     * @param channelId
     * @returns
     */
    public unfreezeChannel(channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * Hard way to stop maintaining channel.
     * Warning: calling this method would lead to irreversible consequence that all Posts
     * on this channel and all subscribers would be removed and lost permanently.
     *
     * And users should unpublish (unregister) this channel from registery contract
     * on blockchain before decide to delete this channel.
     *
     * @param channelId channel id of the channel to be deleted.
     * @returns
     */
    public deleteChannel(channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * purge channel
     *
     * @param myChannel
     * @returns
     */
    public purgeChannel(channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * Publish channel onto Feeds channel registry contract, which is an ERC721 compatbile
     * contract as Feeds channel collection.
     *
     * @param channelId the channel Identifier to be published on registry contract.
     * @returns
     */
    public publishChannel(myChannel: MyChannel): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     *
     * @param channelId
     * @returns
     */
    public unpublishChannel(channelId: string): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * TODO:
     *
     * @param channel
     * @returns
     */
    public subscribeChannel(channelEntry: ChannelEntry): Promise<Channel> {
        throw new Error("Method not implemented");
        // TODO:
    }

    /**
     * TODO:
     *
     * @param channel
     * @returns
     */
     public unsubscribeChannel(channelEntry: ChannelEntry): Promise<boolean> {
        throw new Error("Method not implemented");
        // TODO:
    }
}