'use strict'

import { AppContext } from "./appcontext"
import { Authentication } from "./authentication"
import { Channel } from "./channel"
import { ChannelEntry } from "./channelentry"
import { ChannelHandler } from "./channelhandler"
import { ChannelInfo } from "./channelinfo"
import { Dispatcher } from "./dispatcher"
import * as Utils from "./utils/utils"
import { MyChannel } from "./mychannel"
import { MyProfile } from "./myprofile"
import { PostA } from "./post"
import { PostBody } from "./postbody"
import { Profile } from "./profile"
import { ProfileHandler } from "./profilehandler"
import { Logger } from "./utils/logger"

import {
    IllegalArgumentException,
} from "./exceptions/exceptions"
Logger.setDefaultLevel(Logger.DEBUG)

export type {
    Dispatcher
}

export {
    Logger,
    AppContext,
    Authentication,
    MyProfile,
    Profile,
    MyChannel,
    Channel,
    ChannelEntry,
    PostBody,
    //PostA
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

export default LibraryStarter*/