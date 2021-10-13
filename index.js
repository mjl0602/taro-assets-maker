#!/usr/bin/env node

let fs = require('fs');
const join = require("path").join;
const os = require('os');
let tempStr = `
// import here
export default abstract class Assets {
// export here
}`

let isWindows = false;

// 主函数

async function main(args) {
  // console.log("args", args);
  isWindows = os.type() == 'Windows_NT';
  if (args[2] == "init") {
    console.log("初始化Taro项目结构\n");
    await initTaro();
    console.log("\nTaro项目结构初始化完成 试试：tmaker build\n");
    return;
  } else if (args[2] == "build") {
    console.log("创建taro资源\n");
    await makeTaro();
    console.log("\ntaro资源全部创建完成\n");
    return;
  }
  console.log("没有对应指令,tmaker已安装");
  console.log("要开始使用tmaker，请使用tmaker init");
  console.log(args[2]);
}

main(process.argv);

async function initTaro() {
  let cmdPath = process.cwd();
  let assetDicPath = `${cmdPath}/src/assets`;
  let targetFilePath = `${cmdPath}/src/assets.ts`;
  if (!fs.existsSync(assetDicPath)) {
    fs.mkdirSync(assetDicPath, {
      recursive: true
    });
    fs.copyFileSync(join(__dirname, 'template/example.png'), `${assetDicPath}/example.png`)
    console.log("已初始化图片文件夹并添加示例图");
  } else {
    console.log("assets文件夹已存在，无需创建");
  }
  if (!fs.existsSync(targetFilePath)) {
    fs.writeFileSync(targetFilePath, '');
    console.log("已创建静态引用文件(空)");
  } else {
    console.log("静态引用文件文件夹已存在，无需创建");
  }
  // 处理.gitignore
  console.log('\n尝试添加 .gitignore')
  if (!fs.existsSync(`${cmdPath}/.gitignore`)) {
    // fs.writeFileSync(`${cmdPath}/.gitignore`, '');
    console.log("没有发现.gitignore文件，建议创建.gitignore文件");
    return;
  }
  let gitignore = fs.readFileSync(`${cmdPath}/.gitignore`, {
    encoding: 'utf-8'
  });
  if (gitignore.indexOf('\nsrc/assets.ts\n') == -1) {
    gitignore = gitignore + '\n\n# ignore generated assets file\nsrc/assets.ts\n'
    fs.writeFileSync(`${cmdPath}/.gitignore`, gitignore);
    console.log('.gitignore 添加完成')
  } else {
    console.log('无需添加.gitignore')
  }
}

async function makeTaro() {
  let cmdPath = process.cwd();
  let assetDicPath = `${cmdPath}/src/assets`;
  let targetFilePath = `${cmdPath}/src/assets.ts`;
  if (isWindows) {
    assetDicPath = assetDicPath.replace(/\//g, '\\');
    targetFilePath = targetFilePath.replace(/\//g, '\\');
  }

  let files = find(assetDicPath);

  let nameList = files.map((filePath) => {
    return filePath.substring(
      filePath.lastIndexOf(isWindows ? '\\' : '/') + 1,
      filePath.length
    );
  });
  console.log(`分析${nameList.length}个资源...`);
  let importStr = '';
  let exportStr = '';
  // .png
  for (const oldName of nameList) {
    if (oldName.indexOf('.') == 0) continue;
    if (oldName.indexOf('.') < 0) continue;
    let dumpName = toHump(oldName.replace(/(\.png)|(\.jpg)|(\.jpeg)/g, '').replace(/\W/g, ' '));
    importStr += `import ${dumpName} from './assets/${oldName}';\n`
    if (isWindows) {
      exportStr += `  /** ![](${assetDicPath}\\${oldName}) */\n` + `  static ${dumpName} = ${dumpName};\n`
    } else {
      exportStr += `  /** ![](${assetDicPath}/${oldName}) */\n` + `  static ${dumpName} = ${dumpName};\n`
    }
  }
  let content = tempStr;
  fs.writeFileSync(
    targetFilePath,
    content
    .replace('// import here', importStr)
    .replace('// export here', exportStr),
  );
}

// 下划线转换驼峰
function toHump(name) {
  return name.replace(/[\_\-\+:\(\)\[\] ](\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
}
// 查找目录下文件
function find(startPath) {
  let result = [];
  fs.mkdirSync(startPath, {
    recursive: true,
  });

  function finder(path) {
    let files = fs.readdirSync(path);
    files.forEach((val, index) => {
      let fPath = join(path, val);
      let stats = fs.statSync(fPath);
      if (stats.isDirectory()) result.push(fPath);
      if (stats.isFile()) result.push(fPath);
    });
  }
  finder(startPath);
  return result;
}