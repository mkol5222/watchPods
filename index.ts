import k8s from '@kubernetes/client-node';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
const kc = new k8s.KubeConfig();
kc.loadFromDefault();  // This loads configuration from ~/.kube/config or within the cluster

const watch = new k8s.Watch(kc);
const coreApi = kc.makeApiClient(k8s.CoreV1Api);

// Store the current IP states to detect changes
const podIPs: Record<string, string | undefined> = {};

/**
 * Generate a unique key for each Pod based on its namespace and name
 */
const getPodKey = (namespace: string, name: string) => `${namespace}/${name}`;

/**
 * Handles Pod events to monitor IP changes
 */
const handlePodEvent = (type: string, pod: k8s.V1Pod) => {
    const namespace = pod.metadata?.namespace ?? 'default';
    const name = pod.metadata?.name ?? '';
    const ip = pod.status?.podIP;

    const podKey = getPodKey(namespace, name);

    if (type === 'ADDED' || type === 'MODIFIED') {
        const previousIP = podIPs[podKey];
        
        // Detect if IP is assigned or has changed
        if (previousIP !== ip) {
            console.log(
                `Pod IP change detected: [${type}] Namespace: ${namespace}, Name: ${name}, ` +
                `Previous IP: ${previousIP ?? 'None'}, New IP: ${ip ?? 'None'}`
            );
            podIPs[podKey] = ip; // Update the IP record
        }
    } else if (type === 'DELETED') {
        if (podIPs[podKey]) {
            console.log(
                `Pod removed: Namespace: ${namespace}, Name: ${name}, IP was: ${podIPs[podKey]}`
            );
            delete podIPs[podKey]; // Clean up the record
        }
    }
};

/**
 * Watches the Pod events stream
 */
const watchPodIPs = async () => {
    try {
        await watch.watch(
            '/api/v1/pods',
            {},
            (type, obj) => handlePodEvent(type, obj as k8s.V1Pod),
            (err) => {
                console.error('Error watching pods:', err);
                setTimeout(watchPodIPs, 5000); // Retry after delay on failure
            }
        );
        console.log('Started watching Pod IP changes.');
    } catch (error) {
        console.error('Failed to start watching Pod IP changes:', error);
        setTimeout(watchPodIPs, 5000); // Retry after delay on initial failure
    }
};

watchPodIPs();
