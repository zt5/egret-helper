import * as child from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as querystring from 'querystring';
import { getLogger, Logger } from '../common/Logger';
import { LauncherError, LauncherErrorCode } from './launcherDefines';
import { openExternal } from './launcherHelper';

interface Promgram {
    InstallLocation: string;
}

async function searchWindowsProgram(name: string): Promise<Promgram> {
    let reg64: string = '\\SOFTWARE\\Wow6432Node';
    let reg32: string = '\\SOFTWARE';
    reg64 += '\\' + name;
    reg32 += '\\' + name;

    let result = await searchWindowsProgramRaw('HKLM' + reg64);
    if (!result) {
        result = await searchWindowsProgramRaw('HKLM' + reg32);
    }
    return result;
}

function searchWindowsProgramRaw(regKey: string): Promise<Promgram> {
    return new Promise<any>((c, e) => {
        try {
            child.exec(`reg query ${regKey} /s`, (error, stdout, stderr) => {
                if (error) {
                    return c(null);
                }
                if (stderr) {
                    return c(null);
                }

                const result: { [key: string]: string } = {};
                stdout.toString().split('\n').forEach(line => {
                    const p = line.trim().split(/\s{2,}/g, 3);
                    if (p.length === 3) {
                        result[p[0]] = p[2];
                    }
                });
                if (Object.keys(result).length > 0) {
                    c(result);
                } else {
                    c(null);
                }
            });
        } catch (error) {
            c(null);
        }
    });
}

function getAppDataPath(platform: string): string {
    switch (platform) {
        case 'win32': return process.env['APPDATA'] || path.join(`${process.env['USERPROFILE']}`, 'AppData', 'Roaming');
        case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support');
        case 'linux': return process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config');
        default: throw new Error('Platform not supported');
    }
}

export default class Launcher {
    private static readonly LauncherWinRegKey = '0a64b195-6a01-532b-9902-30ea12027020';
    private static readonly PublishProjectPath: string = 'publishProject';
    private static readonly CreateProjectPath: string = 'createProject';

    private static logger:Logger=getLogger("Launcher");
    /**
     * 延迟指定时长
     * @param milliseconds 延迟时间，毫秒
     */
    private static delayAsync(milliseconds: number): Promise<void> {
        return new Promise<void>((resolve) => {
            let timer = setTimeout(() => {
                clearTimeout(timer);
                resolve(void 0);
            }, milliseconds);
        });
    }

    /**
     * 检查文件是否存在。
     * @param filePath
     */
    private static fileExistsAsync(filePath: string): Promise<boolean> {
        if (!filePath) {
            return Promise.resolve(false);
        }
        return new Promise<boolean>((resolve) => {
            fs.exists(filePath, (exist) => {
                resolve(exist);
            });
        });
    }

    /**
     * 读取指定的json文件
     * @param filePath
     */
    private static async readJsonAsync(filePath: string) {
        if (!filePath) {
            return Promise.resolve(null);
        }
        return new Promise<any>((resolve) => {
            fs.readFile(filePath, 'utf-8', (error: NodeJS.ErrnoException | null, data: string) => {
                if (error) {
                    resolve(null);
                } else {
                    try {
                        let json = JSON.parse(data);
                        resolve(json);
                    } catch (parseError) {
                        resolve(null);
                    }
                }
            });
        });
    }

    private static async getEgretLauncherOnWindows(): Promise<{ location: string; exe: string; } | null> {
        let possiblePaths: { location: string; exe: string; }[] = [];
        if (process.platform === 'win32') {
            let location: string = '';
            let result = await searchWindowsProgram(Launcher.LauncherWinRegKey);
            if (result && result.InstallLocation) {
                location = result.InstallLocation;
                possiblePaths.push({ location: location, exe: path.join(location, 'EgretLauncher.exe') });
            }
            location = path.join(`${process.env['ProgramFiles(x86)']}`, 'Egret', 'EgretLauncher');
            possiblePaths.push({ location: location, exe: path.join(location, 'EgretLauncher.exe') });
            location = path.join(`${process.env['ProgramFiles']}`, 'Egret', 'EgretLauncher');
            possiblePaths.push({ location: location, exe: path.join(location, 'EgretLauncher.exe') });
        }
        for (let i = 0; i < possiblePaths.length; i++) {
            let item = possiblePaths[i];
            let exist = await Launcher.fileExistsAsync(item.exe);
            if (exist) {
                return item;
            }
        }
        return null;
    }

