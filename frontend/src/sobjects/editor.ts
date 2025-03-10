import { ObjectSyncClient, SObject } from "objectsync-client"
import { ComponentManager } from "../component/component"
import { EventDispatcher as EventDispatcher } from "../component/eventDispatcher"
import { HtmlItem } from "../component/htmlItem"
import { MouseOverDetector } from "../component/mouseOverDetector"
import { Transform } from "../component/transform"
import { CompSObject } from "./compSObject"
import { Linker } from "../component/linker"
import { Port } from "./port"
import { print } from "../devUtils"
import { AddNodeMenu } from "../ui_utils/addNodeMenu"
import { Vector2 } from "../utils"
import { Node } from "./node"
import { Workspace } from "./workspace"
import { Edge } from "./edge"

export class Editor extends CompSObject{
    readonly template: string = `
    <div style="width:100%;height:100%; position:relative;">
        <div class="viewport" id="Viewport" style="width:100%;height:100%;top:0;left:0;">
            <div style="position:absolute;top:50%;left:50%">
                
                <div id="slot_default" class="editor" style="position:absolute;top:50%;left:50%;width:1px;height:1px;">
                <svg class="bg" id="bg"
                    
                    <defs>
                        <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="var(--z2)" stroke-width="0.5" />
                        </pattern>
                        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                            <rect width="80" height="80" fill="url(#smallGrid)" />
                            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--z2)"stroke-width="1" />
                        </pattern>
                    </defs>

                    <defs>
                        <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
                            <circle cx="5" cy="5" r="1" fill="var(--z2)" />
                        </pattern>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#dots)" />
                    
                </svg>
                </div>
            </div>
            
        </div>

        <div id="box_selection" class="box-selection" style="position:absolute;width:0px;height:0px; display:none;"></div>
    </div>
    `;

    componentManager = new ComponentManager();
    linker = new Linker(this);
    eventDispatcher: EventDispatcher;
    htmlItem: HtmlItem;
    transform: Transform;
    mouseOverDetector: MouseOverDetector;
    
    constructor(objectsync: ObjectSyncClient, id: string){
        super(objectsync,id);
        this.htmlItem = new HtmlItem(this, document.body.getElementsByClassName('main')[0] as HTMLElement);
        this.htmlItem.applyTemplate(this.template);
        let viewport = this.htmlItem.getHtmlEl('Viewport')
        let editor = this.htmlItem.getHtmlEl('slot_default')
        
        this.transform = new Transform(this,editor);

        this.eventDispatcher = new EventDispatcher(this, viewport);
        this.linker.link(this.eventDispatcher.onMoveGlobal,this.mouseMove)
        this.mouseOverDetector = new MouseOverDetector(this, viewport);
        
        this.transform.scale = 1
        this.transform.maxScale = 8
        this.transform.minScale = 0.4
        this.transform.draggable = true;
        this.transform.scrollable = true;

        this.link(this.eventDispatcher.onDragStart,this.onDragStart)
        this.link(this.eventDispatcher.onDrag,this.onDrag)
        this.link(this.eventDispatcher.onDragEnd,this.onDragEnd)

    }

    protected onStart(): void {
        
        new AddNodeMenu(this)
    }

    private lastUpdatePortNearMouse = 0
    private mouseMove(e: MouseEvent){
        // If there's performance issues, maybe optimize this
        let now = Date.now()
        if(now - this.lastUpdatePortNearMouse <500) return;
        this.lastUpdatePortNearMouse = now;
        for(let port of this.TopDownSearch(Port)){
            let dist = port.htmlItem.position.distanceTo(this.eventDispatcher.mousePos)
            if(dist < 200){
                port.htmlItem.baseElement.classList.add('port-near-mouse-1')
                port.htmlItem.baseElement.classList.remove('port-near-mouse-2')
            }else if (dist < 400){
                port.htmlItem.baseElement.classList.add('port-near-mouse-2')
                port.htmlItem.baseElement.classList.remove('port-near-mouse-1')
            }
            else{
                port.htmlItem.baseElement.classList.remove('port-near-mouse-1')
                port.htmlItem.baseElement.classList.remove('port-near-mouse-2')
            }
        }
    }
    
