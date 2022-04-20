type GraphCache = Record<string, boolean>
type Graph = Record<string, ClassWrapper<any>>

function topologicalSortHelper(node: ClassWrapper<any>, visited: GraphCache, temp: GraphCache, graph: Graph, result: ClassWrapper<any>[]) {
    temp[node.name] = true;
    let neighbors = node.inject;
    if (!graph[node.name]) {
        throw new Error('Unknown Dependency: ' + node.name);
    }
    for (let i = 0; i < neighbors.length; i += 1) {
        let n = graph[neighbors[i]];
        if (!n) {
            throw new Error(
                `Unknown Dependency: ${neighbors[i]} for ${node.name}`
            );
        }
        if (temp[n.name]) {
            throw new Error(
                'Circular Dependency Detected: ' +
                Object.keys(temp)
                    .filter((item) => {
                        return temp[item];
                    })
                    .join(' <- ')
            );
        }
        if (!visited[n.name]) {
            topologicalSortHelper(n, visited, temp, graph, result);
        }
    }
    temp[node.name] = false;
    visited[node.name] = true;
    result.push(node);
}

function topologyBuilder(graph: Graph) {
    const result: ClassWrapper<any>[] = [];
    const visited: GraphCache = {};
    const temp: GraphCache = {};
    for (let node in graph) {
        if (!visited[graph[node].name] && !temp[graph[node].name]) {
            topologicalSortHelper(graph[node], visited, temp, graph, result);
        }
    }
    return result;
}

function randomId(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export interface InjectableClass<R> {
    new (...args: any): R;
    readonly inject?: string[];
}
enum INSTANCES_TYPES  {
    SERVICE,
    CONTROLLER
}

export class ClassWrapper<T> {
    public readonly name: string
    public readonly fn: InjectableClass<T>
    public readonly type: INSTANCES_TYPES
    public readonly inject: string[];
    constructor(name: string, fn: InjectableClass<T>, type: INSTANCES_TYPES) {
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

    createInstance(deps: Function[] | undefined) {
        // @ts-ignore
        return new this.fn(...deps);
    }
}

export class Container {
    private instances: Map<string, Function>
    private registry: Map<string, ClassWrapper<any>>
    private topology: ClassWrapper<any>[]
    constructor() {
        this.instances = new Map<string, Function>();
        this.registry = new Map();
        this.topology = [];
    }

    getInstance(name: string) {
        if (!this.instances.has(name))
            throw new Error(
                `Instance for ${name} does not exist in DI container`
            );
        return this.instances.get(name);
    }

    setInstance(name: string, instance: Function) {
        if (this.instances.has(name))
            throw new Error(
                `Container with name ${name} already exist in DI container`
            );

        this.instances.set(name, instance);
    }

    setConstructor<T>(name: string, fn: InjectableClass<T>, type: INSTANCES_TYPES) {
        if (this.registry.has(name))
            throw new Error(
                `Constructor with name ${name} already exist in DI container`
            );
        this.registry.set(name, new ClassWrapper<T>(name, fn, type));
    }

    getConstructor(name: string) {
        if (!this.registry.has(name))
            throw new Error(
                `Constructor with name ${name} does not exist in DI container`
            );
        return this.registry.get(name);
    }

    registerService<T>(name: string, fn: InjectableClass<T>) {
        this.setConstructor(name, fn, INSTANCES_TYPES.SERVICE);
    }

    registerController<T>(fn: InjectableClass<T>) {
        this.setConstructor(randomId(8) + '-controller', fn, INSTANCES_TYPES.CONTROLLER);
    }

    buildTopology() {
        //Map to Object Literal;

        this.topology = topologyBuilder(
            [...this.registry.entries()].reduce(
                // @ts-ignore
                (obj, [key, value]) => ((obj[key] = value), obj),
                {}
            )
        );
        return this.topology;
    }

    async initializeTopology() {
        for (const container of this.topology) {
            const dependencies = container.inject.map((dependency) =>
                this.getInstance(dependency)
            ) as Function[]
            const instance = container.createInstance(dependencies);
            if (instance.init) {
                const res = instance.init();
                if (res.then) {
                    await res
                }
            }
            this.setInstance(container.name, instance);
        }
    }
}

