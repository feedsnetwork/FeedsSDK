import { Logger as HiveLogger } from '@elastosfoundation/hive-js-sdk'

class LogLevel {
    public id: number;
    public name: string;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}
export class Logger {
    public static TRACE = new LogLevel(0, "TRACE");
    public static DEBUG = new LogLevel(1, "DEBUG");
    public static INFO  = new LogLevel(2, "INFO");
    public static WARNING = new LogLevel(3, "WARN");
    public static ERROR = new LogLevel(4, "ERROR");

    private context: string;
    private logLevel: LogLevel;
    private cid: string;
    private static DEFAULT_LOG_LEVEL = Logger.TRACE;

    public static setDefaultLevel(level: LogLevel) {
        Logger.DEFAULT_LOG_LEVEL = level;
        HiveLogger.setDefaultLevel(level)
    }

    public static getDefaultLevel(): LogLevel {
        return Logger.DEFAULT_LOG_LEVEL;
    }

    public setLevel(level: LogLevel) {
        this.logLevel = level;
    }

    public getLevel(): LogLevel {
        return this.logLevel ? this.logLevel : Logger.DEFAULT_LOG_LEVEL;
    }

    public levelIs(level: LogLevel): boolean {
        let currentLevel = this.logLevel ? this.logLevel : Logger.DEFAULT_LOG_LEVEL;
        return level.id >= currentLevel.id;
    }

    public constructor(context: string) {
        this.context = context ? context : "";
        this.cid = this.initializeCID();
    }

    /**
     * Generates a unique ID to be used as a correlation id to link multiple related things.
     */
    public initializeCID(): string {
        // Math.random hould be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        this.cid = Math.random().toString(36).substring(2, 9);
        return this.cid;
    }

    public currentCID(): string {
        return this.cid;
    }

    public resetCID(): void {
        this.cid = "";
    }

    public log(...data: any) {
        if (this.getLevel().id <= Logger.INFO.id) {
            this.format(Logger.INFO, data)
        }
    }

    public info(...data: any) {
        if (this.getLevel().id <= Logger.INFO.id) {
            this.format(Logger.INFO, data)
        }
    }

    public debug(...data: any) {
        if (this.getLevel().id <= Logger.DEBUG.id) {
            this.format(Logger.DEBUG, data)
        }
    }

    public trace(...data: any) {
        if (this.getLevel().id <= Logger.TRACE.id) {
            this.format(Logger.TRACE, data)
        }
    }

    public warn(...data: any) {
        if (this.getLevel().id <= Logger.WARNING.id) {
            this.format(Logger.WARNING, data)
        }
    }

    public error(...data: any) {
        if (this.getLevel().id <= Logger.ERROR.id) {
            this.format(Logger.ERROR, data)
        }
    }

    private format(level: LogLevel, data: any[]) {

        const logLine = (new Date()).toISOString() + " " + level.name + ": " + this.context + " "
        const content = [logLine]
        const contents = content.concat(data)
        console.log.apply(null, contents);
    }
}