    public createEdge(tailId: string, headId: string): void{
        this.makeRequest('create_edge',{tail_id:tailId,head_id:headId})
    }

    public createNode(type: string,args:any={}): void{
        args.node_type = type
        this.makeRequest('create_node',args)
    }

    private boxSelectionStart: Vector2;
    private boxSelectionStartClient: Vector2;

    private onDragStart(e: MouseEvent, mousePos: Vector2){
        if(e.ctrlKey){
            e.stopPropagation()
            this.transform.draggable = false;
            this.boxSelectionStart = this.transform.WroldToEl(mousePos,this.htmlItem.baseElement as HTMLElement,false)
            this.boxSelectionStartClient = mousePos
            this.htmlItem.getHtmlEl('box_selection').style.display = 'block'
        }
    }

    private onDrag(e: MouseEvent, mousePos: Vector2, prevMousePos: Vector2){
        if(!this.boxSelectionStart) return;
        mousePos = this.transform.WroldToEl(mousePos,this.htmlItem.baseElement as HTMLElement,false)
        let boxSelection = new Vector2(mousePos.x-this.boxSelectionStart.x,mousePos.y-this.boxSelectionStart.y)
        let boxSelectionSize = new Vector2(Math.abs(boxSelection.x),Math.abs(boxSelection.y))
        let boxSelectionPos = new Vector2(Math.min(this.boxSelectionStart.x,mousePos.x),Math.min(this.boxSelectionStart.y,mousePos.y))
        this.htmlItem.getHtmlEl('box_selection').style.width = boxSelectionSize.x+'px'
        this.htmlItem.getHtmlEl('box_selection').style.height = boxSelectionSize.y+'px'
        this.htmlItem.getHtmlEl('box_selection').style.left = boxSelectionPos.x+'px'
        this.htmlItem.getHtmlEl('box_selection').style.top = boxSelectionPos.y+'px'
    }

    private onDragEnd(e: MouseEvent, mousePos: Vector2){
        if(!this.boxSelectionStart) return;
        this.htmlItem.getHtmlEl('box_selection').style.display = 'none'
        this.transform.draggable = true;
        let boxSelectionEnd = mousePos
        let boxSelectionStart = this.boxSelectionStartClient

        const match = (node:SObject)=>{
            if(!(node instanceof Node)) return false;
            let nodebox = node.htmlItem.baseElement.getBoundingClientRect()
            return Math.min(boxSelectionStart.x,boxSelectionEnd.x) < nodebox.right &&
            Math.max(boxSelectionStart.x,boxSelectionEnd.x) > nodebox.left &&
            Math.min(boxSelectionStart.y,boxSelectionEnd.y) < nodebox.bottom &&
            Math.max(boxSelectionStart.y,boxSelectionEnd.y) > nodebox.top
        }
        const nodes = this.TopDownSearch(Node,match,match)

        const matchEdge = (edge:SObject)=>{
            if(!(edge instanceof Edge)) return false;
            let edgebox = edge.path.getBoundingClientRect()
            return Math.min(boxSelectionStart.x,boxSelectionEnd.x) < edgebox.right &&
            Math.max(boxSelectionStart.x,boxSelectionEnd.x) > edgebox.left &&
            Math.min(boxSelectionStart.y,boxSelectionEnd.y) < edgebox.bottom &&
            Math.max(boxSelectionStart.y,boxSelectionEnd.y) > edgebox.top
        }
        const edges = this.TopDownSearch(Edge,matchEdge,matchEdge)

        Workspace.instance.selection.clearSelection()
        Workspace.instance.functionalSelection.clearSelection()
        for(let node of nodes){
            node.selectable.select()
            node.functionalSelectable.select()
        }
        for(let edge of edges){
            edge.selectable.select()
            edge.functionalSelectable.select()
        }

        this.boxSelectionStart = null;
    }

}