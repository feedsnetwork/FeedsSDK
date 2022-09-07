import { MyProfile } from "./MyProfile"
import { connectivity, DID } from '@elastosfoundation/elastos-connectivity-sdk-js'
// import { EssentialsConnector } from '@elastosfoundation/essentials-connector-client-browser';
import { DefaultDIDAdapter, DIDBackend, VerifiablePresentation, DIDDocument } from '@elastosfoundation/did-js-sdk';
import { Executable, InsertOptions, File as HiveFile, ScriptRunner, Vault, AppContext, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult } from "@elastosfoundation/hive-js-sdk";
import { AppContext as FeedsAppContext } from "./appcontext"
import { Logger } from './utils/logger'

const logger = new Logger("Authentication")
export class Authentication {
    private appContext: AppContext
    private feedsAppcontext: FeedsAppContext
    // private essentialsConnector = new EssentialsConnector();
    private contractor(appDid: string) {
        // TODO:
    }

    applicationDID(applicationDID: any) {
        throw new Error("Method not implemented.");
    }

    createHiveAppcontext(): Promise<AppContext> {
        return new Promise(async (resolve, reject) => {
            try {
                const appInstanceDid = this.feedsAppcontext.getAppDid()
                const userDid = this.feedsAppcontext.getUserDid()
                const applicationDid = this.feedsAppcontext.getApplicationDid()

                const appInstanceDIDDocumentString = this.feedsAppcontext.getAppInstanceDIDDocument()
                HiveLogger.setDefaultLevel(HiveLogger.TRACE)
                const currentNet = this.feedsAppcontext.getNetwork()
                DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
                try {
                    AppContext.setupResolver(currentNet, this.feedsAppcontext.getResolveCache())
                } catch (error) {
                }
                const path = this.feedsAppcontext.getLocalDataDir()
                // auth
                let self = this
                const context = await AppContext.build({
                    getLocalDataDir(): string {
                        return path
                    },
                    getAppInstanceDocument(): Promise<DIDDocument> {
                        return new Promise(async (resolve, reject) => {
                            try {
                                let appInstanceDidDocument = DIDDocument._parseOnly(appInstanceDIDDocumentString)
                                resolve(appInstanceDidDocument)
                            } catch (error) {
                                logger.error("get AppInstanceDocument Error: ", error)
                                reject(error)
                            }
                        })
                    },
                    getAuthorization(jwtToken: string): Promise<string> {
                        return new Promise(async (resolve, reject) => {
                            try {
                                console.log('Get authorization jwtToken is', jwtToken);
                                const authToken = 'TODO: '
                                console.log('Get authorization authToken is', authToken);
                                resolve(authToken)
                            } catch (error) {
                                logger.error("get Authorization Error: ", error)
                                reject(error)
                            }
                        })
                    }
                }, userDid, applicationDid)
                resolve(context)
            } catch (error) {
                logger.error("creat context error: ", error)
                reject(error)
            }
        })
    }

    generateHiveAuthPresentationJWT() {
        // TODO:
    }

    /*
    public async signin() {
        // await this.initConnectivitySDK();

        return new Promise<VerifiablePresentation>(async() => {
            const didAccess = new DID.DIDAccess()
            const presentation = await didAccess.requestCredentials({
                claims: [
                    DID.simpleIdClaim('Your avatar', 'avatar', false),
                    DID.simpleIdClaim('Your name', 'name', false),
                    DID.simpleIdClaim('Your description', 'description', false)
                ]
            })
        }).then(presentation => {
            DIDBackend.initialize(new DefaultDIDAdapter(""));
            const vp = VerifiablePresentation.parse(JSON.stringify(presentation.toJSON()))
            if (!vp.getHolder().toString()) {
                throw new Error("Unable to extra owner DID from the presetation")
            }

            const nameCredential = vp.getCredential('name')
            const name = nameCredential ? nameCredential.getSubject().getProperty('name'): '';

            const bioCredential = vp.getCredential('description')
            const bio = bioCredential ? bioCredential.getSubject().getProperty('description'): '';

            /*
            let essentialAddress = essentialsConnector.getWalletConnectProvider().wc.accounts[0]
            if (isInAppBrowser())
            essentialAddress = await window['elastos'].getWeb3Provider().address

            let user = {
                name: name,
                bio: bio,
                did: sDid,
                address: essentialAddress
            }

            sessionStorage.setItem("USER_DID", JSON.stringify(user));

        }).catch (async error => {
            // await this.essentialsConnector.getWalletConnectProvider().disconnect()
        })

    // TODO:
    }*/
}
