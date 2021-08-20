"use strict";
/**
 * @link https://www.omg.org/spec/BPMN/2.0/PDF 
 * This file implements the conpany class. 
 * @argument `The virtual company implement by class
 * is intuitional, but it may obviously unrealistic. One company may have thousands of 
 * flows, thousands of accounts. The instance will cost too much memery, further, we could 
 * have millions of companies. Practically, we should initiate a flow only when it is activated.
 * But this implement will be complicated in the other hand, need more discuss
 * @author jass.ada@qq.com
 */

require('../config/constant');
const evil = require('../evil');
const {Node} = require('./flow');

class Company{
    constructor(flow_des){
        this.childNodes = [];
        this.node_count = 0;
        this.variable = {};
        this.structure = {};
        flow_des.forEach(des=>{
            this.childNodes.push(new Node(this, des));
        })        
    }

    /**
     * extract organize leader structure from company business flow.
     * for special case, one can locate in more than one dept, and high level
     * leader can have direct underling but they are not leader in company.
     * extract result show as example
     * @example
        this.structure = {
            nodeName: '',
            responsers: [{
                id: '',
                name:'',                
            },{},...],
            users:[],
            subs: [{
                responsers: []
                accounts:[{}],
                subs:[{}]
            },{},....],
        }
     */
    extractStucture(curNode, curStruct){
        if(curNode.nodeType == FUNCTION_NODE){
            if(!curStruct.responsers) curStruct.responsers=curNode.responser;
            if(curNode.childNodes.length>0){
                if(!curStruct.subs) curStruct.subs=[];
                curStruct.subs.push(curNode.responser);
            }
        }
    } 
}

module.exports = {Company};