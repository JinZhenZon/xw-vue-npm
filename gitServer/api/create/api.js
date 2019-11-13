
const fsTool = require("../fs/fsapi");
const resEntity = require("../responseEntity");
const path = require("path");
const business = require("./business.js");
const commonUtil = require("./common.js");
const createRouter = require("./createRouter.js");
const createApi = require("./createApi.js");
const createService = require("./createService.js");
const {createListView,createSaveView} = require("./createView.js");
const {createStore,createStoreModule} = require("./createStore.js");
const api = {
    // 创建模块
    createModuleFolder:(req,res)=>{
        let moduleName = req.body.moduleName;
        let projectPath = req.body.projectPath;
        let isExist = fsTool.exists(projectPath + "/src/pages/" + moduleName);
        if(!isExist){
            fsTool.createFolder(projectPath + "/src/pages/" + moduleName);
            return resEntity.setEneity({res:res});
        }else{
            return resEntity.setEneity({
                res,
                status:1,
                msg:"该模块已经存在",
                data:null,
            });
        }
    },
    // 创建router和store的index等项目级文件
    createGlobalFile(req,res){
        let projectPath = req.body.projectPath;
        let globalPath = path.resolve(__dirname,"../../global.json")
        let str = fsTool.readFile(globalPath);
        let _data = JSON.parse((str && str!="") ? str : "{router:[],moduleList:[]}");
        // 创建router
        createRouter(projectPath,_data.router);
        // 创建store的index
        createStore(projectPath,_data.moduleList);
        fsTool.writeFile(globalPath,"");
        return resEntity.setEneity({res:res});
    },
    // 创建页面级文件
    createModuleFile:(req,res)=>{
        let moduleName = req.body.moduleName;
        let projectPath = req.body.projectPath;
        let _data = business.dealJsonData(fsTool.readFile(path.resolve(__dirname,"../../data.json")));
        // let data = req.body.data;
        console.log(_data);
        _data.pageOption.forEach(item => {
            console.log(item.type);
            if(item.type == "1"){
                createListView(projectPath,moduleName,item);
            }else{
                createSaveView(projectPath,moduleName,item);
            }
        })
        createStoreModule(projectPath,moduleName,_data.storeData);
        createService(projectPath,moduleName,_data.APIData);
        createApi(projectPath,moduleName,_data.APIData);
        let jsonDataPath = path.resolve(__dirname,"../../global.json");
        let dataPath = path.resolve(__dirname,"../../data.json");
        let jsonStr = fsTool.readFile(jsonDataPath);
        let jsonData = JSON.parse(jsonStr!= "" ? jsonStr : "{}");
        let _json = {
            router:jsonData.router ? jsonData.router : [],
            moduleList:jsonData.moduleList ? jsonData.moduleList : [],
        }
        _json.router = commonUtil.concatArr(_json.router,_data.routerData);
        _json.moduleList = commonUtil.concatArr(_json.moduleList,_data.storeModuleNameList);
        fsTool.writeFile(jsonDataPath,JSON.stringify(_json,null,"\t"));       
        fsTool.writeFile(dataPath,"");
        return resEntity.setEneity({res:res});
    },
    // 获取项目目录
    getProjectsPath:(req,res)=>{
        return resEntity.setEneity({res:res,data:fsTool.getProjectsPath()});
    },
    // 保存页面
    savePage:(req,res) => { 
        let _data = req.body;
        let jsonDataPath = path.resolve(__dirname,"../../data.json");
        
        let _dataJson = {
            "subName":_data.moduleName,
            "pagePath":_data.page.path,
            "pageName":_data.page.fileName + ".vue",
            "pageOption":_data.page,
            "pageType":_data.page.type,
            "compName":business.getCompName(_data.page.path,_data.page.fileName),
            "routerData":{
                "routerName":_data.moduleName + commonUtil.titleCase(_data.page.fileName),
                "routerPath":_data.moduleName + "/" + _data.page.path + "/" + _data.page.fileName,
            },
            "serverData":{
                "store":{
                    "state":{
                        "dataSource":[],
                        "entity":[]
                    },
                    "action":[],
                    "mutation":[]
                },
                "API":[],
            }
        }
        if(_dataJson.pageType == "1"){
            _data.page.searchOpts.search.cols && _data.page.searchOpts.search.cols.map(item => {
                // 有datasource就必须要有url否则不添加
                if(item.dataSource && item.dataSource != ""  && item.url && item.url != "") {
                    _dataJson.serverData.store.state.dataSource.push(item.dataSource)
                    _dataJson.serverData.store.action.push("get" + commonUtil.titleCase(item.dataSource))
                    _dataJson.serverData.store.mutation.push("set" + commonUtil.titleCase(item.dataSource));
                    _dataJson.serverData.API.push({
                        url:item.url,
                        compName: business.getCompName(item.url.split(".")[0]),
                        servicesName : "get" + commonUtil.titleCase(item.dataSource)
                    });
                }
            })
            if(business.isHasDialog(_data.page.dialog.hasDialog)){
                _data.page.dialog.form.cols && _data.page.dialog.form.cols.map(item => {
                    if(item.dataSource && item.dataSource != ""  && item.url && item.url != "") {
                        _dataJson.serverData.store.state.dataSource.push(item.dataSource)
                        _dataJson.serverData.store.action.push("get" + commonUtil.titleCase(item.dataSource))
                        _dataJson.serverData.store.mutation.push("set" + commonUtil.titleCase(item.dataSource));
                        _dataJson.serverData.API.push({
                            url:item.url,
                            compName:business.getCompName(item.url.split(".")[0]),
                            servicesName : "get" + commonUtil.titleCase(item.dataSource)
                        });
                        _dataJson.serverData.store.state.entity.push(item.key);
                    }
                })
            }
        }
        if(_dataJson.pageType == "2"){
            _data.page.form.cols && _data.page.form.cols.map(item => {
                if(item.dataSource && item.dataSource != ""  && item.url && item.url != "") {
                    _dataJson.serverData.store.state.dataSource.push(item.dataSource)
                    _dataJson.serverData.store.action.push("get" + commonUtil.titleCase(item.dataSource))
                    _dataJson.serverData.store.mutation.push("set" + commonUtil.titleCase(item.dataSource));
                    _dataJson.serverData.API.push({
                        url:item.url,
                        compName:business.getCompName(item.url.split(".")[0]),
                        servicesName : "get" + commonUtil.titleCase(item.dataSource)
                    });
                    _dataJson.serverData.store.state.entity.push(item.key);
                }
            })
            _dataJson.serverData.API.push({
                url:_data.page.savePageInterface.save,
                compName:business.getCompName(_data.page.savePageInterface.save.split(".")[0]),
                servicesName:"doCreate",
            })
            _dataJson.serverData.API.push({
                url:_data.page.savePageInterface.detail,
                compName:business.getCompName(_data.page.savePageInterface.detail.split(".")[0]),
                servicesName:"getInfo",
            })
            _dataJson.serverData.API.push({
                url:_data.page.savePageInterface.update,
                compName:business.getCompName(_data.page.savePageInterface.update.split(".")[0]),
                servicesName:"doUpdate",
            })
        }
        let jsonStr = fsTool.readFile(jsonDataPath);
        let jsonData = JSON.parse(jsonStr!= "" ? jsonStr : "[]");
        if(commonUtil.isExistItem(jsonData,_dataJson,"compName")){
            return resEntity.setEneity({
                res,
                status:1,
                msg:"该页面已经存在",
                data:null,
            });
        }
        jsonData.push(_dataJson)
        fsTool.writeFile(jsonDataPath,JSON.stringify(jsonData,null,"\t"));
        return resEntity.setEneity({res:res});
    }
}

module.exports = api;