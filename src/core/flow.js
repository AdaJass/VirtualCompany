"use strict";
/**
 * This file implements the flow class
 * In real situation, if one node have more than one next node, it could choose the path to the next node
 * and another node will never be activated. This situation inspire that,  node should not be initialized 
 * until we comfirm it is the next node to be activated. So an active related condition should bind to a node,
 * once a node meet the active condition, initilize it. And if the next node meed the start condition, it will 
 * invoke autoRun function.  
 * Basicly rule:
 *  1. an in_line node started  depends on previous node.
 *  2. child nodes will start automaticaly if its father node started
 * @author jass.ada@qq.com
 */

require('../config/constant');
const evil = require('../evil');
const {Task, RepeatTask} = require('./task');
const {Condition} = require('./condition');
const { promises } = require('stream');
const { assert } = require('console');

/**
 * A flow node is defined as serveral tasks that share the same start condition and end condition.
 * @param {object} company pointer to company
 * @param node_desc node description json format, may load from database, 
 * @param previou_node pointer to previou node if exist, else pls. pass null
 * @param parrentNode pointer to previou node if exist, else pls. pass null
 */
class Node{
    constructor(company, node_desc, previou_node, parrentNode){     
        this.company = company;
        this.id = node_desc.id;
        this.nodeName = node_desc.nodeName;
        this.status = NODE_STATUS_PENDING;  //status includes ['waiting','doing','done']         
        if(!this.fromPointers) this.fromPointers = [];
        if(previou_node && parrentNode){
            throw new Error('Node initializetion error, one node can only be a child or the next one.');
        }         
        let from_pointer=null;     
        if(previou_node){
            if(!(previou_node instanceof Node)){
                throw new Error('previou_node pointer type error');
            }   
            from_pointer = previou_node.nextNodes; 
            this.fromPointers.push(previou_node); 
        }
        if(parrentNode){
            if(!(parrentNode instanceof Node)){
                throw new Error('parrentNode pointer type error');
            }
            from_pointer = parrentNode.childNodes;  
            this.fromPointers.push(parrentNode);          
        }
        this.flowExtract(node_desc, from_pointer);        
    }
}

/**
 * convert the flow description by json into Flow operable.
 * suppose input show as example
 * @param {object} node_desc json format flow description 
 * @param {Array} from father or previous node's pointer.
 * @return {object} return the pointer to childNodes/nextNodes
 * @example the example below cant descript on 2D plane.
  {
   id:'flow id', 
   activeCondition:{

   },
   startCondition: {
       ors:['x=9'],
       ands:[]
   }
   approver:    //accounts
   responser:   //account, if the node_type is FUNCTION_NODE, then this account will be a role in the company.
   handler:     //account
   node_type:   //
   variable:{// user define variables, user operable/viewable variables

   } ,
   desc: 'a string descript current node.'
   nodeName: '',
   outputs: {
       type: file,
       url: '',
       receiver:'receiver account',
   },
   userTask: {  //descript the user task in detail, a node can only have one user task.
        taskType:  //user input type
        permission:  //permission accounts
        bindExpression:
        bindFunction:
        funcitonPara:
        inputs:{}
   }, 
   tasks: {  //automated task
       

   },
   repeatTask: {
        interval: 1000,  //millisecond
        tasks: [{
            taskId:12,
            status:0,

        }]
        
   },   
   endCondition: {
       ors:[],
       ands:[1]
   },
   from_pointers: [{}], //
   nextNodes: [{}], //
   childNodes: [{},{}], //
   nextNodeIds:[],
   childNodeIds:[]
  }
*/
Node.prototype.flowExtract = function(node_desc, from){ 
    this.nodeType = node_desc.nodeType||TASK_NODE;
    this.handlers = node_desc.handlers;
    this.responsers = node_desc.responsers||this.handlers;   
    this.approvers = node_desc.approvers||this.handlers;          
    this.startCondition = new Condition(node_desc.startCondition);
    this.variable = node_desc.variable;  
    this.handlerTask = node_desc.handlerTask;
    let tem_task;
    if(node_desc.task){
        tem_task = node_desc.task;
        this.task = new Task(tem_task);  
    }
    if(node_desc.repeatTask){
        tem_task = node_desc.repeatTask;
        this.repeatTask = new RepeatTask(tem_task.interval, tem_task.taskName, tem_task.taskArgs, tem_task.condition);  
    }    
    this.desc = node_desc.desc; 
    this.endCondition = new Condition(node_desc.endCondition);
    this.output = null; 
    if(from && Array.isArray(from)){
        let ifhas = from.filter(n=>n.id==this.id);
        if(ifhas.length===0)  from.push(this);
    }
    this.nextNodes = [];
    this.childNodes = [];
    this.nextNodeIds = node_desc.nextNodeIds||[];
    this.childNodeIds = node_desc.childNodeIds||[];
}


/**
 * judge whether this node has child by input id
 * @param {string} id 
 * @returns true or false
 */
 Node.prototype.hasChildById = function(id){
    return Boolean(this.childNodes.filter(nod=>nod.id==id).length>0 );
}
/**
 * judge whether this node has next by input id
 * @param {string} id 
 * @returns true or false
 */
 Node.prototype.hasNextById = function(id){
    return Boolean(this.nextNodes.filter(nod=>nod.id==id).length>0 );
}

/**
 * judge whether this node will has no next
 * @return true if has, false no
 */
