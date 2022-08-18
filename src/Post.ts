import { Logger } from './utils/logger'
import { HiveData } from './HiveData'

const logger = new Logger("Post")
export class Post {

    postInfo: HiveData.PostInfo

    constructor(postInfo: HiveData.PostInfo) {
        this.postInfo = postInfo
    }

    public getPostInfo(): HiveData.PostInfo {
        return this.postInfo
    }

    
}
