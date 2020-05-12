// 入口函数
class MVue {
    constructor(options) {
        // 保存需要用到的属性
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            // 实现一个数据劫持类
            new Observer(this.$data)
            // 实现一个指令解析类
            new Compile(this.$el, this)
        
            this.proxydata(this.$data)
        }
    }
    proxydata(data){
        Object.keys(data).forEach(key => {
            Object.defineProperty(this,key,{
                get(){
                    return data[key]
                },
                set(val){
                    data[key] = val
                }
            })
        })
    }
}
// 处理指令属性：v-text v-html ...
const compileUtil = {
    // 获取表达式对应数据的值
    getVal(expr, vm) {
        return expr.split('.').reduce((data, currentVal) => {
            return data[currentVal]
        }, vm.$data)
    },
    setVal(expr, vm,inputVal){
        expr.split('.').reduce((data, currentVal) => {
            if(typeof data[currentVal] === 'object'){
                return data[currentVal]
            }else{
                data[currentVal] = inputVal
            }
             
        }, vm.$data)
    },
    getContentVal(expr,vm){
        return  expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(args[1], vm);
        })
    },
    text(node, expr, vm) {
        let value;
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                new Watcher(vm,args[1],newVal=>{
                    this.updater.textUpdater(node, this.getContentVal(expr,vm))
                })
                return this.getVal(args[1], vm);
            })
        } else {
            new Watcher(vm,expr,newVal=>{
                this.updater.textUpdater(node, newVal)
            })
            value = this.getVal(expr, vm)
        }
        this.updater.textUpdater(node, value)
    },
    html(node, expr, vm) {
        new Watcher(vm,expr,newVal=>{
            this.updater.htmlUpdater(node, newVal)
        })
        const value = this.getVal(expr, vm)
        this.updater.htmlUpdater(node, value)
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm)

        new Watcher(vm,expr,newVal=>{
            this.updater.modelUpdater(node, newVal)
        })
        node.addEventListener('input',e =>{
            this.setVal(expr,vm,e.target.value)
        })
        this.updater.modelUpdater(node, value)
    },
    on(node, expr, vm, eventName) {
        let fn = vm.$options.methods && vm.$options.methods[expr]
        node.addEventListener(eventName,fn.bind(vm),false)
    },
    // 指令更新函数
    updater: {
        textUpdater(node, value) {
            node.textContent = value
        },
        htmlUpdater(node, value) {
            node.innerHTML = value
        },
        modelUpdater(node, value) {
            node.value = value
        }
    }
}

class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm
        // 1.创建一个文档碎片对象，将页面元素追加进去
        // console.log(this.el)
        const fragment = this.nodeFragment(this.el)
        // 2.编译模板
        this.compile(fragment)
        // 3.将模板插入页面中渲染
        this.el.appendChild(fragment)
    }
    // 解析 fragment 遍历每一个节点
    compile(fragment) {
        const childNodes = fragment.childNodes
        Array.from(childNodes).forEach(child => {
            if (this.isElementNode(child)) {
                this.compileElement(child)
            } else {
                this.compileText(child)
            }
            if (child.childNodes && child.childNodes.length) {
                this.compile(child)
            }
        });
    }
    // 编译元素节点
    compileElement(node) {
        const attributes = node.attributes
        Array.from(attributes).forEach(attr => {
            const { name, value } = attr
            if (this.isDirectives(name)) {
                const [, directive] = name.split('-')
                const [dirName, eventName] = directive.split(':')
                compileUtil[dirName](node, value, this.vm, eventName)
                // 渲染前移除v-指令
                node.removeAttribute('v-' + directive)
            }else if(this.isEventName(name)){
                let [,eventName] = name.split('@')
                compileUtil['on'](node, value, this.vm, eventName)
                node.removeAttribute('@' + eventName )
            }
        })
    }
    // 编译文本节点
    compileText(node) {
        const content = node.textContent
        if (/\{\{(.+?)\}\}/.test(content)) {
            compileUtil['text'](node, content, this.vm)
        }
    }
    isElementNode(node) {
        return node.nodeType === 1
    }
    isEventName(attrName){
        return attrName.startsWith('@')
    }
    isDirectives(attrName) {
        return attrName.startsWith('v-')
    }
    nodeFragment(node) {

        const f = document.createDocumentFragment()
        let firstChild;
        while (firstChild = node.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }
}


















/*
<h2>{{ person.name }} -- {{ person.age }}</h2>
<h3>{{ person.fav }}</h3>
<ul>
    <li>1</li>
    <li>2</li>
    <li>3</li>
</ul>
<h3>{{ msg }}</h3>
<div v-text="msg"></div>
<div v-html="htmlstr"></div>
<input type="text" v-modle="msg"></input>
*/