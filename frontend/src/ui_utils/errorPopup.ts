import { Componentable } from "../component/componentable"
import { Transform } from "../component/transform"
import { Node } from "../sobjects/node"
import { Vector2 } from "../utils"

export class ErrorPopup extends Componentable{
    protected get template(): string {
        return `
            <div class="error-popup">
                <div class="message"></div>
                <svg width="20px" height="20px" style="position: absolute; bottom: -20px; left: -20px;">
                    <line x1="20" y1="0" x2="0" y2="20" />
                </svg>
            </div>
        `
    }
    protected get style():string{
        return `
            .error-popup{
                color: var(--error);
                font-size: 10px;
                font-family: 'consolas';
                position: absolute;
                flex-direction: column;
                justify-content: center;
                z-index: 1000;
                border-radius: 2px;
                border: 1px solid black;
                padding: 2px;
                stroke: var(--error);
                stroke-width:2;
            }
            .message{
                max-width: 400px;
                max-height: 200px;
                overflow-y: auto;
                padding: 5px;
                overflow-wrap: break-word;
            }
        `
    }
    node: Node
    baseDiv: HTMLDivElement
    messageDiv: HTMLDivElement
    transform: Transform

    constructor(node:Node,title:string='',message: string='') {
        super()
        this.node = node
        this.baseDiv = this.htmlItem.baseElement as HTMLDivElement
        this.messageDiv = this.htmlItem.getElByClass("message")
        this.transform = new Transform(this)

        this.set(title,message)
        this.hide()

        this.link(this.node.moved,this.onMoved)


        this.baseDiv.addEventListener("mousedown",(e)=>{
            this.hide()
            e.stopPropagation()
        })

        this.transform.pivot = new Vector2(0.,1)
        this.baseDiv.addEventListener("wheel",(e)=>{
            //if scrollable, stop propagation
            if(this.messageDiv.scrollHeight > this.messageDiv.clientHeight){
                e.stopPropagation()
            }
        })
    }

    set(title:string,message: string){
        message = message.replace(/\n/g,"<br>").replace(/ /g,"&nbsp;")
        this.messageDiv.innerHTML = message
    }

    show(){
        this.baseDiv.style.display = "block"
        this.onMoved()
    }

    hide(){
        this.baseDiv.style.display = "none"
    }

    onMoved(){
        if(this.baseDiv.style.display == "none") return
        this.transform.translation = this.node.transform.translation.add(
            new Vector2(this.node.transform.localSize.x/2+20,-20)
            )
    }
}