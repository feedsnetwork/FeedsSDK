import { RuntimeContext } from "../runtimecontext";

export class ScriptingService {
    private appContext: RuntimeContext;

    constructor(runtimeContext: RuntimeContext) {
        this.appContext = runtimeContext;
    }

    async callScript(scriptName: string,
        document: any,
        targetDid: string,
        appid: string
    ): Promise<any> {
        let runner = await this.appContext.getScriptRunner(targetDid);
        return await runner.callScript(scriptName, document, targetDid, appid);
    }
}
