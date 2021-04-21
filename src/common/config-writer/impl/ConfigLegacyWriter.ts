import * as jju from "jju";
import Helper from "../../Helper";
import ConfigWriterImpl from "../ConfigWriterImpl";

export default class ConfigLegacyWriter extends ConfigWriterImpl {
    public async changeExt() {
        //检查tsconfig的sourceMap是否存在 不存在就设置
        const jsobjParam: jju.ParseOptions & jju.StringifyOptions = { reserved_keys: 'replace', quote: '"', quote_keys: true }
        let ts_config_path = Helper.getTSConfigPath();
        this.logger.devlog("changeTSConfig ts_config_path=", ts_config_path)
        let ts_config_str = await Helper.readFile(ts_config_path);

        let jsObj = jju.parse(ts_config_str, jsobjParam)

        this.logger.devlog(jsObj)
        if (!jsObj.compilerOptions || !jsObj.compilerOptions.sourceMap) {
            this.logger.devlog("changeTSConfig modify sourceMap=true")
            if (!jsObj.compilerOptions) jsObj.compilerOptions = {};
            jsObj.compilerOptions.sourceMap = true;
            let output = jju.update(ts_config_str, jsObj, jsobjParam)
            Helper.writeFile(ts_config_path, output);
        }
    }
}