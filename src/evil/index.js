
module.exports =function(expr){    
    try{
        if(!expr.match(/this\./)){
            expr = add_this(expr);
        }
        return eval(expr);            
    }catch(e){} 
    return;       
}

/**
 * add this to the arithmetic expression
 * @param {string}} exp initial expression
 * @returns string expression with all variable prefix with this
 */    
var add_this = function (exp){
    exp=exp.trim();
    ele = exp.split(/[\+\-\*\/=><\!]{1,2}/)
    ele=ele.map(e=>{
        if(e.match(/^\d+.?\d*$/)){
            return e;
        }
        return 'this.'+e.trim();
    });
    oper = exp.match(/[\+\-\*\/=]{1,2}/g)
    let rexp='';  
    let first,second;  
    if(!exp.startsWith(oper[0])){
        first = ele;
        second = oper;
    }else{
        first=oper;
        second=ele;
    }
    let t1,t2;
    while(first.length>=1||second.length>=1){
        t1 = first.shift()||'';
        t2 = second.shift()||'';
        rexp = rexp + t1+t2;
    }
    return rexp;
}