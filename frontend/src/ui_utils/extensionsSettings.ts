import { DictTopic, ObjectSyncClient } from "objectsync-client"
import { Linker } from "../component/linker"
import { Componentable } from "../component/componentable"
import { SimplePopupMenu } from "./simplePopupMenu"
import { stringToElement } from "../utils"

export class ExtensionsSetting extends Componentable{
    objectsync: ObjectSyncClient
    importedExtensionsTopic: DictTopic<string,any>
    avaliableExtensionsTopic: DictTopic<string,any>
    notInstalledExtensionsTopic: DictTopic<string,any>
    importedDiv = document.getElementById('imported-extensions')
    avaliableDiv = document.getElementById('avaliable-extensions')
    notInstalledDiv = document.getElementById('not-installed-extensions')
    cardTemplate = `
    <div class="card">
        <div class="card-image"></div>
        <div class="card-content">
            <div class="card-title"></div>
            
        </div>
    </div>
    `

    removeButtonTemplate = '<button class="card-button" style="color:#ff5555;" title="remove">—</button>'
    importButtonTemplate = '<button class="card-button" style="color:#44dd44;" title="import">+</button>'
    installButtonTemplate = '<button class="card-button" style="color:#44dd44;" title="install">⇩</button>'
    reloadButtonTemplate = '<button class="card-button" style="color:#5599ff;" title="reload">↻</button>'


    cards: {imported:{[name:string]:HTMLElement},avaliable:{[name:string]:HTMLElement},not_installed:{[name:string]:HTMLElement}} = {
        imported:{},
        avaliable:{},
        not_installed:{}
    }
    constructor(objectsync:ObjectSyncClient){
        super()

        this.objectsync = objectsync

        this.importedExtensionsTopic = this.objectsync.getTopic('imported_extensions',DictTopic<string,any>)
        this.linker.link(this.importedExtensionsTopic.onAdd,(name,newExtension)=>{
            this.addCard(newExtension,'imported')
        })
        this.linker.link(this.importedExtensionsTopic.onPop,(name,oldExtension)=>{
            this.cards.imported[name].remove()
        })
        
        this.avaliableExtensionsTopic = this.objectsync.getTopic('avaliable_extensions',DictTopic<string,any>)
        this.linker.link(this.avaliableExtensionsTopic.onAdd,(name,newExtension)=>{
            this.addCard(newExtension,'avaliable')
        })
        this.linker.link(this.avaliableExtensionsTopic.onPop,(name,oldExtension)=>{
            this.cards.avaliable[name].remove()
        })

        this.notInstalledExtensionsTopic = this.objectsync.getTopic('not_installed_extensions',DictTopic<string,any>)
        this.linker.link(this.notInstalledExtensionsTopic.onAdd,(name,newExtension)=>{
            this.addCard(newExtension,'not_installed')
        })
        this.linker.link(this.notInstalledExtensionsTopic.onPop,(name,oldExtension)=>{
            this.cards.not_installed[name].remove()
        })

        document.getElementById('refresh-extensions').addEventListener('click',()=>{
            this.objectsync.emit('refresh_extensions')
        })
    }

    addCard(newExtension: any, status: 'imported' | 'avaliable' | 'not_installed'){
        let card: HTMLElement = document.createElement('div')
        card.innerHTML = this.cardTemplate
        card = card.firstElementChild as HTMLElement
        card.querySelector<HTMLDivElement>('.card-title').innerText = newExtension.name
        //card.querySelector<HTMLDivElement>('.card-image').style.backgroundImage = `url(${newExtension.icon})`
        card.querySelector<HTMLDivElement>('.card-image').style.backgroundImage = `url(https://imgur.com/xwG2FSr.jpg)`

        const cardContent = card.querySelector<HTMLDivElement>('.card-content')
        if(status == 'imported'){
            this.addButtonToCard(card,this.removeButtonTemplate,()=>{
                this.objectsync.emit('unimport_extension',{extension_name:newExtension.name})
            })
            this.addButtonToCard(card,this.reloadButtonTemplate,()=>{
                this.objectsync.emit('update_extension',{extension_name:newExtension.name})
            })
        }

        if(status == 'avaliable'){
            this.addButtonToCard(card,this.importButtonTemplate,()=>{
                this.objectsync.emit('import_extension',{extension_name:newExtension.name})
            })
        }

        if(status == 'not_installed'){
            this.addButtonToCard(card,this.installButtonTemplate,()=>{
                this.objectsync.emit('install_extension',{extension_name:newExtension.name})
            })
        }

        card.addEventListener('contextmenu',(e)=>{
            e.preventDefault()
            e.stopPropagation()
            let popup = SimplePopupMenu.instance
            popup.open(e.clientX,e.clientY)
            if(status == 'imported'){
                popup.addOption('Reload',()=>{
                    this.objectsync.emit('update_extension',{extension_name:newExtension.name})
                })
                popup.addOption('Remove from workspace',()=>{
                    this.objectsync.emit('unimport_extension',{extension_name:newExtension.name})
                })
            }else{
                popup.addOption('Import to workspace',()=>{
                    this.objectsync.emit('import_extension',{extension_name:newExtension.name})
                })
            }
        })

        this.cards[status][newExtension.name] = card
        if(status == 'imported'){
            this.importedDiv.appendChild(card)
            this.sortCards(this.importedDiv)
        }else if(status == 'avaliable'){
            this.avaliableDiv.appendChild(card)
            this.sortCards(this.avaliableDiv)
        }else if(status == 'not_installed'){
            this.notInstalledDiv.appendChild(card)
            this.sortCards(this.avaliableDiv)
        }
    }

    addButtonToCard(card:HTMLElement,buttonTemplate:string,onClick:()=>void){
        let button = stringToElement(buttonTemplate)
        button.addEventListener('click',onClick)
        card.querySelector<HTMLDivElement>('.card-content').appendChild(button)
    }

    sortCards(div:HTMLElement){
        let cards = Array.from(div.querySelectorAll('.card'))
        cards.sort((a,b)=>{
            let aTitle = a.querySelector<HTMLDivElement>('.card-title').innerText
            let bTitle = b.querySelector<HTMLDivElement>('.card-title').innerText
            //always put builtin nodes at the top
            if(aTitle.startsWith('grapycal_builtin')) return -1
            return aTitle.localeCompare(bTitle)
        })
        cards.forEach(card=>div.appendChild(card))
    }
}