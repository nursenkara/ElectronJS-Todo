const electron = require("electron")
const path = require("path")
const url = require("url")
const db = require("./lib/connection").db;

const { app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow,addWindow;

app.on("ready", () => {
    //Pencerenin Oluşturulması
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          }
    });

    mainWindow.setResizable(false);
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname,"pages/mainWindow.html"),
            protocol:"file",
            slashes:true
        })
    )
    //Menünün Oluşturulması
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    //New Todo Penceresi Eventleri
    ipcMain.on("newTodo:close", () =>{
        addWindow.close();
        addWindow = null;

    });
    ipcMain.on("todo:close", () =>{
     app.quit();
     addWindow = null;

    });
    ipcMain.on("newTodo:save",(err,data) => {
        if(data){
           
            db.query("INSERT INTO todos SET text = ?",data.todoValue,(e,r,f) => {
                //console.log(r);
            if(r.insertId > 0)
            {
                mainWindow.webContents.send("todo:addItem",{
                    id: r.insertId,
                    text: data.todoValue
                });
            }
            })


            //mainWindow.webContents.send("todo:addItem",todo);
            //console.log(todoList);
            if(data.ref == "new")
            {
            addWindow.close();
            addWindow = null;
            }
        }
    });

    mainWindow.webContents.once("dom-ready",() => {
        db.query("SELECT * FROM todos",(error,results,fields) => {
            //console.log(results);
            mainWindow.webContents.send("initApp",results)
        })
    });

    ipcMain.on("remove:todo", (e,id) => {
            //console.log("Silinmek istenen id: "+ id);
            db.query("DELETE FROM todos WHERE id = ?", id, (e,r,f) => {
                if(r.affectedRows > 0) {
                    console.log("silme işlemi başarılıdır...");
                }
            })
            })

})
//Menü Template Yapısı

const mainMenuTemplate = [
{
    label: "Dosya",
    submenu: [
        {
            label: "Yeni TODO Ekle",
            click(){
                createWindow();
            }
        },
        {
            label:"Tümünü Sil"
        },
        {
            label:"Çıkış",
            accelerator: process.platform == "darwin" ? "Command+Q":"Ctrl+Q",
            role:"quit"
        }
    ]
}
]

if(process.env.NODE_ENV !== "production"){
    mainMenuTemplate.push({
        label: "Geliştirici Araçları",
        submenu:[
            {
                label: "Geliştirici Araçları",
                click(item,focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                label:"Yenile",
                role:"reload"
            }
        ]
    });
}
function createWindow(){
    addWindow = new BrowserWindow({
        width: 500,
        height:230,
        title:"Yeni Bir Pencere",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          }
    });
    addWindow.setResizable(false);

    addWindow.loadURL(url.format({
        pathname:path.join(__dirname,"pages/newTodo.html"),
        protocol:"file",
        slashes: true
    }));
    addWindow.on("close",() => {
        addWindow = null;
    })
}
