const { exec } = require("child_process");
const evil = require(".");

let op = ['x==5','z>8','y>5'];

const fun = ()=>{
    let x=5,y=7;
    op.forEach(exp=>{
        try{
            if(eval(exp)==true){
                console.log(exp+' is true');
            }
        }catch(e){}        
    })    
}

// fun();

class A{
    constructor(){
        this.a=9;
    }
    show(p,x){
        p=99;
        console.log(arguments[0])
        console.log(this['a']);
    }
}

// k=new A();
// k.show(0)

arg = function(a,b,c){
    console.log(arguments);
    let args = [...arguments];
    args.shift();
    console.log(args);
    // console.log(a,' ',b,' ',c);
}

obj = {
    b:9,
    a:'a',
    c:-1,
    ex:{
        s:9,
        ss:99,
        exp:'s+ss'
    }
};



// arg(8,'ss')
// (function(){
//     let exp = 'ss2+s **s4s+999.0';
//     exp=exp.trim();
//     ele = exp.split(/[\+\-\*\/=><\!]{1,2}/)
//     ele=ele.map(e=>{
//         if(e.match(/^\d+.?\d*$/)){
//             return e;
//         }
//         return 'this.'+e.trim()
//     });
//     oper = exp.match(/[\+\-\*\/=]{1,2}/g)
//     let rexp='';  
//     let first,second;  
//     if(!exp.startsWith(oper[0])){
//         first = ele;
//         second = oper;
//     }else{
//         first=oper;
//         second=ele;
//     }
//     let t1,t2;
//     while(first.length>=1||second.length>=1){
//         t1 = first.shift()||'';
//         t2 = second.shift()||'';
//         rexp = rexp + t1+t2;
//     }
//     // exp = evil.call(obj.ex, exp);
//     console.log('rexp  ', rexp);
// })();

class C{
    f(){
        console.log('hhh');
    }
}

class D extends C{
    constructor(){
        super();
    }
    f(){
        C.prototype.f.call(this);
        console.log('DDD');
    }
}

let b=new D();
b.f();