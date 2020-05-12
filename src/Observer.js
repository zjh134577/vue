// 作为依赖的订阅器，同时回调告诉视图更新
class Watcher{
    constructor(vm,expr,cb) {
        this.vm = vm 
        this.expr = expr      
        this.cb = cb
        this.oldVal = this.getOldVal()
    }
    getOldVal(){
        Dep.target = this
        const oldVal = compileUtil.getVal(this.expr, this.vm)
        Dep.target = null
        return oldVal
    }
    upDate(){
        const newVal = compileUtil.getVal(this.expr, this.vm)
        this.cb(newVal)
    }
}



class Dep{
    constructor(){
        this.subs = []
    }
    // 添加依赖
    addSub(watcher){
        this.subs.push(watcher)
    }
    // 通知watcher更新视图
    notify(){
        this.subs.forEach(w => w.upDate())
    }
}


class Observer{
    constructor(data){
        // 监听data数据所有属性
        this.observe(data)
    }
    // 定义监听函数
    observe(data){
        if(data && typeof data === 'object'){
            Object.keys(data).forEach(key => {
                this.defineReactive(data,key,data[key])
            })
        }
    }
    defineReactive(obj,key,value){
        this.observe(value)
        const dep = new Dep()
        Object.defineProperty(obj,key,{
            enumerable:true,
            configurable:false,
            get(){
                // 渲染数据时收集依赖
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set:(newVal)=>{
                // 设置数据时监听新数据
                this.observe(newVal)
                if(newVal !== value){
                    value = newVal
                    dep.notify()
                }
            }
        })
    }
}