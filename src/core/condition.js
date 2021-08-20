"use strict";
/**
 * This file implements the Task class
 * @author jass.ada@qq.com
 */
require('../config/constant');
const evil = require('../evil');

/**
 * Generally, condition often deal with user input related variable.
 */
class Condition{
    constructor(ors, ands){
        this.ors=[];
        this.ands=[];
        if(arguments.length==1 && (arguments[0].ors||arguments[0].ands)){
            if(arguments[0].ors) ors = arguments[0].ors;
            if(arguments[0].ands) ands = arguments[0].ands;
        }
        if(Array.isArray(ors)){
            if(ors.every(Condition.validator)) this.ors=ors;   
            else console.error("ors parameter initialization error");         
        }
        if(Array.isArray(ands)){
            if(ands.every(Condition.validator)) this.ands=ands; 
            else console.error("ands parameter initialization error");    
        }
    }

    add_or(expr){
        if(!Condition.validator(expr)){
            console.log('add or condition format error');
            return;
        }
        this.ors.push(expr)
    }

    add_and(expr){
        if(!Condition.validator(expr)){
            console.log('add and condition format error');
            return;
        }
        this.ands.push(expr)
    }
    
    /**
     * calculate the condition result
     * @param {object} envir environment that this function executed.
     * @return true or false
     */
    value(envir){
       if(this.__ors_value(envir) || this.__ands_value(envir)) return true;
       return false;
    }

    __ors_value(envir){
        for(let or of this.ors){            
            if(typeof or =='string'){
                if(evil.call(envir, or)){
                    return true;
                }
            }else{
                if(or) return true;
                continue;
            }
        }
        return false;
    }

    __ands_value(envir){
        for(let and of this.ands){            
            if(typeof and =='string'){
                if(!evil.call(envir, and)){
                    return false;
                }
            }else{
                if(!and)  return false;
                continue;
            }
        }
        if(this.ands.length==0) return false;
        return true;
    }
    /**
     * validate the condition expresion
    */
    static validator(exp){
        return true;
    }
}

module.exports = {Condition};