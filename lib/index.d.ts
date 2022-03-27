export interface InjectableClass<R> {
    new (...args: any): R;
    readonly inject?: string[];
}
declare enum INSTANCES_TYPES {
    SERVICE = 0,
    CONTROLLER = 1
}
export declare class ClassWrapper<T> {
    readonly name: string;
    readonly fn: InjectableClass<T>;
    readonly type: INSTANCES_TYPES;
    readonly inject: string[];
    constructor(name: string, fn: InjectableClass<T>, type: INSTANCES_TYPES);
    createInstance(deps: Function[] | undefined): T;
}
export declare class Container {
    private instances;
    private registry;
    private topology;
    constructor();
    getInstance(name: string): Function | undefined;
    setInstance(name: string, instance: Function): void;
    setConstructor<T>(name: string, fn: InjectableClass<T>, type: INSTANCES_TYPES): void;
    getConstructor(name: string): ClassWrapper<any> | undefined;
    registerService<T>(name: string, fn: InjectableClass<T>): void;
    registerController<T>(fn: InjectableClass<T>): void;
    buildTopology(): ClassWrapper<any>[];
    initializeTopology(): Promise<void>;
}
export {};
