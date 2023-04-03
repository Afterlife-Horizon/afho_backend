import fs from 'node:fs';

interface IMessageType {
    message?: string;
    file?: string;
}

function splitTokens(message: string): IMessageType[] {
    let returnMessages: IMessageType[] = [];
  
    const codeBlockSelector = "```";
    
    let codeBlock = false;
    let codeBlockType = "";
    let codeBlockMessage = "";
  
    let messageCount = 0;
    let messageContent = "";
  
    let messageArray = message.split(" ");
  
    for (let i = 0; i < messageArray.length; i++) {
        if (messageArray[i].includes(codeBlockSelector)) {
            if (!codeBlock) {

                if (!messageArray[i].startsWith(codeBlockSelector)) {

                    if (messageContent.length + messageArray[i].length + 1 >= 4000) {
                        returnMessages.push({message: messageContent});
                        messageContent = "";
                        messageCount++;
                    }
                    messageContent += messageArray[i].split(codeBlockSelector)[0] + " ";
                    messageArray[i] = messageArray[i].split(codeBlockSelector)[1];
                }

                returnMessages.push({message: messageContent});
                codeBlockType = messageArray[i].replace(codeBlockSelector, "");
                messageContent = "";
                messageCount++;
            }
            else {
                if (!messageArray[i].startsWith(codeBlockSelector)) {
                    codeBlockMessage += messageArray[i].split(codeBlockSelector)[0] + " ";
                    messageArray[i] = messageArray[i].split(codeBlockSelector)[1];
                }

                returnMessages = handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType);
            }
            codeBlock = !codeBlock;
            continue;
        }
  
        if (codeBlock) {
            codeBlockMessage += messageArray[i] + " ";
            continue;
        }
  
        if (messageContent.length + messageArray[i].length + 1 >= 4000) {
            returnMessages.push({message: messageContent});
            messageContent = "";
            messageCount++;
        }
        messageContent += messageArray[i] + " ";
    }
  
    if (!codeBlock) returnMessages.push({message: messageContent});
    else {
        returnMessages = handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType);
    }
    return returnMessages;
  }
  
  
function handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType) {
    if (codeBlockMessage.length > 4000) {
        if (!fs.existsSync("./messages")) fs.mkdirSync("./messages")
        returnMessages.push({file: `codeBlock${messageCount}.txt`})

        codeBlockMessage = codeBlockMessage.replace(/```/g, "");

        fs.writeFile(`./messages/codeBlock${messageCount}.txt`, codeBlockMessage, (err) => {
            if (err) console.log(err);
        });
    }
    else {
        returnMessages.push({message: codeBlockSelector + codeBlockType + "\n" + codeBlockMessage + codeBlockSelector});
    }

    return returnMessages;
}

const message = "Voici un exemple de code mettant en oeuvre l'algorithme A* pour trouver le chemin le plus court entre deux noeuds dans un graphe en C :\n\`\`\`c\n #include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n#define MAX_NODES 100\n#define INF 999999999\n\n// noeud du graphe\ntypedef struct Node {\n    int index; // index du noeud\n    int heuristic; // heuristique du noeud\n    int cost; // coût pour arriver au noeud\n} Node;\n\n// graphe\ntypedef struct Graph {\n    Node nodes[MAX_NODES]; // tableau de noeuds\n    int adj_matrix[MAX_NODES][MAX_NODES]; // matrice d'adjacence\n    int n_nodes; // nombre de noeuds\n} Graph;\n\n// initialisation d'un graphe\nvoid init_graph(Graph* graph) {\n    graph->n_nodes = 0;\n    for (int i = 0; i < MAX_NODES; i++) {\n        for (int j = 0; j < MAX_NODES; j++) {\n            graph->adj_matrix[i][j] = INF;\n        }\n    }\n}\n\n// ajouter un noeud dans un graphe\nvoid add_node(Graph* graph, int index, int heuristic) {\n    graph->nodes[graph->n_nodes].index = index;\n    graph->nodes[graph->n_nodes].heuristic = heuristic;\n    graph->nodes[graph->n_nodes].cost = INF;\n    graph->n_nodes++;\n}\n\n// ajouter une arête dans un graphe\nvoid add_edge(Graph* graph, int i, int j, int weight) {\n    graph->adj_matrix[i][j] = weight;\n}\n\n// trouver le noeud avec le coût le plus faible parmi un ensemble de noeuds\nNode* get_lowest_cost_node(Node** nodes, int n_nodes) {\n    Node* lowest_cost_node = NULL;\n    int min_cost = INF;\n    for (int i = 0; i < n_nodes; i++) {\n        if (nodes[i]->cost < min_cost) {\n            min_cost = nodes[i]->cost;\n            lowest_cost_node = nodes[i];\n        }\n    }\n    return lowest_cost_node;\n}\n\n// calculer le coût pour arriver à un noeud\nint get_cost(Graph* graph, int i, int j) {\n    return graph->adj_matrix[i][j];\n}\n\n// copier un tableau de noeuds\nNode** copy_nodes(Node** nodes, int n_nodes) {\n    Node** new_nodes = malloc(n_nodes * sizeof(Node*));\n    for (int i = 0; i < n_nodes; i++) {\n        new_nodes[i] = malloc(sizeof(Node));\n        memcpy(new_nodes[i], nodes[i], sizeof(Node));\n    }\n    return new_nodes;\n}\n\n// libérer un tableau de noeuds\nvoid free_nodes(Node** nodes, int n_nodes) {\n    for (int i = 0; i < n_nodes; i++) {\n        free(nodes[i]);\n    }\n    free(nodes);\n}\n\n// trouver le chemin le plus court entre les noeuds start_index et end_index dans le graphe\nint a_star(Graph* graph, int start_index, int end_index, int* path) {\n    // initialisation\n    for (int i = 0; i < graph->n_nodes; i++) {\n        if (graph->nodes[i].index == start_index) {\n            graph->nodes[i].cost = 0;\n            break;\n        }\n    }\n    // algorithme A*\n    bool found_path = false;\n    while (!found_path) {\n        bool all_visited = true;\n        for (int i = 0; i < graph->n_nodes; i++) {\n            if (graph->nodes[i].cost < INF) {\n                all_visited = false;\n                break;\n            }\n        }\n        if (all_visited) {\n            break; // tous les noeuds ont été visités, sortie\n        }\n        Node** open_nodes = malloc(graph->n_nodes * sizeof(Node*));\n        int n_open_nodes = 0;\n        Node** closed_nodes = malloc(graph->n_nodes * sizeof(Node*));\n        int n_closed_nodes = 0;\n        for (int i = 0; i < graph->n_nodes; i++) {\n            if (graph->nodes[i].cost < INF && !path_contains(path, graph->nodes[i].index)) {\n                open_nodes[n_open_nodes] = &graph->nodes[i];\n                n_open_nodes++;\n            } else if (graph->nodes[i].cost < INF && path_contains(path, graph->nodes[i].index)) {\n                closed_nodes[n_closed_nodes] = &graph->nodes[i];\n                n_closed_nodes++;\n            }\n        }\n        Node* current_node = get_lowest_cost_node(open_nodes, n_open_nodes);\n        if (current_node == NULL) {\n            break; // aucun chemin possible, sortie\n        }\n        if (current_node->index == end_index) {\n            found_path = true; // chemin trouvé, sortie\n            continue;\n        }\n        for (int i = 0; i < graph->n_nodes; i++) {\n            if (get_cost(graph, current_node->index, i) < INF) {\n                int new_cost = current_node->cost + get_cost(graph, current_node->index, i);\n                int new_heuristic = new_cost + graph->nodes[i].heuristic;\n                Node** new_path = copy_nodes(path, MAX_NODES);\n                new_path[path_length(path)] = current_node;\n                graph->nodes[i].cost = new_cost;\n                graph->nodes[i].heuristic = new_heuristic;\n                free_nodes(path, MAX_NODES);\n                path = new_path;\n            }\n        }\n        free_nodes(open_nodes, graph->n_nodes);\n        free_nodes(closed_nodes, graph->n_nodes);\n    }\n    // construction du chemin\n    if (found_path) {\n        int n_steps = 0;\n        Node* current_node = &graph->nodes[end_index];\n        while (current_node != NULL) {\n            path[n_steps] = current_node->index;\n            n_steps++;\n            current_node = get_lowest_cost_node(&graph->nodes, graph->n_nodes);\n        }\n        reverse_path(path, n_steps);\n        return n_steps;\n    } else {\n        return -1;\n    }\n}\n\n// Fonction auxiliaire pour afficher le chemin\nvoid print_path(int* path, int n_steps) {\n    printf(\"Path: \");\n    for (int i = 0; i < n_steps; i++) {\n        printf(\"%d \", path[i]);\n    }\n    printf(\"\n\");\n}\n\nint main() {\n    // création du graphe\n    Graph graph;\n    init_graph(&graph);\n    add_node(&graph, 0, 10);\n    add_node(&graph, 1, 5);\n    add_node(&graph, 2, 7);\n    add_node(&graph, 3, 8);\n    add_edge(&graph, 0, 1, 2);\n    add_edge(&graph, 0, 2, 3);\n    add_edge(&graph, 1, 2, 1);\n    add_edge(&graph, 2, 3, 4);\n\n    // recherche du chemin le plus court\n    int path[MAX_NODES];\n    memset(path, -1, MAX_NODES * sizeof(int));\n    int n_steps = a_star(&graph, 0, 3, path);\n    if (n_steps != -1) {\n        print_path(path, n_steps);\n    } else {\n        printf(\"No path found!\n\");\n    }\n\n    return 0;\n}\n\`\`\`"

console.log(splitTokens(message))