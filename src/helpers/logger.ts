import { PLUGIN_NAME_NO_SPACE } from "./commonDefs";
import {
    log_debug,
    log_error,
    log_info,
    log_warning,
} from "./backend";
import DeckyLogger from "@decky/ui/dist/logger";

class Logger extends DeckyLogger {
    async debug(...args: any[]) {
        super.debug(...args);
        log_debug(args.join(' '));
    }

    async info(...args: any[]) {
        super.log(...args);
        log_info(args.join(' '));
    }

    async error(...args: any[]) {
        super.error(...args);
        log_error(args.join(' '));
    }

    async warning(...args: any[]) {
        super.warn(...args);
        log_warning(args.join(' '));
    }
}

const logger = new Logger(PLUGIN_NAME_NO_SPACE);
export default logger;