Node.prototype.ifHasNext = async function(){
    if(this.nextNodes.length>0) return true;

    let next_descs = this.nextNodeIds.map(nod=>await Node.fetchNodeDesc(nod));
    await Promise.all(next_descs);
    for(let next_desc of next_descs){
        if(new Condition(next_desc.activeCondition).value(this)){
            return true;
        }
    }
    return false;    
}

/**
 * check the node status, if it is done, set the status.
 * A node status done include self task being done and its child nodes task all being done
*/
Node.prototype.checkNodeStatus = function(){    
    if(this.status == NODE_STATUS_RUNNING){
        if( (!this.task || this.task.status == TASK_DONE) &&
            (!this.repeatTask || this.repeatTask.status == TASK_DONE) &&
            (!this.handlerTask || this.handlerTask.status == TASK_DONE) ){  
                if(this.checkChildStatusDone() ){
                    this.endCondition.add_and(1);
                    if(this.endCondition.value(this)){
                        this.status = NODE_STATUS_DONE;
                    }
                }            
                
            }
    }
    return this.status;
}

/**
 * check whether all the child nodes done.
 * @algorithm
 * ```
 * to judge each child nodes flow line is done
 * for all flow line in child, do:
 *      if a node status is done and has no next then this flow line is done.
 *      else whole child status is not done.
 *      
 * ```
 * @returns ture for done, false for not
 */
Node.prototype.checkChildStatusDone = function(){
    if(this.childNodes.length==0) return true;

    const check_next_inline_node_done = (nod)=>{
        if(!nod.ifHasNext()) { 
            if(nod.status == NODE_STATUS_DONE)    return true;
            else  return false;
        }else{
            if(nod.status != NODE_STATUS_DONE) return false;
            else{
                //if hasNext but not initialize, seldom case.
                if(nod.nextNodes.length == 0) return false;

                for(let no of nod.nextNodes){
                    return check_next_inline_node_done(no);
                }
            }            
        } 
    }

    //autoRun function has the promise that before this funciton invoked, the child should all be initialized.
    for(let nod of this.childNodes){
        if(check_next_inline_node_done(nod) == false){
            return false;
        }
    }
    return true;   
}

/**
 * 
 */ 
Node.prototype.autoRun = async function(invoke_node){
    if(this.status == NODE_STATUS_WAITING){
        this.status = NODE_STATUS_PENDING;
    }
    // if(invoke_node){
    //     if(!invoke_node.hasChildById(this.id) && !invoke_node.hasNextById(this.id) ){
    //         throw new Error('node invoke error, coz invoke node is not previous or parrent.');
    // }
    let ifstart = this.startCondition.value(this);
    
    if(this.handlerTask)

    if(ifstart && this.status != NODE_STATUS_DONE){
        //run current node task
        this.status = NODE_STATUS_RUNNING;
        if(this.task && this.task.status!=TASK_DONE){
            this.task.autoRun(this);
        }

        if(this.repeatTask && this.repeatTask.status!=TASK_DONE){
            this.repeatTask.autoRun(this);
        }       

        //initialize child nodes and run
        let child_parallel = this.childNodeIds.map(async id=>{
            if(!this.hasChildById(id)){
                let node_desc = await Node.fetchNodeDesc(id);
                if(new Condition(node_desc.activeCondition).value(this)){
                    this.childNodes.push(new Node(this.company, node_desc, null, this));
                }                
            }
        });

        await Promise.all(child_parallel);  

        this.childNodes.forEach(nod=>{
            nod.autoRun(this);
        });     
    }

    if(this.checkNodeStatus() == NODE_STATUS_DONE){
        let parallel = this.nextNodeIds.map(async id=>{
            if(!this.hasNextById(id)){
                let node_desc = await Node.fetchNodeDesc(id);
                if(new Condition(node_desc.activeCondition).value(this)){
                    this.nextNodes.push(new Node(this.company, node_desc, null, this));
                }                
            }
        });

        await Promise.all(parallel);
        this.nextNodes.forEach(nod=>{
            nod.autoRun(this);
        });
            
    }
}

/**
 * fetch node_desc by id from database
 * @param {string} id target node id.
 */
Node.fetchNodeDesc = async function(id){
    return {};
}

/**
 * find node by id
 * @param {string} id linking target node id.
 * @return {object} pointer to the node
 */
Node.prototype.findNode = function(id){
    // this.company.flows
}

// var no = new Node({
//     startConditions: ['x=9'],
//     variable: 'x',
//     desc: 'a string descript current node0.',
//     outputs: '',
//     task: '', //the only task for this node, etc. the function to be invoked by this node.
//     endCondition: [1],   
//     previou_nodes: [{}], //
//     nextNodes: [{}], //
//     childNodes: [{},{}], //
//     parentNodes: [{},{}], //
// });

// var no2 = new Node({
//     startCondition: ['x=9'],
//     variable: 'x',
//     desc: 'a string descript current node2.',
//     outputs: '',
//     task: '', //the only task for this node, etc. the function to be invoked by this node.
//     endCondition: [1],   
//     previou_nodes: [{}], //
//     nextNodes: [{}], //
//     childNodes: [{},{}], //
//     parentNodes: [{},{}], //
// }, no);

// new Node({
//     startCondition: ['x=9'],
//     variable: 'x',
//     desc: 'a string descript current node2.',
//     outputs: '',
//     task: '', //the only task for this node, etc. the function to be invoked by this node.
//     endCondition: [1],   
//     previou_nodes: [{}], //
//     nextNodes: [{}], //
//     childNodes: [{},{}], //
//     parentNodes: [{},{}], //
// },null, no2);

// console.log(Node.Flow[0].nextNodes[0].autoRun());

module.exports = {   Node  };