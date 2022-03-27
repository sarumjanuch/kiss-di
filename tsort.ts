import {ClassWrapper} from "./index";

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

export function topologyBuilder(graph: Graph) {
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
