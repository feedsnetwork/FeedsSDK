/*
 * @Author: liaihong
 * @Date: 2022-09-05 09:50:21
 * @LastEditors: liaihong
 * @LastEditTime: 2022-09-06 16:51:17
 * @FilePath: /feeds-js-sdk-new/src/appcontext.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Logger } from './utils/logger'
import { IllegalArgumentException } from "./exceptions/exceptions"

const logger = new Logger("AppContext")

export class AppContext {
    private static sInstance: AppContext = null

    private readonly applicationDid: string = "FEEDS-APPDID"
    private readonly network: string

    private constructor(network: string) {
        this.network = network
    }

    public getAppDid(): string {
        return this.applicationDid
    }

    public static initialize(currentNet: string) {
        if (currentNet === null || currentNet === '') {
            logger.error("currentNet is null .")
            throw new IllegalArgumentException("currentNet cannot be empty")
        }

        this.sInstance = new AppContext(currentNet)
    }

    public static getInstance(): AppContext {
        if (this.sInstance == null) {
            throw new IllegalArgumentException("The AppContext was not initialized. Please call AppContext.initialize(applicationDid, currentNet)")
        }
        return this.sInstance
    }

    public static isInitialized(): boolean {
        return this.sInstance !== null
    }
}
