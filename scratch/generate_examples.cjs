const fs = require('fs');
const path = require('path');

const outputDir = 'c:/Users/LEGION/Desktop/Graph/GraphLab/examples_json';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const examples = {
    'bfs_dfs': {
        nodes: [0, 1, 2, 3, 4, 5, 6],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 1 },
            { id: 'e2', from: 0, to: 2, weight: 1 },
            { id: 'e3', from: 1, to: 3, weight: 1 },
            { id: 'e4', from: 1, to: 4, weight: 1 },
            { id: 'e5', from: 2, to: 5, weight: 1 },
            { id: 'e6', from: 2, to: 6, weight: 1 },
            { id: 'e7', from: 3, to: 4, weight: 1 },
            { id: 'e8', from: 5, to: 6, weight: 1 }
        ],
        directed: false,
        weighted: false,
        positions: {
            0: { x: 450, y: 50 },
            1: { x: 250, y: 150 },
            2: { x: 650, y: 150 },
            3: { x: 150, y: 300 },
            4: { x: 350, y: 300 },
            5: { x: 550, y: 300 },
            6: { x: 750, y: 300 }
        }
    },
    'dijkstra': {
        nodes: [0, 1, 2, 3, 4, 5],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 7 },
            { id: 'e2', from: 0, to: 2, weight: 9 },
            { id: 'e3', from: 0, to: 5, weight: 14 },
            { id: 'e4', from: 1, to: 2, weight: 10 },
            { id: 'e5', from: 1, to: 3, weight: 15 },
            { id: 'e6', from: 2, to: 3, weight: 11 },
            { id: 'e7', from: 2, to: 5, weight: 2 },
            { id: 'e8', from: 3, to: 4, weight: 6 },
            { id: 'e9', from: 5, to: 4, weight: 9 }
        ],
        directed: true,
        weighted: true,
        positions: {
            0: { x: 100, y: 100 },
            1: { x: 400, y: 100 },
            2: { x: 250, y: 260 },
            3: { x: 700, y: 100 },
            4: { x: 800, y: 400 },
            5: { x: 400, y: 400 }
        }
    },
    'mst_kruskal_prim': {
        nodes: [0, 1, 2, 3, 4, 5, 6],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 2 },
            { id: 'e2', from: 0, to: 3, weight: 1 },
            { id: 'e3', from: 1, to: 2, weight: 3 },
            { id: 'e4', from: 1, to: 3, weight: 3 },
            { id: 'e5', from: 1, to: 4, weight: 10 },
            { id: 'e6', from: 2, to: 4, weight: 5 },
            { id: 'e7', from: 3, to: 4, weight: 2 },
            { id: 'e8', from: 3, to: 5, weight: 8 },
            { id: 'e9', from: 3, to: 6, weight: 4 },
            { id: 'e10', from: 4, to: 6, weight: 6 },
            { id: 'e11', from: 5, to: 6, weight: 1 }
        ],
        directed: false,
        weighted: true,
        positions: {
            0: { x: 100, y: 260 },
            1: { x: 250, y: 100 },
            2: { x: 500, y: 100 },
            3: { x: 250, y: 420 },
            4: { x: 500, y: 420 },
            5: { x: 800, y: 420 },
            6: { x: 800, y: 260 }
        }
    },
    'max_flow': {
        nodes: [0, 1, 2, 3, 4, 5],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 10 },
            { id: 'e2', from: 0, to: 2, weight: 10 },
            { id: 'e3', from: 1, to: 2, weight: 2 },
            { id: 'e4', from: 1, to: 3, weight: 4 },
            { id: 'e5', from: 1, to: 4, weight: 8 },
            { id: 'e6', from: 2, to: 4, weight: 9 },
            { id: 'e7', from: 3, to: 5, weight: 10 },
            { id: 'e8', from: 4, to: 3, weight: 6 },
            { id: 'e9', from: 4, to: 5, weight: 10 }
        ],
        directed: true,
        weighted: true,
        positions: {
            0: { x: 50, y: 260 },
            1: { x: 250, y: 150 },
            2: { x: 250, y: 370 },
            3: { x: 600, y: 150 },
            4: { x: 600, y: 370 },
            5: { x: 850, y: 260 }
        }
    },
    'connected_components': {
        nodes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 1 },
            { id: 'e2', from: 1, to: 2, weight: 1 },
            { id: 'e3', from: 2, to: 0, weight: 1 },
            { id: 'e4', from: 3, to: 4, weight: 1 },
            { id: 'e5', from: 4, to: 5, weight: 1 },
            { id: 'e6', from: 5, to: 3, weight: 1 },
            { id: 'e7', from: 6, to: 7, weight: 1 },
            { id: 'e8', from: 8, to: 9, weight: 1 }
        ],
        directed: false,
        weighted: false,
        positions: {
            0: { x: 100, y: 100 },
            1: { x: 200, y: 50 },
            2: { x: 200, y: 150 },
            3: { x: 400, y: 400 },
            4: { x: 500, y: 350 },
            5: { x: 500, y: 450 },
            6: { x: 700, y: 100 },
            7: { x: 800, y: 100 },
            8: { x: 700, y: 300 },
            9: { x: 800, y: 300 }
        }
    },
    'scc': {
        nodes: [0, 1, 2, 3, 4, 5, 6, 7],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 1 },
            { id: 'e2', from: 1, to: 2, weight: 1 },
            { id: 'e3', from: 2, to: 0, weight: 1 },
            { id: 'e4', from: 2, to: 3, weight: 1 },
            { id: 'e5', from: 3, to: 4, weight: 1 },
            { id: 'e6', from: 4, to: 5, weight: 1 },
            { id: 'e7', from: 5, to: 3, weight: 1 },
            { id: 'e8', from: 5, to: 6, weight: 1 },
            { id: 'e9', from: 6, to: 7, weight: 1 },
            { id: 'e10', from: 7, to: 6, weight: 1 }
        ],
        directed: true,
        weighted: false,
        positions: {
            0: { x: 100, y: 100 },
            1: { x: 250, y: 50 },
            2: { x: 200, y: 200 },
            3: { x: 400, y: 200 },
            4: { x: 550, y: 150 },
            5: { x: 500, y: 300 },
            6: { x: 700, y: 300 },
            7: { x: 850, y: 300 }
        }
    },
    'bellman_ford': {
        nodes: [0, 1, 2, 3, 4],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 6 },
            { id: 'e2', from: 0, to: 2, weight: 7 },
            { id: 'e3', from: 1, to: 2, weight: 8 },
            { id: 'e4', from: 1, to: 3, weight: 5 },
            { id: 'e5', from: 1, to: 4, weight: -4 },
            { id: 'e6', from: 2, to: 3, weight: -3 },
            { id: 'e7', from: 2, to: 4, weight: 9 },
            { id: 'e8', from: 3, to: 1, weight: -2 },
            { id: 'e9', from: 4, to: 0, weight: 2 },
            { id: 'e10', from: 4, to: 3, weight: 7 }
        ],
        directed: true,
        weighted: true,
        positions: {
            0: { x: 100, y: 260 },
            1: { x: 300, y: 100 },
            2: { x: 300, y: 420 },
            3: { x: 600, y: 260 },
            4: { x: 800, y: 260 }
        }
    },
    'coloring_wp': {
        nodes: [0, 1, 2, 3, 4, 5],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 1 },
            { id: 'e2', from: 0, to: 2, weight: 1 },
            { id: 'e3', from: 0, to: 3, weight: 1 },
            { id: 'e4', from: 0, to: 4, weight: 1 },
            { id: 'e5', from: 0, to: 5, weight: 1 },
            { id: 'e6', from: 1, to: 2, weight: 1 },
            { id: 'e7', from: 2, to: 3, weight: 1 },
            { id: 'e8', from: 3, to: 4, weight: 1 },
            { id: 'e9', from: 4, to: 5, weight: 1 },
            { id: 'e10', from: 5, to: 1, weight: 1 }
        ],
        directed: false,
        weighted: false,
        positions: {
            0: { x: 450, y: 260 },
            1: { x: 450, y: 60 },
            2: { x: 650, y: 160 },
            3: { x: 650, y: 360 },
            4: { x: 250, y: 360 },
            5: { x: 250, y: 160 }
        }
    },
    'eulerian': {
        nodes: [0, 1, 2, 3, 4, 5],
        edges: [
            { id: 'e1', from: 0, to: 1, weight: 1 },
            { id: 'e2', from: 1, to: 2, weight: 1 },
            { id: 'e3', from: 2, to: 0, weight: 1 },
            { id: 'e4', from: 0, to: 3, weight: 1 },
            { id: 'e5', from: 3, to: 4, weight: 1 },
            { id: 'e6', from: 4, to: 0, weight: 1 },
            { id: 'e7', from: 2, to: 5, weight: 1 },
            { id: 'e8', from: 5, to: 4, weight: 1 }
        ],
        directed: false,
        weighted: false,
        positions: {
            0: { x: 450, y: 260 },
            1: { x: 300, y: 100 },
            2: { x: 600, y: 100 },
            3: { x: 300, y: 420 },
            4: { x: 600, y: 420 },
            5: { x: 800, y: 260 }
        }
    }
};

for (const [name, data] of Object.entries(examples)) {
    fs.writeFileSync(path.join(outputDir, `${name}.json`), JSON.stringify(data, null, 2));
}

console.log('All examples generated successfully in examples_json folder.');
