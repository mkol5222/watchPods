```shell

# Set user name
USER_NAME="admin2"

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
KUBE_CONFIG="newuser.kubeconfig"

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

kubectl config --kubeconfig=${KUBE_CONFIG} use-context ${USER_NAME}@${CLUSTER_NAME}

# cluster admin for admin2
kubectl create clusterrolebinding ${USER_NAME}-admin-binding \
    --clusterrole=cluster-admin \
    --user=${USER_NAME}

# Specify the kubeconfig file
kubectl --kubeconfig=${KUBE_CONFIG} get pods -A

./watchPods