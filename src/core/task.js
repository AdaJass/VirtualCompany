"use strict";
/**
 * This file implements the Task class
 * After deep consideration, we decide that task can have serveral operations. Initially, we think a task can
 * only invoke one function, but we finally decide to abolish this limitation. 
 * We DEFINE: 
 *  1. A node is holding a bulk of tasks that start and end with the same condition.
 *  2. Task will be seperated into user task, automated handle task , repeat user task,
 *      repeat automated  task. A repeat task means it will bind with time and repeatly do
 *  3. A task have parallel run min-task and serial run min-task.
 *  4. user task waiting for user input.
 *  5. user task can only bind one expression and one automated function.
 *  5. Automated task includes SendMail, SendMassage, RequestExternal, BasicArithmetic
 * @author jass.ada@qq.com
 */
require('../config/constant');
const CatchPromise = require('../utils/CatchPromise');
const got = require('got');
const evil = require('../evil');

/**
 * @param {object} task as example
 * @example
 {
    id: 
    status: 0,
    serialTask: [{
        name: 'requestExternal',
        args: []  // they are all the name of the user variable.
    }],
    parallelTask: [],
       
 }
 */
 class Task {
    constructor(task){        
        for(let ts in task){
            this[ts] = task[ts];
        }
    }  
    async autoRun(envir){
        this.nodePointer = envir;
        if(this.status==TASK_PENDING)  this.status = TASK_WAITING;
        if(this.status==TASK_WAITING || this.status == TASK_RUNNING){
            this.status = TASK_RUNNING;

            //run simultaneous task.
            let simultaneous = this.parallelTask.map(async ts=>{
                if(ts.name=='evalExpression'){
                    return this.evalExpression(ts);
                }else if(['sendMassage','sendMail','requestExternal'].includes(ts.name)){
                    let arg={};
                    ts.args.map(it=>arg[it]=envir.variable[it]);
                    return await CatchPromise.iferrthrow(this[ts.name](arg));
                }else{
                    return this[ts.name](...ts.args);
                }                
            })
            await CatchPromise.iferrthrow(Promise.all(simultaneous));
            

            //run serial task
            for(let ts of this.serialTask){
                if(ts.name=='evalExpression'){
                    this.evalExpression(ts);
                    continue;                    
                }else if(['sendMassage','sendMail','requestExternal'].includes(ts.name)){
                    let arg={};
                    ts.args.map(it=>arg[it]=envir.variable[it]);
                    await CatchPromise.iferrthrow(this[ts.name](arg));                    
                }else{
                    this[ts.name](...ts.args);
                }
                
            }
        }  
        this.status=TASK_DONE;
    }    
    
    //send platform msg
    async sendMassage(){

    }

    async sendMail(){
        
    }

    async requestExternal(op){
        got.post(op.url,{
            json: op,
            responseType: 'json'
        }).then(e=>e).catch(e=>{throw new Error(e)});        
    }

    /**
     * set node variable of the autoRun invoke node.
     * @param {object} obj key-value pair
     */
    setNodeVariable(obj){
        if(!this.nodePointer){
            throw new Error('no nodePointer before set variable');
        }
        Object.assign(this.nodePointer.variable, obj);
    }

    /**
     * set company variable.
     * @param {object} obj key-value pair
     */
     setNodeVariable(obj){
        if(!this.nodePointer){
            throw new Error('no nodePointer before set variable');
        }
        Object.assign(this.nodePointer.company.variable, obj);
    }

    /**
     * calculate an expression all compose of node virable. the expression must like this format:
     * `this.a + this.b + (this.x - this.y) * this.a`
     * @param {object} ts min-task description {name:'', 'args':[]}
     */
    evalExpression(ts){
        for(let ex of ts.args){
            let exp = Task.AddThis(this.nodePointer.variable[ex]);            
            this.nodePointer.variable[ex] = evil.call(this.nodePointer.variable, exp);
        }
    }

}

class RepeatTask extends Task {
    constructor(task){
        super(task);
    }
}

/**
 * UserTask will waiting for user input. input include submit a form, approve an application
 * user input can bind to a predefine function or an arithmetic expression, while the input
 * occur, the binding will automaticly invoke.  
 * A node can only have one user task,  but it could receive more than one input by
 * properly set the end condition of the node.
 * @example
 userTask: {  //descript the user task in detail, 
    taskType:  //user input type
    permission:  //permission accounts
    bindExpression: //each time while user has an input, the binding will be executed.
    bindFunction:   //each time while user has an input, the binding will be executed.
    funcitonPara:
}
 */
class UserTask extends Task {
    constructor(task){
        super(task);
    }

    async autoRun(envir){
        await Task.prototype.autoRun.call(this, envir);
        this.status=TASK_RUNNING;
    }

    /**
     * receive input data and then invoke bindFunciton
     * @param {*} data 
     */
    async receiveInput(data){
        if(data){
            if(!this.inputs) this.inputs = {};
            Object.assign(this.inputs, data);
        }
        if(this.bindExpression){
            this.evalExpression(this.bindExpression);
        }
        if(this.bindFunciton){
            if(['sendMassage','sendMail','requestExternal'].includes(this.bindFunciton)){
                let arg={};
                this.funcitonPara.map(it=>arg[it]=this.nodePointer.variable[it]);
                await CatchPromise.iferrthrow(this[this.bindFunciton](arg));                    
            }else{
                this[this.bindFunciton](...this.bindFunciton);
            }
        }
    }
}

module.exports={Task, UserTask, RepeatTask};
