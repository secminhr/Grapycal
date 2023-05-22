import { ObjectSyncClient, StringTopic } from "objectsync-client"
import { Node } from "../node"
import { Null, expose } from "../../devUtils"
import { print } from "objectsync-client/src/devUtils"

export class TextInputNode extends Node{
    protected readonly templates: {[key: string]: string} = {
    block: 
    `<div class="Node BlockNode flex-horiz space-between">
        <div id="slot_input_port" class="no-width flex-vert space-evenly"></div>
        <div class="NodeContent full-width flex-horiz space-evenly">
            <div id="label" class="center" >
            </div><input id="input" type="text" style="width:100px; height:100%; font-size: 24px; text-align: center; border: none; outline: none; background: none; color: white;"/>
                
        </div>
        <div id="slot_output_port" class="no-width flex-vert space-evenly"></div>
    </div>`
    }
    text: StringTopic = Null()
    inputField: HTMLInputElement = Null()

    constructor(objectsync: ObjectSyncClient, id: string) {
        super(objectsync, id)
        this.text = this.getAttribute('text', StringTopic)
        this.link(this.text.onSet, (text)=>{this.inputField.value = text})
    }

    reshape(shape: string): void {
        if(this.inputField != Null()){
            this.unlink2(this.inputField,'input')
        }
        expose('h',this.htmlItem)
        super.reshape(shape)
        this.inputField = this.htmlItem.getEl('input',HTMLInputElement)
        this.link2(this.inputField,'input', ()=>this.text.set(this.inputField.value))
    }
}