import { Logger } from './utils/logger'
import { IllegalArgumentException } from "./exceptions/Exception"
import { connectivity, DID } from '@elastosfoundation/elastos-connectivity-sdk-js'
import { EssentialsConnector } from '@elastosfoundation/essentials-connector-client-browser';
import { DefaultDIDAdapter, DIDBackend, VerifiablePresentation } from '@elastosfoundation/did-js-sdk';
const logger = new Logger("AppContext")

export class AppContext {
    private essentialsConnector = new EssentialsConnector();
    private static instance: AppContext = null

    userDid = ''
    applicationDID = ''
    currentNet = ''
    resolverCache = ''

    private constructor(userDid: string, applicationDID: string, currentNet: string, resolverCache: string) {
        this.userDid = userDid
        this.applicationDID = applicationDID
        this.currentNet = currentNet
        this.resolverCache = resolverCache
    }

    public static initialize(
        userDid: string,
        applicationDid: string,
        currentNet: string,
        resolverCache: string
    ) {
        if (userDid === null || userDid === '') {
            logger.error("userDid is null .")
            throw new IllegalArgumentException("userDid cannot be empty")
        }
        if (applicationDid === null || applicationDid === '') {
            logger.error("applicationDID is null .")
            throw new IllegalArgumentException("applicationDID cannot be empty")
        }
        if (currentNet === null || currentNet === '') {
            logger.error("currentNet is null .")
            throw new IllegalArgumentException("currentNet cannot be empty")
        }
        if (resolverCache === null || resolverCache === '') {
            logger.error("resolverCache is null .")
            throw new IllegalArgumentException("resolverCache cannot be empty")
        }

        this.instance = new AppContext(userDid, applicationDid,
            currentNet, resolverCache)
    }

    public static getInstance(): AppContext {
        if (this.instance == null) {
            throw new IllegalArgumentException("The AppContext was not initialized. Please call AppContext.initialize(userDid, applicationDid, currentNet, resolverCache)")
        }
        return this.instance
    }

    public static isInitialized(): boolean {
        return this.instance !== null
    }
    private initConnectivitySDK() {
        const avaiConnectors = connectivity.getAvailableConnectors()
        if (avaiConnectors.findIndex( (option) => option.name == this.essentialsConnector.name) !== -1) {
            await connectivity.unregisterConnector(this.essentialsConnector.name)
            console.log('unregister connector succeeded')
        }

        await connectivity.registerConnector(this.essentialsConnector).then( async() => {
            connectivity.setApplicationDID(this.applicationDID)
/*
            connectivityInitialized = true;

            console.log('essentialsConnector', essentialsConnector);
            console.log('Wallet connect provider', essentialsConnector.getWalletConnectProvider());

            const hasLink = isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession();
            console.log('Has link to essentials?', hasLink);

            // Restore the wallet connect session - TODO: should be done by the connector itself?
            if (hasLink && !essentialsConnector.getWalletConnectProvider().connected)
                await essentialsConnector.getWalletConnectProvider().enable();
*/
        });
    }

    public async signin() {
        await this.initConnectivitySDK();

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
                */
        }).catch (async error => {
            await this.essentialsConnector.getWalletConnectProvider().disconnect()
        })
    }
}
