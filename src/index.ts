'use strict'

import { RuntimeContext } from "./runtimecontext"
import { ChannelEntry } from "./channelentry"
import { MyChannel } from "./mychannel"
import { MyProfile } from "./myprofile"
import { PostBody } from "./postbody"
import { Profile } from "./profile"
import { Logger } from "./utils/logger"
import { ChannelInfo } from "./channelinfo"
import { Channel } from "./channel"
import { Post } from "./post"
import { signin, signout, checkSignin } from "./signin"

export {
    Logger,
    signin,
    signout,
    checkSignin,
    RuntimeContext,
    MyProfile,
    Profile,
    MyChannel,
    Channel,
    ChannelEntry,
    Post,
    PostBody
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