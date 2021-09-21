import { getLogger, Logger } from "../../common/Logger";
import Progress from '../../common/Progress';
import { EgretCompileType } from "../../define";
import EgretDebugServer from "../EgretDebugServer";
let myIconv: any;
export default abstract class EgretDebugServerImpl {
    protected _compileType: EgretCompileType | undefined;
    protected progress: Progress;
    protected _urlStr: string | undefined;
    protected logger: Logger;
    constructor(protected host: EgretDebugServer, compileType: EgretCompileType) {
        this._compileType = compileType;
        this.logger = getLogger(this);
        this.progress = new Progress();
    }
    //执行过程
    public abstract exec(folderString: string): Promise<void>;
    //清理方法
    public async clear() {
        await this.progress.clear()
    }
    //服务器地址
    public get urlStr() {
        return this._urlStr;
    }
    protected binaryToGBK(str: string) {
        //放在顶部 发布时会报错 不知道为什么
        if (!myIconv) myIconv = require("iconv-lite");
        return myIconv.decode(Buffer.from(str, 'binary'), "gbk");
    }
    protected binaryToUTF8(str: string) {
        //放在顶部 发布时会报错 不知道为什么
        if (!myIconv) myIconv = require("iconv-lite");
        return myIconv.decode(Buffer.from(str, 'binary'), "utf-8");
    }
    //类型
    public get compileType() {
        return this._compileType;
    }
}