    /**
     * 查找egret launcher可执行文件
     */
    private static async findEgretLauncherAsync(): Promise<string | null> {
        if (process.platform === 'darwin') {
            let file = '/Applications/EgretLauncher.app/Contents/MacOS/EgretLauncher';
            let exist = await Launcher.fileExistsAsync(file);
            if (exist) {
                return file;
            }
        } else {
            let target = await this.getEgretLauncherOnWindows();
            if (target) {
                return target.exe;
            }
        }
        return null;
    }

    /**
     * 启动egret launcher
     */
    private static async launchAsync(): Promise<boolean> {
        let launcherPath = await Launcher.findEgretLauncherAsync();
        if (launcherPath) {
            let processEnv = { ...process.env };
            delete processEnv.ATOM_SHELL_INTERNAL_RUN_AS_NODE;
            delete processEnv.ELECTRON_RUN_AS_NODE;
            child.spawn(launcherPath, [], { env: processEnv, detached: true });
            return true;
        } else {
            return openExternal('egret://');
        }
    }

    /**
     * 获取launcher服务的端口号
     */
    private static async getLauncherHttpPortAsync(): Promise<number> {
        let settingsPath = path.join(getAppDataPath(process.platform), '/EgretLauncher/User/settings.json');
        let jsonObj = await Launcher.readJsonAsync(settingsPath);
        if (jsonObj) {
            return jsonObj.port;
        }
        return 80;
    }

    private static async httpGetAsync(urlPath: string, args: {}): Promise<string> {
        let port = await Launcher.getLauncherHttpPortAsync();
        let result = '';
        let requestPath = '';
        if (urlPath) {
            requestPath = `/${urlPath}`;
        }
        if (args) {
            requestPath += '?' + querystring.stringify(args);
        }
        let options: http.RequestOptions = {
            host: 'localhost',
            method: 'GET',
            port: port,
            path: requestPath
        };

        return new Promise<string>((resolve, reject) => {
            let req = http.request(options, (response) => {
                response.on('data', function (chunk) {
                    result += chunk;
                });
                response.on('error', (error) => {
                    reject(error);
                });
                response.on('end', function () {
                    resolve(result);
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            req.end();
        });
    }

    /**
     * 向egret launcher发起请求
     * @param urlPath
     * @param args
     */
    private static async requestAsync(urlPath: string, args: {}): Promise<string> {
        let result: string | null = null;
        let retryCount: number = 5;
        while (retryCount > 0) {
            retryCount--;
            try {
                result = await Launcher.httpGetAsync(urlPath, args);
                break;
            } catch (error) {
                Launcher.logger.devlog('launcher request: ', error);
                if (retryCount > 0) {
                    let launched = await Launcher.launchAsync();
                    if (!launched) {
                        break;
                    }
                    await Launcher.delayAsync(2000);
                }
            }
        }
        if (result === null) {
            return Promise.reject(new LauncherError(LauncherErrorCode.NotFound, 'Cannot find Egret Launcher.'));
        }
        return result;
    }

    /**
     * 打开项目发布设置
     * @param projectFolder 项目文件夹
     * @returns true: 成功发布，false: 取消发布
     */
    public static async publishProject(projectFolder: string): Promise<boolean> {
        let result = await Launcher.requestAsync(Launcher.PublishProjectPath, {
            projectpath: projectFolder
        });
        if (result === 'true') {
            return true;
        }
        return false;
    }

    /**
     * 创建项目
     * @returns 项目路径
     */
    public static createProject(): Promise<string> {
        return Launcher.requestAsync(Launcher.CreateProjectPath, {});
    }
}
