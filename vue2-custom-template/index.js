const fse = require("fs-extra");
const glob = require("glob");
const ejs = require('ejs');
const inquirer = require("inquirer");

function ejsRender({
    ignore,
    options
}) {
    const dir = options.targetPath;
    return new Promise((resolve, reject) => {
        glob("**", {
            cwd: dir,
            ignore: ignore || "",
            nodir: true
        }, (err, files) => {
            if (err) {
                reject(err);
            }
            Promise.all(files.map(file => {
                const filePath = path.join(dir, file);
                return new Promise((resolve1, reject1) => {
                    ejs.renderFile(filePath, options.projectInfo, {}, (err, result) => {
                        if (err) {
                            reject1(err);
                        } else {
                            //  重新写入模板渲染后文件
                            fse.writeFileSync(filePath, result);
                            resolve1(result);
                        }
                    })
                })
            })).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            })
        })
    })
}

async function index(options) {
    try {
        const {
            sourcePath,
            targetPath,
            templateInfo
        } = options;
        fse.ensureDirSync(sourcePath);
        fse.ensureDirSync(targetPath);
        fse.copySync(sourcePath, targetPath);
        /** 自定义模板描述信息添加*/
        let descriptionPrompt = (await inquirer.prompt({
            type: "input",
            name: "description",
            message: `请输入项目描述信息: `,
            validate: function (v) {
                const done = this.async();
                setTimeout(() => {
                    if (!v) {
                        done("请输入描述信息")
                        return;
                    }
                    done(null, true);
                }, 0)
            }
        }));
        if (descriptionPrompt) {
            options.projectInfo.description = descriptionPrompt.description;
        }
        //  1.1 拷贝同时使用 ejs 进行模板渲染&重新生成项目模板
        const templateIgnore = templateInfo.ignore || [];
        const ignore = ['**/node_Modules/**', ...templateIgnore];
        await ejsRender({
            options,
            ignore
        });
    } catch (e) {
        throw e;
    }

}

module.exports = index