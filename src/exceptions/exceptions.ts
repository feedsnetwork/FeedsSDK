import { Logger } from '../utils/logger'

export class FeedsException extends Error {
    private causedBy?: Error;

    constructor(message?: string, causedBy?: Error) {
        super(message + (causedBy ? "\nCaused by: " + causedBy.message + (causedBy.stack ? "\nCaused by: " + causedBy.stack : "") : ""));
        this.causedBy = causedBy;
        Object.setPrototypeOf(this, new.target.prototype);
        let logger = new Logger(this.constructor.name);
        let stack = (causedBy ? "\nCaused by: " + causedBy.message + (causedBy.stack ? "\nCaused by: " + causedBy.stack : "") : "");
        logger.error(message + stack);
    }

    public from(e: any) {
        this.message += (" Caused by " + e.message);

        return this;
    }
}

export class IllegalArgumentException extends FeedsException { }
