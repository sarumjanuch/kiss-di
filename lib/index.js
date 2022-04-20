"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = exports.ClassWrapper = void 0;
function topologicalSortHelper(node, visited, temp, graph, result) {
    temp[node.name] = true;
    let neighbors = node.inject;
    if (!graph[node.name]) {
        throw new Error('Unknown Dependency: ' + node.name);
    }
    for (let i = 0; i < neighbors.length; i += 1) {
        let n = graph[neighbors[i]];
        if (!n) {
            throw new Error(`Unknown Dependency: ${neighbors[i]} for ${node.name}`);
        }
        if (temp[n.name]) {
            throw new Error('Circular Dependency Detected: ' +
                Object.keys(temp)
                    .filter((item) => {
                    return temp[item];
                })
                    .join(' <- '));
        }
        if (!visited[n.name]) {
            topologicalSortHelper(n, visited, temp, graph, result);
        }
    }
    temp[node.name] = false;
    visited[node.name] = true;
    result.push(node);
}
function topologyBuilder(graph) {
    const result = [];
    const visited = {};
    const temp = {};
    for (let node in graph) {
        if (!visited[graph[node].name] && !temp[graph[node].name]) {
            topologicalSortHelper(graph[node], visited, temp, graph, result);
        }
    }
    return result;
}
function randomId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
var INSTANCES_TYPES;
(function (INSTANCES_TYPES) {
    INSTANCES_TYPES[INSTANCES_TYPES["SERVICE"] = 0] = "SERVICE";
    INSTANCES_TYPES[INSTANCES_TYPES["CONTROLLER"] = 1] = "CONTROLLER";
})(INSTANCES_TYPES || (INSTANCES_TYPES = {}));
class ClassWrapper {
    constructor(name, fn, type) {
        if (!name || !fn) {
            if (!name) {
                throw new Error('Missing Argument fn');
            }
            if (!fn) {
                throw new Error(`Missing Argument fn for name ${name}`);
            }
        }
        this.name = name;
        this.fn = fn;
        this.inject = fn.inject || [];
        this.type = type;
    }
    createInstance(deps) {
        // @ts-ignore
        return new this.fn(...deps);
    }
}
exports.ClassWrapper = ClassWrapper;
class Container {
    constructor() {
        this.instances = new Map();
        this.registry = new Map();
        this.topology = [];
    }
    getInstance(name) {
        if (!this.instances.has(name))
            throw new Error(`Instance for ${name} does not exist in DI container`);
        return this.instances.get(name);
    }
    setInstance(name, instance) {
        if (this.instances.has(name))
            throw new Error(`Container with name ${name} already exist in DI container`);
        this.instances.set(name, instance);
    }
    setConstructor(name, fn, type) {
        if (this.registry.has(name))
            throw new Error(`Constructor with name ${name} already exist in DI container`);
        this.registry.set(name, new ClassWrapper(name, fn, type));
    }
    getConstructor(name) {
        if (!this.registry.has(name))
            throw new Error(`Constructor with name ${name} does not exist in DI container`);
        return this.registry.get(name);
    }
    registerService(name, fn) {
        this.setConstructor(name, fn, INSTANCES_TYPES.SERVICE);
    }
    registerController(fn) {
        this.setConstructor(randomId(8) + '-controller', fn, INSTANCES_TYPES.CONTROLLER);
    }
    buildTopology() {
        //Map to Object Literal;
        this.topology = topologyBuilder([...this.registry.entries()].reduce(
        // @ts-ignore
        (obj, [key, value]) => ((obj[key] = value), obj), {}));
        return this.topology;
    }
    initializeTopology() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const container of this.topology) {
                const dependencies = container.inject.map((dependency) => this.getInstance(dependency));
                const instance = container.createInstance(dependencies);
                if (instance.init) {
                    const res = instance.init();
                    if (res && res.then) {
                        yield res;
                    }
                }
                this.setInstance(container.name, instance);
            }
        });
    }
}
exports.Container = Container;
