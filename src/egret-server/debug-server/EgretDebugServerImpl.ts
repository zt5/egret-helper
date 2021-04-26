import { getLogger, Logger } from "../../common/Logger";
import Progress from '../../common/Progress';
import { EgretCompileType } from "../../define";
import EgretDebugHost from "../EgretDebugHost";
export default abstract class EgretDebugServerImpl {
    public CompileType: EgretCompileType | undefined;
    public progress: Progress;
    protected _urlStr: string | undefined;
    protected logger: Logger;
    constructor(protected host: EgretDebugHost) {
        this.logger = getLogger(this);
        this.progress = new Progress();
    }
    //执行过程
    public abstract exec(folderString: string): Promise<void>;
    //修改配置
    public async changeConfig() { };
    //清理方法
    public async clear() {
        await this.progress.clear()
    }
    //服务器地址
    public get urlStr() {
        return this._urlStr;
    }
}