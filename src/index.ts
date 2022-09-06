/*
 * @Author: liaihong 
 * @Date: 2022-08-25 20:32:54
 * @LastEditors: liaihong 
 * @LastEditTime: 2022-09-06 12:10:44
 * @FilePath: /feeds-js-sdk-new/src/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

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
import { Post } from "./post"
import { PostBody } from "./postbody"
import { Profile } from "./profile"
import { ProfileHandler } from "./profilehandler"
import { Logger } from "./utils/logger"

import {
    IllegalArgumentException,
} from "./exceptions/exceptions"
Logger.setDefaultLevel(Logger.DEBUG)

export type {
}

export {
    Logger,
    AppContext,
    Authentication,
    Channel,
    ChannelEntry,
    ChannelHandler,
    ChannelInfo,
    Dispatcher,
    Utils,
    MyChannel,
    MyProfile,
    Post,
    PostBody,
    Profile,
    ProfileHandler
}

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

export default LibraryStarter