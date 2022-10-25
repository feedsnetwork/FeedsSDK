
class UserInfo {
    private userDid: string
    private walletAddress: string
    private displayName: string

    constructor(userDid: string, walletAddress: string, name: string) {
        this.userDid = userDid
        this.walletAddress = walletAddress
        this.displayName = name
    }

    public getUserDid(): string {
        return this.userDid
    }

    public getWalletAddress(): string {
        return this.walletAddress
    }

    public getDisplayName(): string {
        return this.displayName
    }
}

const deserializeToUserInfo = (jsonData: any): UserInfo => {
    return new UserInfo(jsonData.user_did, "", jsonData.display_name)
}

export {
    deserializeToUserInfo,
    UserInfo
}

