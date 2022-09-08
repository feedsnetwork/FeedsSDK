import { MyProfile } from "./MyProfile"
import { connectivity, DID as ConDID } from '@elastosfoundation/elastos-connectivity-sdk-js'
// import { EssentialsConnector } from '@elastosfoundation/essentials-connector-client-browser';
import { DefaultDIDAdapter, DIDBackend, VerifiablePresentation, DIDDocument, JWTParserBuilder, JWTHeader } from '@elastosfoundation/did-js-sdk';
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
                                const authToken = self.generateHiveAuthPresentationJWT(jwtToken)
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

    async generateHiveAuthPresentationJWT(challeng) {
        if (challeng === null || challeng === undefined || challeng === '') {
            logger.log('Params error: challeng 不能为空')
        }

        // Parse, but verify on chain that this JWT is valid first 
        const JWTParser = new JWTParserBuilder().build()
        const parseResult = await JWTParser.parse(challeng)
        const claims = parseResult.getBody()
        if (claims === undefined) {
            return // TODO: 抛出error
        }
        const payload = claims.getJWTPayload()
        const nonce = payload['nonce'] as string
        const hiveDid = claims.getIssuer()
        const appIdCredential = await this.issueDiplomaFor()
        const presentation = await this.createPresentation(appIdCredential, hiveDid, nonce)
        const token = await this.createChallengeResponse(presentation, hiveDid, storePassword)
        return token
    }

    async issueDiplomaFor() {
        const applicationDid = this.feedsAppcontext.getApplicationDid()
        connectivity.setApplicationDID(applicationDid)
        const didAccess = new ConDID.DIDAccess()
        let credential = await didAccess.getExistingAppIdentityCredential()
        if (credential) {
            return credential
        }

        credential = await didAccess.generateAppIdCredential()

        if (credential) {
            return credential
        }
    }

    async createPresentation(vc, hiveDid, nonce) {
        const access = new ConDID.DIDAccess()
        const info = await access.getOrCreateAppInstanceDID()
        const info2 = await access.getExistingAppInstanceDIDInfo()
        const vpb = await VerifiablePresentation.createFor(info.did, null, info.didStore)
        const vp = await vpb.credentials(vc).realm(hiveDid).nonce(nonce).seal(info2.storePassword)
        return vp
    }

    async createChallengeResponse(vp, hiveDid, storepass) {
        const exp = new Date()
        const iat = new Date().getTime()
        exp.setFullYear(exp.getFullYear() + 2)
        const expTime = exp.getTime()

        // Create JWT token with presentation.
        const doc = await this.getAppInstanceDIDDoc()
        const info = await new ConDID.DIDAccess().getExistingAppInstanceDIDInfo()
        const token = await doc.jwtBuilder()
            .addHeader(JWTHeader.TYPE, JWTHeader.JWT_TYPE)
            .addHeader("version", "1.0")
            .setSubject("DIDAuthResponse")
            .setAudience(hiveDid)
            .setIssuedAt(iat)
            .setExpiration(expTime)
            .claimsWithJson("presentation", vp.toString(true))
            .sign(info.storePassword);
        return token
    }

    async getAppInstanceDIDDoc() {
        const didAccess = new ConDID.DIDAccess()
        const info = await didAccess.getOrCreateAppInstanceDID()
        const instanceDIDDocument = await info.didStore.loadDid(info.did.toString())
        logger.log("instanceDIDDocument ======= ", instanceDIDDocument)
        return instanceDIDDocument
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
