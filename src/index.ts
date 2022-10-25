'use strict'

import { RuntimeContext } from "./runtimecontext"
import { MyChannel } from "./mychannel"
import { MyProfile } from "./myprofile"
import { PostBody, PostContent, MediaData, MediaType } from "./postbody"
import { Profile } from "./profile"
import { Logger } from "./utils/logger"
import { ChannelInfo } from "./channelinfo"
import { Channel } from "./channel"
import { Post } from "./post"
import { UserInfo } from "./userinfo"
import { CommentInfo } from "./commentInfo"

export {
    Logger,
    RuntimeContext,
    Channel,
    ChannelInfo,
    Post,
    PostBody,
    PostContent,
    MediaData,
    MediaType,
    //Comment,
    CommentInfo,
    Profile,
    UserInfo,
    MyProfile,
    MyChannel,
}
/*
interface ConfigOptions {
    id: string;
    url: string;
}
class LibraryStarter {
    public id: string;

    public url: string;

    constructor(options: ConfigOptions) {
        this.id = options.id;
        this.url = options.url;
    }

    getConfig() {
        return {
            id: this.id,
            url: this.url,
        };
    }
}
*/