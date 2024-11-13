```shell

mkdir -p ~/w/tmp/podwatcher
cd ~/w/tmp/podwatcher
# Set user name
USER_NAME="podreader"

# Create a private key for the user
openssl genrsa -out ${USER_NAME}.key 2048

# Create a CSR (Certificate Signing Request)
openssl req -new -key ${USER_NAME}.key -out ${USER_NAME}.csr -subj "/CN=${USER_NAME}"

# Sign the certificate with Minikube's CA
chmod o=r ~/.minikube/ca.key
openssl x509 -req -in ${USER_NAME}.csr -CA ~/.minikube/ca.crt -CAkey ~/.minikube/ca.key  -CAcreateserial -out ${USER_NAME}.crt -days 365

### new kubeconfig

# Get the Minikube cluster details
CLUSTER_NAME=$(kubectl config current-context)
KUBE_CONFIG="$USER_NAME.kubeconfig"
echo $KUBE_CONFIG

# Set the server endpoint for the kubeconfig
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')

# Get the Minikube CA certificate
kubectl config view --flatten --minify -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d > ca.crt

# Create kubeconfig for the new user
kubectl config --kubeconfig=${KUBE_CONFIG} set-cluster ${CLUSTER_NAME} \
    --server=${SERVER} \
    --certificate-authority=ca.crt \
    --embed-certs=true

kubectl config --kubeconfig=${KUBE_CONFIG} set-credentials ${USER_NAME} \
    --client-certificate=${USER_NAME}.crt \
    --client-key=${USER_NAME}.key \
    --embed-certs=true

kubectl config --kubeconfig=${KUBE_CONFIG} set-context ${USER_NAME}@${CLUSTER_NAME} \
    --cluster=${CLUSTER_NAME} \
    --user=${USER_NAME}

#kubectl config --kubeconfig=${KUBE_CONFIG} use-context ${USER_NAME}@${CLUSTER_NAME}

# make cluster use role allowing list, read and watch pods
kubectl create clusterrole podreader \
    --verb=get,list,watch \
    --resource=pods
kubectl create clusterrole pod-reader \
    --verb=get,list,watch \
    --resource=pods
k get clusterrole podreader -o yaml

# cluster pod reader role binding
kubectl create clusterrolebinding ${USER_NAME}-pod-reader-binding \
    --clusterrole=pod-reader \
    --user=${USER_NAME}

# Specify the kubeconfig file
kubectl --kubeconfig=${KUBE_CONFIG} get pods -A
echo kubectl --kubeconfig=${KUBE_CONFIG} get pods -A

k get nodes
k get pods

KUBECONFIG=./podreader.kubeconfig k get nodes
KUBECONFIG=./podreader.kubeconfig k get po -A
KUBECONFIG=./podreader.kubeconfig k get po -n d2

k get clusterrolebinding | grep reader
k get clusterrolebinding podreader-pod-reader-binding
k get ClusterRole/pod-reader
k get ClusterRole
k get ClusterRole | grep pod-reader
k get ClusterRole | grep podreader

./watchPods
# or
KUBECONFIG=./newuser.kubeconfig ./watchPods 