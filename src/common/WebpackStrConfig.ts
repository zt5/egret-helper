import { getLogger, Logger } from "./Logger";

export default class WebpackStrConfig {
    private logger: Logger;
    constructor() {
        this.logger = getLogger(this);
    }
    public replace(str: string) {
        let buildCmdStartIndex = str.search(/command\s*\=\=\s*['|"]build['|"]\s*\)\s*/g)//匹配build命令
        if (buildCmdStartIndex == -1) {
            this.logger.log("find command == 'build' error");
            return str;
        }
        let buildCmdEndIndex = -1;
        let leftBraceNums = 0;
        let rightBraceNums = 0;
        for (let i = buildCmdStartIndex; i < str.length; i++) {
            if (str.charAt(buildCmdStartIndex) == "{") {
                leftBraceNums++;
            } else if (str.charAt(buildCmdStartIndex) == "}") {
                rightBraceNums++;
            } else if (leftBraceNums != 0 && leftBraceNums == rightBraceNums) {
                buildCmdEndIndex = i;
                break;
            }
        }
        if (buildCmdEndIndex == -1) {
            this.logger.log("find command == 'build' brace error");
            return str;
        }
        let cutStr = str.slice(buildCmdStartIndex, buildCmdEndIndex + 1);

        return str;
    }
}